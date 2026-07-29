import { buildServer } from './server.js';

const server = buildServer();
const port = Number(process.env.API_PORT ?? 3000);
const host = process.env.API_HOST ?? '127.0.0.1';

try {
  await server.listen({ host, port });
} catch (error) {
  server.log.error(error);
  process.exitCode = 1;
}
