import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';
import { PdfService } from '../services/pdf.service';
import { z } from 'zod';

export class MedicalRecordController {
  static async createRecord(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user;
    if (!user || user.role !== 'PSYCHOLOGIST') {
      return reply.status(403).send({ error: 'Only psychologists can create records' });
    }

    const schema = z.object({
      patientId: z.string(),
      content: z.string()
    });

    const { patientId, content } = schema.parse(request.body);

    // Verify patient belongs to psychologist
    const patient = await prisma.user.findUnique({
      where: { id: patientId }
    });

    if (!patient || patient.psychologistId !== user.id) {
      return reply.status(403).send({ error: 'Patient not found or not assigned to you' });
    }

    const record = await prisma.medicalRecord.create({
      data: {
        content,
        patientId
      }
    });

    return reply.send(record);
  }

  static async generatePdf(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user;
    const { id } = request.params as { id: string };

    const record = await prisma.medicalRecord.findUnique({
      where: { id },
      include: { patient: true }
    });

    if (!record) {
      return reply.status(404).send({ error: 'Record not found' });
    }

    // Check access
    if (user?.role === 'PSYCHOLOGIST') {
        if (record.patient.psychologistId !== user.id) {
             return reply.status(403).send({ error: 'Access denied' });
        }
    } else if (user?.role === 'PATIENT') {
        if (record.patientId !== user.id) {
            return reply.status(403).send({ error: 'Access denied' });
        }
    } else {
         return reply.status(403).send({ error: 'Unauthorized' });
    }

    const pdfBuffer = await PdfService.generateMedicalRecordPdf(record.patient.name, record.content);

    reply.header('Content-Type', 'application/pdf');
    reply.header('Content-Disposition', `attachment; filename=record-${id}.pdf`);
    return reply.send(pdfBuffer);
  }
}
