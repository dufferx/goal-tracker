import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

import type { Database } from './index.js';
import { financialTransactions, goalItems, goals } from './schema.js';

export type GoalStatus = 'active' | 'archived';
export type GoalTargetMode = 'fixed' | 'items';

export interface GoalRecord {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  currency: string;
  targetMode: GoalTargetMode;
  fixedTargetMinor: bigint | null;
  startMonth: string;
  finalMonth: string | null;
  contributionsPerMonth: number;
  preferredContributionMinor: bigint | null;
  status: GoalStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface GoalItemRecord {
  id: string;
  ownerId: string;
  goalId: string;
  name: string;
  expectedPriceMinor: bigint;
  dueMonth: string | null;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateGoalRecordInput {
  ownerId: string;
  name: string;
  description: string | null;
  currency: string;
  targetMode: GoalTargetMode;
  fixedTargetMinor: bigint | null;
  startMonth: string;
  finalMonth: string | null;
  contributionsPerMonth: 1 | 2;
  preferredContributionMinor: bigint | null;
  items: Array<{
    name: string;
    expectedPriceMinor: bigint;
    dueMonth: string | null;
  }>;
}

export interface UpdateGoalRecordInput {
  name?: string;
  description?: string | null;
  currency?: string;
  targetMode?: GoalTargetMode;
  fixedTargetMinor?: bigint | null;
  startMonth?: string;
  finalMonth?: string | null;
  contributionsPerMonth?: 1 | 2;
  preferredContributionMinor?: bigint | null;
  status?: GoalStatus;
}

/** Minimal ledger reference passed to the deleteItem guard. */
export interface GoalItemTransactionReference {
  id: string;
  kind: 'contribution' | 'withdrawal' | 'purchase' | 'purchase_undo';
  reversesTransactionId: string | null;
}

export interface GoalRepository {
  listByOwner(ownerId: string): Promise<GoalRecord[]>;
  findByOwnerAndId(ownerId: string, goalId: string): Promise<GoalRecord | undefined>;
  listItemsByOwnerAndGoal(ownerId: string, goalId: string): Promise<GoalItemRecord[]>;
  create(input: CreateGoalRecordInput): Promise<{ goal: GoalRecord; items: GoalItemRecord[] }>;
  update(
    ownerId: string,
    goalId: string,
    update: UpdateGoalRecordInput,
  ): Promise<GoalRecord | undefined>;
  /**
   * Update under a `FOR UPDATE` goal row lock. The guard runs inside the same
   * transaction after the lock is taken, so checks (e.g. currency immutability)
   * cannot race with a concurrent financial mutation.
   */
  updateLocked(
    ownerId: string,
    goalId: string,
    update: UpdateGoalRecordInput,
    guard?: (locked: { goal: GoalRecord; transactionCount: number }) => void,
  ): Promise<GoalRecord | undefined>;
  permanentlyDelete(ownerId: string, goalId: string): Promise<boolean>;
  createItem(
    ownerId: string,
    goalId: string,
    input: { name: string; expectedPriceMinor: bigint; dueMonth: string | null },
  ): Promise<GoalItemRecord | undefined>;
  updateItem(
    ownerId: string,
    goalId: string,
    itemId: string,
    update: Partial<{ name: string; expectedPriceMinor: bigint; dueMonth: string | null }>,
  ): Promise<GoalItemRecord | undefined>;
  /**
   * Delete an item under a `FOR UPDATE` goal row lock, removing its ledger
   * references in the same transaction. The guard receives the item's ledger
   * rows and may throw to veto the delete (e.g. an active purchase). Only
   * fully-undone purchase pairs may reach the delete: they net to zero, so
   * replaying the remaining history stays valid.
   */
  deleteItem(
    ownerId: string,
    goalId: string,
    itemId: string,
    guard?: (transactions: GoalItemTransactionReference[]) => void,
  ): Promise<boolean>;
  reorderItems(
    ownerId: string,
    goalId: string,
    orderedItemIds: string[],
  ): Promise<GoalItemRecord[] | undefined>;
}

function mapGoal(row: typeof goals.$inferSelect): GoalRecord {
  return {
    id: row.id,
    ownerId: row.ownerId,
    name: row.name,
    description: row.description,
    currency: row.currency,
    targetMode: row.targetMode,
    fixedTargetMinor: row.fixedTargetMinor,
    startMonth: row.startMonth,
    finalMonth: row.finalMonth,
    contributionsPerMonth: row.contributionsPerMonth,
    preferredContributionMinor: row.preferredContributionMinor,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapItem(row: typeof goalItems.$inferSelect): GoalItemRecord {
  return {
    id: row.id,
    ownerId: row.ownerId,
    goalId: row.goalId,
    name: row.name,
    expectedPriceMinor: row.expectedPriceMinor,
    dueMonth: row.dueMonth,
    position: row.position,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function goalUpdateSet(update: UpdateGoalRecordInput) {
  return {
    ...(update.name !== undefined ? { name: update.name } : {}),
    ...(update.description !== undefined ? { description: update.description } : {}),
    ...(update.currency !== undefined ? { currency: update.currency } : {}),
    ...(update.targetMode !== undefined ? { targetMode: update.targetMode } : {}),
    ...(update.fixedTargetMinor !== undefined ? { fixedTargetMinor: update.fixedTargetMinor } : {}),
    ...(update.startMonth !== undefined ? { startMonth: update.startMonth } : {}),
    ...(update.finalMonth !== undefined ? { finalMonth: update.finalMonth } : {}),
    ...(update.contributionsPerMonth !== undefined
      ? { contributionsPerMonth: update.contributionsPerMonth }
      : {}),
    ...(update.preferredContributionMinor !== undefined
      ? { preferredContributionMinor: update.preferredContributionMinor }
      : {}),
    ...(update.status !== undefined ? { status: update.status } : {}),
  };
}

export function createGoalRepository(db: Database): GoalRepository {
  return {
    async listByOwner(ownerId) {
      const rows = await db
        .select()
        .from(goals)
        .where(eq(goals.ownerId, ownerId))
        .orderBy(asc(goals.currency), asc(goals.name), asc(goals.id));
      return rows.map(mapGoal);
    },

    async findByOwnerAndId(ownerId, goalId) {
      const [row] = await db
        .select()
        .from(goals)
        .where(and(eq(goals.ownerId, ownerId), eq(goals.id, goalId)))
        .limit(1);
      return row ? mapGoal(row) : undefined;
    },

    async listItemsByOwnerAndGoal(ownerId, goalId) {
      const rows = await db
        .select()
        .from(goalItems)
        .where(and(eq(goalItems.ownerId, ownerId), eq(goalItems.goalId, goalId)))
        .orderBy(asc(goalItems.position), asc(goalItems.id));
      return rows.map(mapItem);
    },

    async create(input) {
      return db.transaction(async (tx) => {
        const goalId = randomUUID();
        const goalRows = await tx
          .insert(goals)
          .values({
            id: goalId,
            ownerId: input.ownerId,
            name: input.name,
            description: input.description,
            currency: input.currency,
            targetMode: input.targetMode,
            fixedTargetMinor: input.fixedTargetMinor,
            startMonth: input.startMonth,
            finalMonth: input.finalMonth,
            contributionsPerMonth: input.contributionsPerMonth,
            preferredContributionMinor: input.preferredContributionMinor,
            status: 'active',
          })
          .returning();
        const goalRow = goalRows[0];
        if (!goalRow) {
          throw new Error('Goal insert returned no row.');
        }

        const itemRows =
          input.items.length === 0
            ? []
            : await tx
                .insert(goalItems)
                .values(
                  input.items.map((item, index) => ({
                    id: randomUUID(),
                    ownerId: input.ownerId,
                    goalId,
                    name: item.name,
                    expectedPriceMinor: item.expectedPriceMinor,
                    dueMonth: item.dueMonth,
                    position: index,
                  })),
                )
                .returning();

        return {
          goal: mapGoal(goalRow),
          items: itemRows.map(mapItem),
        };
      });
    },

    async update(ownerId, goalId, update) {
      const [row] = await db
        .update(goals)
        .set(goalUpdateSet(update))
        .where(and(eq(goals.ownerId, ownerId), eq(goals.id, goalId)))
        .returning();
      return row ? mapGoal(row) : undefined;
    },

    async updateLocked(ownerId, goalId, update, guard) {
      return db.transaction(async (tx) => {
        const lockedRows = await tx
          .select()
          .from(goals)
          .where(and(eq(goals.ownerId, ownerId), eq(goals.id, goalId)))
          .for('update')
          .limit(1);
        const locked = lockedRows[0];
        if (!locked) return undefined;

        if (guard) {
          const countRows = await tx
            .select({ count: sql<number>`count(*)::int` })
            .from(financialTransactions)
            .where(
              and(
                eq(financialTransactions.ownerId, ownerId),
                eq(financialTransactions.goalId, goalId),
              ),
            );
          guard({ goal: mapGoal(locked), transactionCount: Number(countRows[0]?.count ?? 0) });
        }

        const [row] = await tx
          .update(goals)
          .set(goalUpdateSet(update))
          .where(and(eq(goals.ownerId, ownerId), eq(goals.id, goalId)))
          .returning();
        return row ? mapGoal(row) : undefined;
      });
    },

    async permanentlyDelete(ownerId, goalId) {
      const deleted = await db
        .delete(goals)
        .where(and(eq(goals.ownerId, ownerId), eq(goals.id, goalId)))
        .returning({ id: goals.id });
      return deleted.length > 0;
    },

    async createItem(ownerId, goalId, input) {
      return db.transaction(async (tx) => {
        const [goal] = await tx
          .select({ id: goals.id, status: goals.status })
          .from(goals)
          .where(and(eq(goals.ownerId, ownerId), eq(goals.id, goalId)))
          .limit(1);
        if (!goal) {
          return undefined;
        }

        const positionRows = await tx
          .select({
            nextPosition: sql<number>`coalesce(max(${goalItems.position}) + 1, 0)`,
          })
          .from(goalItems)
          .where(and(eq(goalItems.ownerId, ownerId), eq(goalItems.goalId, goalId)));
        const nextPosition = Number(positionRows[0]?.nextPosition ?? 0);

        const inserted = await tx
          .insert(goalItems)
          .values({
            id: randomUUID(),
            ownerId,
            goalId,
            name: input.name,
            expectedPriceMinor: input.expectedPriceMinor,
            dueMonth: input.dueMonth,
            position: nextPosition,
          })
          .returning();
        const row = inserted[0];
        if (!row) {
          throw new Error('Goal item insert returned no row.');
        }

        return mapItem(row);
      });
    },

    async updateItem(ownerId, goalId, itemId, update) {
      const [row] = await db
        .update(goalItems)
        .set({
          ...(update.name !== undefined ? { name: update.name } : {}),
          ...(update.expectedPriceMinor !== undefined
            ? { expectedPriceMinor: update.expectedPriceMinor }
            : {}),
          ...(update.dueMonth !== undefined ? { dueMonth: update.dueMonth } : {}),
        })
        .where(
          and(
            eq(goalItems.ownerId, ownerId),
            eq(goalItems.goalId, goalId),
            eq(goalItems.id, itemId),
          ),
        )
        .returning();
      return row ? mapItem(row) : undefined;
    },

    async deleteItem(ownerId, goalId, itemId, guard) {
      return db.transaction(async (tx) => {
        const locked = await tx.execute(
          sql`select id from public.goals where owner_id = ${ownerId} and id = ${goalId} for update`,
        );
        if (locked.rowCount === 0) return false;

        const references = await tx
          .select({
            id: financialTransactions.id,
            kind: financialTransactions.kind,
            reversesTransactionId: financialTransactions.reversesTransactionId,
          })
          .from(financialTransactions)
          .where(
            and(
              eq(financialTransactions.ownerId, ownerId),
              eq(financialTransactions.goalId, goalId),
              eq(financialTransactions.itemId, itemId),
            ),
          );
        guard?.(references);

        if (references.length > 0) {
          await tx
            .delete(financialTransactions)
            .where(
              and(
                eq(financialTransactions.ownerId, ownerId),
                eq(financialTransactions.goalId, goalId),
                eq(financialTransactions.itemId, itemId),
              ),
            );
        }

        const deleted = await tx
          .delete(goalItems)
          .where(
            and(
              eq(goalItems.ownerId, ownerId),
              eq(goalItems.goalId, goalId),
              eq(goalItems.id, itemId),
            ),
          )
          .returning({ id: goalItems.id });
        return deleted.length > 0;
      });
    },

    async reorderItems(ownerId, goalId, orderedItemIds) {
      return db.transaction(async (tx) => {
        const existing = await tx
          .select()
          .from(goalItems)
          .where(and(eq(goalItems.ownerId, ownerId), eq(goalItems.goalId, goalId)))
          .orderBy(asc(goalItems.position), asc(goalItems.id));

        if (existing.length === 0) {
          const [goal] = await tx
            .select({ id: goals.id })
            .from(goals)
            .where(and(eq(goals.ownerId, ownerId), eq(goals.id, goalId)))
            .limit(1);
          return goal ? [] : undefined;
        }

        const existingIds = new Set(existing.map((item) => item.id));
        if (
          orderedItemIds.length !== existing.length ||
          orderedItemIds.some((id) => !existingIds.has(id))
        ) {
          throw Object.assign(new Error('orderedItemIds must include every item exactly once.'), {
            code: 'ITEM_REORDER_MISMATCH',
          });
        }

        // Two-phase update avoids unique (goal_id, position) conflicts.
        const offset = existing.length + 1000;
        for (const [index, itemId] of orderedItemIds.entries()) {
          await tx
            .update(goalItems)
            .set({ position: offset + index })
            .where(
              and(
                eq(goalItems.ownerId, ownerId),
                eq(goalItems.goalId, goalId),
                eq(goalItems.id, itemId),
              ),
            );
        }

        for (const [index, itemId] of orderedItemIds.entries()) {
          await tx
            .update(goalItems)
            .set({ position: index })
            .where(
              and(
                eq(goalItems.ownerId, ownerId),
                eq(goalItems.goalId, goalId),
                eq(goalItems.id, itemId),
              ),
            );
        }

        const rows = await tx
          .select()
          .from(goalItems)
          .where(
            and(
              eq(goalItems.ownerId, ownerId),
              eq(goalItems.goalId, goalId),
              inArray(goalItems.id, orderedItemIds),
            ),
          )
          .orderBy(asc(goalItems.position), asc(goalItems.id));

        return rows.map(mapItem);
      });
    },
  };
}
