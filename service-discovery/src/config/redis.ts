import FastifyRedis from '@fastify/redis';
import { FastifyInstance } from 'fastify';

export async function configureRedis(app: FastifyInstance) {
  await app.register(FastifyRedis, {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    family: 4, // IPv4
  });
}
