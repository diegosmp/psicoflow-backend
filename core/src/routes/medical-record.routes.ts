import { FastifyInstance } from 'fastify';
import { MedicalRecordController } from '../controllers/medical-record.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

export async function medicalRecordRoutes(fastify: FastifyInstance) {
  fastify.post('/', { preHandler: authMiddleware }, MedicalRecordController.createRecord);
  fastify.get('/:id/pdf', { preHandler: authMiddleware }, MedicalRecordController.generatePdf);
}
