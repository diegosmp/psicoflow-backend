import { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';

interface ServiceInstance {
  id: string;
  name: string;
  url: string;
  lastHeartbeat: number;
}

export class ServiceRegistry {
  private redis: FastifyInstance['redis'];
  private readonly TTL = 30; // 30 seconds TTL for service keys

  constructor(app: FastifyInstance) {
    this.redis = app.redis;
  }

  async register(name: string, url: string): Promise<string> {
    const id = uuidv4();
    const key = `service:${name}:${id}`;
    const instance: ServiceInstance = {
      id,
      name,
      url,
      lastHeartbeat: Date.now(),
    };

    await this.redis.set(key, JSON.stringify(instance), 'EX', this.TTL);
    return id;
  }

  async unregister(name: string, id: string): Promise<void> {
    const key = `service:${name}:${id}`;
    await this.redis.del(key);
  }

  async discover(name: string): Promise<ServiceInstance[]> {
    const pattern = `service:${name}:*`;
    const keys = await this.redis.keys(pattern);
    
    if (keys.length === 0) {
      return [];
    }

    const services: ServiceInstance[] = [];
    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        services.push(JSON.parse(data));
      }
    }

    return services;
  }
  
  async heartbeat(name: string, id: string): Promise<boolean> {
      const key = `service:${name}:${id}`;
      const data = await this.redis.get(key);
      
      if (!data) {
          return false;
      }
      
      const instance: ServiceInstance = JSON.parse(data);
      instance.lastHeartbeat = Date.now();
      
      await this.redis.set(key, JSON.stringify(instance), 'EX', this.TTL);
      return true;
  }
  async getAllServices(): Promise<Record<string, ServiceInstance[]>> {
    const pattern = 'service:*:*';
    const keys = await this.redis.keys(pattern);
    
    if (keys.length === 0) {
      return {};
    }

    const services: Record<string, ServiceInstance[]> = {};
    
    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const instance: ServiceInstance = JSON.parse(data);
        if (!services[instance.name]) {
          services[instance.name] = [];
        }
        services[instance.name].push(instance);
      }
    }

    return services;
  }
}
