import { FastifyInstance } from 'fastify';
import { UserController } from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

export async function userRoutes(fastify: FastifyInstance) {
  fastify.post('/invite', { preHandler: authMiddleware }, UserController.invitePatient);
  fastify.post('/register', UserController.registerPatient);
  fastify.get('/me', { preHandler: authMiddleware }, UserController.me);
}
