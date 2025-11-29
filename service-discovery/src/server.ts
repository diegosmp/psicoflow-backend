import Fastify from 'fastify';
import 'dotenv/config';
import { configureRedis } from './config/redis';
import { discoveryRoutes } from './routes/discovery.routes';

const app = Fastify({ logger: true });

async function start() {
  try {
    await app.register(require('@fastify/swagger'), {
      swagger: {
        info: {
          title: 'Psicoflow Service Discovery API',
          description: 'Service Discovery and API Gateway for Psicoflow SaaS',
          version: '1.0.0'
        },
        host: 'localhost:3001',
        schemes: ['http'],
        consumes: ['application/json'],
        produces: ['application/json'],
      }
    });

    await app.register(require('@fastify/swagger-ui'), {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'full',
        deepLinking: false
      },
      staticCSP: true,
      transformStaticCSP: (header: any) => header
    });

    await configureRedis(app);
    await app.register(discoveryRoutes);

    // API Gateway Configuration
    const { ServiceRegistry } = await import('./services/ServiceRegistry');
    const registry = new ServiceRegistry(app);

    // Dynamic API Gateway Configuration
    const gatewayServices = process.env.GATEWAY_SERVICES ? process.env.GATEWAY_SERVICES.split(',') : [];

    for (const service of gatewayServices) {
      const name = service.trim().toUpperCase();
      const upstream = process.env[`SERVICE_${name}_UPSTREAM`];
      const prefix = process.env[`SERVICE_${name}_PREFIX`];
      const rewrite = process.env[`SERVICE_${name}_REWRITE`];

      if (upstream && prefix) {
        console.log(`Registering Gateway Route: ${prefix} -> ${upstream} (Rewrite: ${rewrite || 'None'})`);
        
        app.register(require('@fastify/http-proxy'), {
          upstream,
          prefix,
          rewritePrefix: rewrite || prefix, // Default to keeping prefix if rewrite not specified
        });
      } else {
        console.warn(`Missing configuration for service: ${service}`);
      }
    }

    const port = Number(process.env.PORT) || 3001;
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`Service Discovery running on port ${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
