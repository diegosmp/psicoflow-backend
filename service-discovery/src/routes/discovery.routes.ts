import { FastifyInstance } from 'fastify';
import { ServiceRegistry } from '../services/ServiceRegistry';
import { DiscoveryController } from '../controllers/discovery.controller';

export async function discoveryRoutes(app: FastifyInstance) {
  const registry = new ServiceRegistry(app);
  const controller = new DiscoveryController(registry);

  app.post('/register', controller.register.bind(controller));
  app.post('/unregister', controller.unregister.bind(controller));
  app.post('/heartbeat', controller.heartbeat.bind(controller));
  app.get('/services', controller.listServices.bind(controller));
  app.get('/:serviceName', controller.discover.bind(controller));
}
