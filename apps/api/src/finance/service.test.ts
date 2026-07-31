import type {
  FinancialPersistenceCommand,
  FinancialRepository,
  FinancialSnapshot,
} from '@goal-tracker/database';
import { describe, expect, it } from 'vitest';
import { createFinancialService, FinancialServiceError } from './service.js';

const ownerId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const goalId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const itemId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

function baseSnapshot(): FinancialSnapshot {
  const stamp = new Date('2026-07-01T00:00:00.000Z');
  return {
    goal: {
      id: goalId,
      ownerId,
      name: 'Home Gym',
      description: null,
      currency: 'USD',
      targetMode: 'items',
      fixedTargetMinor: null,
      startMonth: '2026-07-01',
      finalMonth: null,
      contributionsPerMonth: 1,
      preferredContributionMinor: null,
      status: 'active',
      createdAt: stamp,
      updatedAt: stamp,
    },
    items: [
      {
        id: itemId,
        ownerId,
        goalId,
        name: 'Rack',
        expectedPriceMinor: 60000n,
        dueMonth: null,
        position: 0,
        createdAt: stamp,
        updatedAt: stamp,
      },
    ],
    transactions: [],
  };
}

function memoryRepository(snapshot = baseSnapshot()): FinancialRepository {
  return {
    async findSnapshot(owner, goal) {
      return owner === ownerId && goal === goalId ? structuredClone(snapshot) : undefined;
    },
    async runLockedMutation(owner, goal, decide) {
      if (owner !== ownerId || goal !== goalId) return undefined;
      const command = decide(structuredClone(snapshot));
      apply(command);
      return structuredClone(snapshot);
    },
  };

  function apply(command: FinancialPersistenceCommand) {
    if ('fixedTargetMinor' in command && command.fixedTargetMinor !== undefined)
      snapshot.goal.fixedTargetMinor = command.fixedTargetMinor;
    if (command.type === 'insert') {
      const stamp = new Date(Date.parse('2026-07-31T12:00:00.000Z') + snapshot.transactions.length);
      snapshot.transactions.push({
        ...command.transaction,
        ownerId,
        goalId,
        createdAt: stamp,
        updatedAt: stamp,
      });
    } else if (command.type === 'update') {
      const row = snapshot.transactions.find((entry) => entry.id === command.transactionId)!;
      row.amountMinor = command.amountMinor;
      row.effectiveDate = command.effectiveDate;
      row.updatedAt = new Date('2026-07-31T13:00:00.000Z');
    } else
      snapshot.transactions = snapshot.transactions.filter(
        (entry) => entry.id !== command.transactionId,
      );
  }
}

describe('FinancialService', () => {
  let tick = 0;
  const clock = { now: () => new Date(Date.parse('2026-07-31T12:00:00.000Z') + tick++) };
  it('records contribution, purchase and full undo while deriving target and totals', async () => {
    const service = createFinancialService(memoryRepository(), clock);
    expect(
      (
        await service.create(ownerId, goalId, {
          kind: 'contribution',
          amount: '700.00',
          effectiveDate: '2026-07-30',
        })
      ).totals.available,
    ).toBe('700.00');
    const bought = await service.purchase(ownerId, goalId, itemId, {
      amount: '560.00',
      effectiveDate: '2026-07-31',
    });
    expect(bought.totals).toMatchObject({
      funded: '700.00',
      spent: '560.00',
      available: '140.00',
      remaining: '0.00',
    });
    await service.undo(ownerId, goalId, bought.transaction!.id, { effectiveDate: '2026-07-31' });
    expect((await service.history(ownerId, goalId)).totals).toMatchObject({
      spent: '0.00',
      available: '700.00',
    });
  });

  it('rejects a retroactive correction that would invalidate a later purchase', async () => {
    const service = createFinancialService(memoryRepository(), clock);
    const contribution = await service.create(ownerId, goalId, {
      kind: 'contribution',
      amount: '600.00',
      effectiveDate: '2026-07-01',
    });
    await service.purchase(ownerId, goalId, itemId, {
      amount: '560.00',
      effectiveDate: '2026-07-08',
    });
    await expect(
      service.update(ownerId, goalId, contribution.transaction!.id, { amount: '500.00' }),
    ).rejects.toMatchObject({ code: 'NEGATIVE_AVAILABLE', statusCode: 422 });
    expect((await service.history(ownerId, goalId)).totals.available).toBe('40.00');
  });

  it('rejects future activity, archived writes, and insufficient purchases with stable errors', async () => {
    const snapshot = baseSnapshot();
    const service = createFinancialService(memoryRepository(snapshot), clock);
    await expect(
      service.create(ownerId, goalId, {
        kind: 'contribution',
        amount: '1.00',
        effectiveDate: '2026-08-01',
      }),
    ).rejects.toBeInstanceOf(FinancialServiceError);
    await expect(
      service.purchase(ownerId, goalId, itemId, { amount: '1.00', effectiveDate: '2026-07-31' }),
    ).rejects.toMatchObject({ code: 'NEGATIVE_AVAILABLE' });
    snapshot.goal.status = 'archived';
    await expect(
      service.create(ownerId, goalId, {
        kind: 'contribution',
        amount: '1.00',
        effectiveDate: '2026-07-31',
      }),
    ).rejects.toMatchObject({ code: 'GOAL_ARCHIVED' });
  });

  it('maps an amount outside the supported integer range to a stable client error', async () => {
    const service = createFinancialService(memoryRepository(), clock);
    await expect(
      service.create(ownerId, goalId, {
        kind: 'contribution',
        amount: '90071992547409.92',
        effectiveDate: '2026-07-31',
      }),
    ).rejects.toMatchObject({ code: 'INVALID_AMOUNT', statusCode: 400 });
  });
});
