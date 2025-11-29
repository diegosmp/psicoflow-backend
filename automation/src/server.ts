import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { marketingRoutes } from './routes/marketing.routes';
import { registerService, sendHeartbeat } from './utils/service-registration';

dotenv.config();

const server = Fastify({
  logger: true
});

server.register(cors, {
  origin: '*'
});

server.register(require('@fastify/swagger'), {
  swagger: {
    info: {
      title: 'Psicoflow Automation API',
      description: 'Automation Service for Psicoflow SaaS',
      version: '1.0.0'
    },
    host: process.env.SERVICE_URL ? process.env.SERVICE_URL.replace(/^https?:\/\//, '') : 'localhost:3003',
    schemes: ['http'],
    consumes: ['application/json'],
    produces: ['application/json'],
  }
});

server.register(require('@fastify/swagger-ui'), {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'full',
    deepLinking: false
  },
  staticCSP: true,
  transformStaticCSP: (header: any) => header
});

server.register(marketingRoutes, { prefix: '/api/marketing' });

server.get('/', async (request, reply) => {
  return { status: 'ok', message: 'Psicoflow Automation Service is running' };
});

const start = async () => {
  try {
    console.log(`Starting Automation Service in ${process.env.NODE_ENV || 'development'} mode`);

    const port = process.env.PORT ? parseInt(process.env.PORT) : 3003;
    const host = '0.0.0.0';
    const serviceName = 'automation';
    const serviceUrl = process.env.SERVICE_URL || `http://localhost:${port}`;
    const discoveryUrl = process.env.SERVICE_DISCOVERY_URL || 'http://localhost:3001';

    await server.listen({ port, host });
    console.log(`Automation Service running on port ${port} (${process.env.NODE_ENV})`);

    // Register with Service Discovery
    const serviceId = await registerService(serviceName, serviceUrl, discoveryUrl);

    if (serviceId) {
      // Send heartbeat every 20 seconds
      setInterval(() => {
        sendHeartbeat(serviceName, serviceId, discoveryUrl);
      }, 20000);
    }
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
