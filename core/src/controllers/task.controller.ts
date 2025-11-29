import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

export class TaskController {
  static async createTask(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user;
    if (!user || user.role !== 'PSYCHOLOGIST') {
      return reply.status(403).send({ error: 'Only psychologists can create tasks' });
    }

    const schema = z.object({
      title: z.string(),
      description: z.string().optional(),
      patientId: z.string()
    });

    const { title, description, patientId } = schema.parse(request.body);

    // Verify patient belongs to psychologist
    const patient = await prisma.user.findUnique({
      where: { id: patientId }
    });

    if (!patient || patient.psychologistId !== user.id) {
      return reply.status(403).send({ error: 'Patient not found or not assigned to you' });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description ?? null,
        patientId
      }
    });

    return reply.send(task);
  }

  static async listTasks(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user;
    
    if (!user) return reply.status(401).send({ error: 'Unauthorized' });

    let tasks;
    if (user.role === 'PATIENT') {
      tasks = await prisma.task.findMany({
        where: { patientId: user.id },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      // Psychologist - list tasks for a specific patient (passed via query)
      const { patientId } = request.query as { patientId?: string };
      if (!patientId) {
        return reply.status(400).send({ error: 'Patient ID required' });
      }
      
      // Verify access
      const patient = await prisma.user.findUnique({ where: { id: patientId } });
      if (!patient || patient.psychologistId !== user.id) {
         return reply.status(403).send({ error: 'Access denied' });
      }

      tasks = await prisma.task.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' }
      });
    }

    return reply.send(tasks);
  }

  static async completeTask(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user;
    const { id } = request.params as { id: string };

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return reply.status(404).send({ error: 'Task not found' });

    if (user?.role === 'PATIENT') {
        if (task.patientId !== user.id) return reply.status(403).send({ error: 'Access denied' });
    } else if (user?.role === 'PSYCHOLOGIST') {
        // Check if patient belongs to psychologist
        const patient = await prisma.user.findUnique({ where: { id: task.patientId } });
        if (!patient || patient.psychologistId !== user.id) return reply.status(403).send({ error: 'Access denied' });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: { completed: true }
    });

    return reply.send(updatedTask);
  }
}
