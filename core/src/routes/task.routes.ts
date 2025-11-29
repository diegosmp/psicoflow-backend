import { FastifyInstance } from 'fastify';
import { TaskController } from '../controllers/task.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

export async function taskRoutes(fastify: FastifyInstance) {
  fastify.post('/', { preHandler: authMiddleware }, TaskController.createTask);
  fastify.get('/', { preHandler: authMiddleware }, TaskController.listTasks);
  fastify.patch('/:id/complete', { preHandler: authMiddleware }, TaskController.completeTask);
}
