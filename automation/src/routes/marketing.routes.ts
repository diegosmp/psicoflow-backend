import { FastifyInstance } from 'fastify';
import { MarketingController } from '../controllers/marketing.controller';

const marketingController = new MarketingController();

export async function marketingRoutes(app: FastifyInstance) {
  app.get('/expiring-trials', {
    schema: {
      tags: ['Marketing'],
      summary: 'Get users with expiring trials',
      querystring: {
        type: 'object',
        properties: {
          days: { type: 'integer', default: 7 }
        }
      }
    }
  }, marketingController.getExpiringTrials);

  app.get('/overdue-users', {
    schema: {
      tags: ['Marketing'],
      summary: 'Get users with overdue subscriptions'
    }
  }, marketingController.getOverdueUsers);

  app.post('/trigger', {
    schema: {
      tags: ['Automation'],
      summary: 'Manually trigger an n8n workflow',
      body: {
        type: 'object',
        required: ['workflowId'],
        properties: {
          workflowId: { type: 'string' },
          data: { type: 'object' }
        }
      }
    }
  }, marketingController.triggerManualWorkflow);
}
