import { Server, Socket } from 'socket.io';
import { prisma } from '../lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export class ChatService {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    this.setupSocket();
  }

  private setupSocket() {
    this.io.on('connection', (socket: Socket) => {
      console.log('User connected:', socket.id);

      socket.on('join_room', (roomId: string) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room ${roomId}`);
      });

      socket.on('send_message', async (data: { content: string; senderId: string; receiverId: string }) => {
        const { content, senderId, receiverId } = data;

        // Save message to DB
        const message = await prisma.message.create({
          data: {
            content,
            senderId,
            receiverId
          },
          include: {
            sender: true
          }
        });

        // Emit to receiver (and sender for confirmation)
        // Room ID could be a combination of IDs or just emit to specific user room if they joined their own ID
        // For simplicity, let's assume they join a room named after their ID
        this.io.to(receiverId).emit('receive_message', message);
        this.io.to(senderId).emit('message_sent', message);

        // AI Integration (Gemini)
        // Check if receiver is a psychologist and has plan >= INTERMEDIATE
        const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
        
        if (receiver && receiver.role === 'PSYCHOLOGIST' && 
           (receiver.planType === 'INTERMEDIATE' || receiver.planType === 'COMPLETE')) {
             
             this.generateAISuggestion(content, senderId, receiverId);
        }
      });
    });
  }

  private async generateAISuggestion(userMessage: string, patientId: string, psychologistId: string) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      const prompt = `You are a helpful assistant for a psychologist. 
      The patient said: "${userMessage}". 
      Suggest a professional and empathetic response for the psychologist.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const suggestion = response.text();

      // Send suggestion only to psychologist
      this.io.to(psychologistId).emit('ai_suggestion', {
        patientId,
        suggestion
      });
    } catch (error) {
      console.error('Error generating AI suggestion:', error);
    }
  }
}
