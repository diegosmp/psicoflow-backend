import { FastifyInstance } from 'fastify';
import { MarketingController } from '../controllers/marketing.controller';

const marketingController = new MarketingController();

export async function marketingRoutes(app: FastifyInstance) {
  app.get('/expiring-trials', {
    schema: {
      tags: ['Marketing'],
      summary: 'Get users with expiring trials',
      description: 'Returns a list of users whose trial ends within the specified number of days.',
      querystring: {
        type: 'object',
        properties: {
          days: { type: 'integer', default: 7, description: 'Number of days to check for expiration' }
        }
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string' },
              trialEndsAt: { type: 'string', format: 'date-time' }
            }
          }
        }
      }
    }
  }, marketingController.getExpiringTrials);

  app.get('/overdue-users', {
    schema: {
      tags: ['Marketing'],
      summary: 'Get users with overdue subscriptions',
      description: 'Returns a list of users whose subscription status is OVERDUE.',
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string' },
              planType: { type: 'string' }
            }
          }
        }
      }
    }
  }, marketingController.getOverdueUsers);
}
