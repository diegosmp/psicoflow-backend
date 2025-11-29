import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { OAuth2Client } from 'google-auth-library';

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  password: z.string().min(6),
  role: z.enum(['PSYCHOLOGIST', 'PATIENT']),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const googleLoginSchema = z.object({
  token: z.string(),
});

export class AuthController {
  private googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  async register(req: FastifyRequest, reply: FastifyReply) {
    const { email, name, password, role } = registerSchema.parse(req.body);

    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return reply.status(400).send({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role,
      },
    });

    const token = await reply.jwtSign({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return reply.status(201).send({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  }

  async login(req: FastifyRequest, reply: FastifyReply) {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      return reply.status(400).send({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return reply.status(400).send({ message: 'Invalid credentials' });
    }

    const token = await reply.jwtSign({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return reply.send({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  }

  async googleLogin(req: FastifyRequest, reply: FastifyReply) {
    const { token } = googleLoginSchema.parse(req.body);

    const ticket = await this.googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return reply.status(400).send({ message: 'Invalid Google token' });
    }

    let user = await prisma.user.findUnique({ where: { email: payload.email } });

    if (!user) {
      // Create user if not exists (defaulting to PATIENT if not specified, or handle role selection)
      // For simplicity, we might reject or default. Let's default to PATIENT for now or error.
      // Better to require registration for role selection, or infer.
      // Assuming existing users or auto-registration as PATIENT.
      user = await prisma.user.create({
        data: {
          email: payload.email,
          name: payload.name || 'Unknown',
          role: 'PATIENT', // Default role
        },
      });
    }

    const jwt = await reply.jwtSign({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return reply.send({ token: jwt, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  }
}
