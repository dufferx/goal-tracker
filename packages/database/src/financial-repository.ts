import { and, asc, eq, sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

import type { Database } from './index.js';
import type { GoalItemRecord, GoalRecord } from './goal-repository.js';
import { financialTransactions, goalItems, goals } from './schema.js';

export type FinancialTransactionKind = 'contribution' | 'withdrawal' | 'purchase' | 'purchase_undo';

export interface FinancialTransactionRecord {
  id: string;
  ownerId: string;
  goalId: string;
  kind: FinancialTransactionKind;
  amountMinor: bigint;
  effectiveDate: string;
  itemId: string | null;
  reversesTransactionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FinancialSnapshot {
  goal: GoalRecord;
  items: GoalItemRecord[];
  transactions: FinancialTransactionRecord[];
}

export type FinancialPersistenceCommand =
  | {
      type: 'insert';
      transaction: Omit<
        FinancialTransactionRecord,
        'ownerId' | 'goalId' | 'createdAt' | 'updatedAt'
      >;
      fixedTargetMinor?: bigint;
    }
  | {
      type: 'update';
      transactionId: string;
      amountMinor: bigint;
      effectiveDate: string;
      fixedTargetMinor?: bigint;
    }
  | { type: 'delete'; transactionId: string };

export interface FinancialRepository {
  findSnapshot(ownerId: string, goalId: string): Promise<FinancialSnapshot | undefined>;
  runLockedMutation(
    ownerId: string,
    goalId: string,
    decide: (snapshot: FinancialSnapshot) => FinancialPersistenceCommand,
  ): Promise<FinancialSnapshot | undefined>;
}

function mapGoal(row: typeof goals.$inferSelect): GoalRecord {
  return { ...row, contributionsPerMonth: row.contributionsPerMonth };
}
function mapItem(row: typeof goalItems.$inferSelect): GoalItemRecord {
  return { ...row };
}
function mapTransaction(
  row: typeof financialTransactions.$inferSelect,
): FinancialTransactionRecord {
  return { ...row };
}

export function createFinancialRepository(db: Database): FinancialRepository {
  async function loadSnapshot(
    executor: Pick<Database, 'select'>,
    ownerId: string,
    goalId: string,
  ): Promise<FinancialSnapshot | undefined> {
    const [goal] = await executor
      .select()
      .from(goals)
      .where(and(eq(goals.ownerId, ownerId), eq(goals.id, goalId)))
      .limit(1);
    if (!goal) return undefined;
    const items = await executor
      .select()
      .from(goalItems)
      .where(and(eq(goalItems.ownerId, ownerId), eq(goalItems.goalId, goalId)))
      .orderBy(asc(goalItems.position), asc(goalItems.id));
    const transactions = await executor
      .select()
      .from(financialTransactions)
      .where(
        and(eq(financialTransactions.ownerId, ownerId), eq(financialTransactions.goalId, goalId)),
      )
      .orderBy(
        asc(financialTransactions.effectiveDate),
        asc(financialTransactions.createdAt),
        asc(financialTransactions.id),
      );
    return {
      goal: mapGoal(goal),
      items: items.map(mapItem),
      transactions: transactions.map(mapTransaction),
    };
  }

  return {
    findSnapshot(ownerId, goalId) {
      return loadSnapshot(db, ownerId, goalId);
    },
    async runLockedMutation(ownerId, goalId, decide) {
      return db.transaction(async (tx) => {
        const locked = await tx.execute(
          sql`select id from public.goals where owner_id = ${ownerId} and id = ${goalId} for update`,
        );
        if (locked.rowCount === 0) return undefined;
        const snapshot = await loadSnapshot(tx, ownerId, goalId);
        if (!snapshot) return undefined;
        const command = decide(snapshot);
        if ('fixedTargetMinor' in command && command.fixedTargetMinor !== undefined) {
          await tx
            .update(goals)
            .set({ fixedTargetMinor: command.fixedTargetMinor })
            .where(and(eq(goals.ownerId, ownerId), eq(goals.id, goalId)));
        }
        if (command.type === 'insert') {
          await tx.insert(financialTransactions).values({
            ...command.transaction,
            ownerId,
            goalId,
          });
        } else if (command.type === 'update') {
          await tx
            .update(financialTransactions)
            .set({ amountMinor: command.amountMinor, effectiveDate: command.effectiveDate })
            .where(
              and(
                eq(financialTransactions.ownerId, ownerId),
                eq(financialTransactions.goalId, goalId),
                eq(financialTransactions.id, command.transactionId),
              ),
            );
        } else {
          await tx
            .delete(financialTransactions)
            .where(
              and(
                eq(financialTransactions.ownerId, ownerId),
                eq(financialTransactions.goalId, goalId),
                eq(financialTransactions.id, command.transactionId),
              ),
            );
        }
        const next = await loadSnapshot(tx, ownerId, goalId);
        if (!next) throw new Error('Locked goal disappeared during financial mutation.');
        return next;
      });
    },
  };
}

export function newFinancialTransactionId(): string {
  return randomUUID();
}
