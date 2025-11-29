import Fastify from 'fastify';
import jwt from '@fastify/jwt';
import 'dotenv/config';
import { authRoutes } from './routes/auth.routes';

const app = Fastify({ logger: true });

app.register(jwt, {
  secret: process.env.JWT_SECRET || 'supersecret',
});

app.register(require('@fastify/swagger'), {
  swagger: {
    info: {
      title: 'Psicoflow Auth API',
      description: 'Authentication Service for Psicoflow SaaS',
      version: '1.0.0'
    },
    host: 'localhost:3002',
    schemes: ['http'],
    consumes: ['application/json'],
    produces: ['application/json'],
  }
});

app.register(require('@fastify/swagger-ui'), {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'full',
    deepLinking: false
  },
  staticCSP: true,
  transformStaticCSP: (header: any) => header
});

app.register(authRoutes);

import { registerService, sendHeartbeat } from './utils/service-registration';

async function start() {
  try {
    const port = Number(process.env.PORT) || 3002;
    const host = '0.0.0.0';
    const serviceName = 'auth';
    const serviceUrl = `http://localhost:${port}`; // Or use container name if in docker network
    const discoveryUrl = 'http://localhost:3001';

    await app.listen({ port, host });
    console.log(`Auth Service running on port ${port}`);

    // Register with Service Discovery
    const serviceId = await registerService(serviceName, serviceUrl, discoveryUrl);

    if (serviceId) {
      // Send heartbeat every 20 seconds
      setInterval(() => {
        sendHeartbeat(serviceName, serviceId, discoveryUrl);
      }, 20000);
    }

  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
