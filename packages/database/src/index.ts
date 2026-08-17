import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schema.js';

export { createGoalRepository } from './goal-repository.js';
export {
  createFinancialRepository,
  newFinancialTransactionId,
  type FinancialPersistenceCommand,
  type FinancialRepository,
  type FinancialSnapshot,
  type FinancialTransactionKind,
  type FinancialTransactionRecord,
} from './financial-repository.js';
export type {
  CreateGoalRecordInput,
  GoalItemRecord,
  GoalRecord,
  GoalRepository,
  GoalStatus,
  GoalTargetMode,
  UpdateGoalRecordInput,
} from './goal-repository.js';
export { createProfileRepository } from './profile-repository.js';
export type { ProfileRecord, ProfileRepository } from './profile-repository.js';
export { goalItems, goals, goalStatusEnum, goalTargetModeEnum, profiles } from './schema.js';

export function createDatabase(connectionString: string, options: { ssl?: boolean } = {}) {
  const pool = new Pool({
    connectionString,
    ...(options.ssl ? { ssl: { rejectUnauthorized: false } } : {}),
  });

  return {
    db: drizzle(pool, { schema }),
    close: () => pool.end(),
  };
}

export type Database = ReturnType<typeof createDatabase>['db'];
