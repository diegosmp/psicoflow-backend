import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { N8nService } from '../services/n8n.service';

export class MarketingController {
  private n8nService: N8nService;

  constructor() {
    this.n8nService = new N8nService();
  }

  getExpiringTrials = async (request: FastifyRequest, reply: FastifyReply) => {
    const schema = z.object({
      days: z.coerce.number().default(7),
    });

    const { days } = schema.parse(request.query);

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    try {
      const users = await prisma.user.findMany({
        where: {
          subscriptionStatus: 'TRIAL',
          trialEndsAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          trialEndsAt: true,
        },
      });

      return reply.send({ data: users });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ message: 'Internal Server Error' });
    }
  }

  getOverdueUsers = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const users = await prisma.user.findMany({
        where: {
          subscriptionStatus: 'OVERDUE',
        },
        select: {
          id: true,
          name: true,
          email: true,
          planType: true,
        },
      });

      return reply.send({ data: users });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ message: 'Internal Server Error' });
    }
  }

  triggerManualWorkflow = async (request: FastifyRequest, reply: FastifyReply) => {
    const schema = z.object({
      workflowId: z.string(),
      data: z.record(z.string(), z.any()).optional(),
    });

    const { workflowId, data } = schema.parse(request.body);

    try {
      // Assuming webhook path corresponds to workflow ID or name
      const result = await this.n8nService.triggerWorkflow(workflowId, data);
      return reply.send({ success: true, result });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ 
        message: 'Failed to trigger workflow',
        error: error.message,
        details: error.response?.data
      });
    }
  }
}
