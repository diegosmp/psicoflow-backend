import Fastify from 'fastify';
import cors from '@fastify/cors';
import socketio from 'fastify-socket.io';
import dotenv from 'dotenv';
import { userRoutes } from './routes/user.routes';
import { medicalRecordRoutes } from './routes/medical-record.routes';
import { taskRoutes } from './routes/task.routes';
import { ChatService } from './services/chat.service';

dotenv.config();

const server = Fastify({
  logger: true
});

server.register(cors, {
  origin: '*' // Configure correctly for production
});

server.register(socketio, {
  cors: {
    origin: '*',
  }
});

server.register(require('@fastify/swagger'), {
  swagger: {
    info: {
      title: 'Psicoflow Core API',
      description: 'Core API for Psicoflow SaaS',
      version: '1.0.0'
    },
    host: 'localhost:3333',
    schemes: ['http'],
    consumes: ['application/json'],
    produces: ['application/json'],
  }
});

server.register(require('@fastify/swagger-ui'), {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'full',
    deepLinking: false
  },
  staticCSP: true,
  transformStaticCSP: (header: any) => header
});

server.register(userRoutes, { prefix: '/api/users' });
server.register(medicalRecordRoutes, { prefix: '/api/medical-records' });
server.register(taskRoutes, { prefix: '/api/tasks' });

server.get('/', async (request, reply) => {
  return { status: 'ok', message: 'Psicoflow API is running' };
});

server.ready(err => {
  if (err) throw err;
  
  new ChatService(server.io);
  
  server.io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);
  });
});

const start = async () => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    const host = '0.0.0.0';
    const serviceName = 'core';
    const serviceUrl = `http://localhost:${port}`;
    const discoveryUrl = 'http://localhost:3001';

    await server.listen({ port, host });
    console.log(`Server listening on port ${port}`);

    // Register with Service Discovery
    const { registerService, sendHeartbeat } = await import('./utils/service-registration');
    const serviceId = await registerService(serviceName, serviceUrl, discoveryUrl);

    if (serviceId) {
      // Send heartbeat every 20 seconds
      setInterval(() => {
        sendHeartbeat(serviceName, serviceId, discoveryUrl);
      }, 20000);
    }
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
