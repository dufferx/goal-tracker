import Fastify from 'fastify';

export function buildServer() {
  const server = Fastify({
    logger: process.env.NODE_ENV !== 'test',
  });

  server.get('/health', async () => ({
    status: 'ok',
  }));

  return server;
}
