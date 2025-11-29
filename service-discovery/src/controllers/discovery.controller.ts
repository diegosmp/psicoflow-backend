import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { ServiceRegistry } from '../services/ServiceRegistry';

const registerSchema = z.object({
  name: z.string(),
  url: z.string().url(),
});

const unregisterSchema = z.object({
  name: z.string(),
  id: z.string(),
});

const heartbeatSchema = z.object({
    name: z.string(),
    id: z.string(),
});

export class DiscoveryController {
  constructor(private registry: ServiceRegistry) {}

  async register(req: FastifyRequest, reply: FastifyReply) {
    const { name, url } = registerSchema.parse(req.body);
    const id = await this.registry.register(name, url);
    return reply.status(201).send({ id, name, url });
  }

  async unregister(req: FastifyRequest, reply: FastifyReply) {
    const { name, id } = unregisterSchema.parse(req.body);
    await this.registry.unregister(name, id);
    return reply.status(204).send();
  }

  async discover(req: FastifyRequest<{ Params: { serviceName: string } }>, reply: FastifyReply) {
    const { serviceName } = req.params;
    const services = await this.registry.discover(serviceName);
    return reply.send(services);
  }
  
  async heartbeat(req: FastifyRequest, reply: FastifyReply) {
      const { name, id } = heartbeatSchema.parse(req.body);
      const success = await this.registry.heartbeat(name, id);
      
      if (!success) {
          return reply.status(404).send({ message: 'Service instance not found' });
      }
      
      return reply.send({ status: 'ok' });
  }

  async listServices(req: FastifyRequest, reply: FastifyReply) {
    const services = await this.registry.getAllServices();
    return reply.send(services);
  }
}
