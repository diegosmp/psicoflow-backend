import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

// Extend FastifyRequest to include user
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      role: string;
      planType?: string;
    };
  }
}

export const authMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return reply.status(401).send({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return reply.status(401).send({ error: 'Invalid token format' });
    }

    // In a real scenario, verify with external provider or use public key
    // For this MVP/Monolith setup, we'll use the local secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as any;
    
    request.user = decoded;
  } catch (err) {
    return reply.status(401).send({ error: 'Invalid token' });
  }
};
