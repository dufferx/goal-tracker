import {
  createDatabase,
  createFinancialRepository,
  createGoalRepository,
  createProfileRepository,
} from '@goal-tracker/database';

import { createSupabaseAuthVerifier } from './auth.js';
import { readApiConfig } from './config.js';
import { buildServer } from './server.js';

const config = readApiConfig(process.env);
const database = createDatabase(config.databaseUrl, { ssl: config.databaseSsl });
const server = buildServer({
  allowedWebOrigin: config.allowedWebOrigin,
  authVerifier: createSupabaseAuthVerifier(config.supabaseUrl, config.supabasePublishableKey),
  deploymentCapabilities: config.deploymentCapabilities,
  profileRepository: createProfileRepository(database.db),
  goalRepository: createGoalRepository(database.db),
  financialRepository: createFinancialRepository(database.db),
});
const port = Number(process.env.API_PORT ?? 3000);
const host = process.env.API_HOST ?? '127.0.0.1';

server.addHook('onClose', async () => {
  await database.close();
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void server.close().then(
      () => process.exit(0),
      () => process.exit(1),
    );
  });
}

try {
  await server.listen({ host, port });
} catch (error) {
  server.log.error(error);
  process.exitCode = 1;
}
