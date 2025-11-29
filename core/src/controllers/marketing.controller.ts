import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

export class MarketingController {
  async getExpiringTrials(request: FastifyRequest, reply: FastifyReply) {
    const schema = z.object({
      days: z.coerce.number().default(7),
    });

    const { days } = schema.parse(request.query);

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    
    // Start of the target day
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    // End of the target day
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

      return reply.send(users);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ message: 'Internal Server Error' });
    }
  }

  async getOverdueUsers(request: FastifyRequest, reply: FastifyReply) {
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

      return reply.send(users);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ message: 'Internal Server Error' });
    }
  }
}
