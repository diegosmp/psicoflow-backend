import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

export class UserController {
  static async invitePatient(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user;
    if (!user || user.role !== 'PSYCHOLOGIST') {
      return reply.status(403).send({ error: 'Only psychologists can invite patients' });
    }

    // Check plan limits
    const psychologist = await prisma.user.findUnique({
      where: { id: user.id },
      include: { patients: true }
    });

    if (!psychologist) {
      return reply.status(404).send({ error: 'Psychologist not found' });
    }

    const patientCount = psychologist.patients.length;
    let limit = 10; // Basic
    if (psychologist.planType === 'INTERMEDIATE') limit = 30;
    if (psychologist.planType === 'COMPLETE') limit = 999999;

    if (patientCount >= limit) {
      return reply.status(403).send({ error: 'Plan limit reached' });
    }

    // Generate invite link (mock)
    const inviteLink = `https://app.psisaas.com/register?invite=${user.id}`;
    
    return reply.send({ inviteLink });
  }

  static async registerPatient(request: FastifyRequest, reply: FastifyReply) {
    const schema = z.object({
      email: z.string().email(),
      name: z.string(),
      password: z.string().min(6), // In real app, hash this!
      inviteCode: z.string()
    });

    const body = schema.parse(request.body);

    // Verify invite code (psychologist ID)
    const psychologist = await prisma.user.findUnique({
      where: { id: body.inviteCode }
    });

    if (!psychologist || psychologist.role !== 'PSYCHOLOGIST') {
      return reply.status(400).send({ error: 'Invalid invite code' });
    }

    // Create patient
    const patient = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        role: 'PATIENT',
        psychologistId: psychologist.id
        // Password would be handled by Auth Service, here we just create the user record
      }
    });

    return reply.send(patient);
  }
  
  static async me(request: FastifyRequest, reply: FastifyReply) {
      return reply.send(request.user);
  }
}
