import type { FinancialRepository, FinancialSnapshot } from '@goal-tracker/database';
import { afterEach, describe, expect, it } from 'vitest';
import { buildServer } from '../server.js';

const ownerId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const goalId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

function repository(): FinancialRepository {
  const stamp = new Date('2026-07-01T00:00:00.000Z');
  const snapshot: FinancialSnapshot = {
    goal: {
      id: goalId,
      ownerId,
      name: 'Japan Trip',
      description: null,
      currency: 'USD',
      targetMode: 'fixed',
      fixedTargetMinor: 300000n,
      startMonth: '2026-07-01',
      finalMonth: '2027-02-01',
      contributionsPerMonth: 2,
      preferredContributionMinor: null,
      status: 'active',
      createdAt: stamp,
      updatedAt: stamp,
    },
    items: [],
    transactions: [],
  };
  return {
    async findSnapshot(owner, goal) {
      return owner === ownerId && goal === goalId ? structuredClone(snapshot) : undefined;
    },
    async runLockedMutation(owner, goal, decide) {
      if (owner !== ownerId || goal !== goalId) return undefined;
      const command = decide(structuredClone(snapshot));
      if (command.type !== 'insert') throw new Error('Unexpected command in route test.');
      snapshot.transactions.push({
        ...command.transaction,
        ownerId,
        goalId,
        createdAt: new Date('2026-07-31T12:00:00.000Z'),
        updatedAt: new Date('2026-07-31T12:00:00.000Z'),
      });
      return structuredClone(snapshot);
    },
  };
}

describe('financial routes', () => {
  const servers: ReturnType<typeof buildServer>[] = [];
  afterEach(async () => {
    await Promise.all(servers.splice(0).map((server) => server.close()));
  });

  it('requires authentication, validates input, and serializes money as strings', async () => {
    const server = buildServer({
      authVerifier: {
        async verifyAccessToken(token) {
          return token === 'valid' ? { id: ownerId } : undefined;
        },
      },
      financialRepository: repository(),
    });
    servers.push(server);
    expect(
      (
        await server.inject({
          method: 'POST',
          url: `/api/v1/goals/${goalId}/transactions`,
          payload: { kind: 'contribution', amount: '120.00', effectiveDate: '2026-07-31' },
        })
      ).statusCode,
    ).toBe(401);
    const invalid = await server.inject({
      method: 'POST',
      url: `/api/v1/goals/${goalId}/transactions`,
      headers: { authorization: 'Bearer valid' },
      payload: { kind: 'purchase', amount: 120, effectiveDate: 'tomorrow' },
    });
    expect(invalid.statusCode).toBe(400);
    const created = await server.inject({
      method: 'POST',
      url: `/api/v1/goals/${goalId}/transactions`,
      headers: { authorization: 'Bearer valid' },
      payload: { kind: 'contribution', amount: '120.00', effectiveDate: '2026-07-31' },
    });
    expect(created.statusCode).toBe(201);
    expect(created.json()).toMatchObject({
      totals: { funded: '120.00', available: '120.00', spent: '0.00' },
      transaction: { amount: '120.00', kind: 'contribution' },
    });
  });
});
