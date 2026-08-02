import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AuthVerifier } from '../auth.js';
import { buildServer } from '../server.js';
import type {
  FinancialRepository,
  FinancialSnapshot,
  FinancialTransactionRecord,
  GoalItemRecord,
  GoalRecord,
  GoalRepository,
} from '@goal-tracker/database';

const ownerA = '11111111-1111-4111-8111-111111111111';
const goalId = '33333333-3333-4333-8333-333333333333';
const itemId = '44444444-4444-4444-8444-444444444444';
const now = () => new Date('2026-08-15T12:00:00.000Z');

function goal(overrides: Partial<GoalRecord> = {}): GoalRecord {
  return {
    id: goalId,
    ownerId: ownerA,
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
    createdAt: new Date('2026-07-30T12:00:00.000Z'),
    updatedAt: new Date('2026-07-30T12:00:00.000Z'),
    ...overrides,
  };
}

function item(overrides: Partial<GoalItemRecord> = {}): GoalItemRecord {
  return {
    id: itemId,
    ownerId: ownerA,
    goalId,
    name: 'Flights',
    expectedPriceMinor: 90000n,
    dueMonth: '2026-10-01',
    position: 0,
    createdAt: new Date('2026-07-30T12:00:00.000Z'),
    updatedAt: new Date('2026-07-30T12:00:00.000Z'),
    ...overrides,
  };
}

function contribution(amountMinor: bigint): FinancialTransactionRecord {
  return {
    id: '77777777-7777-4777-8777-777777777777',
    ownerId: ownerA,
    goalId,
    kind: 'contribution',
    amountMinor,
    effectiveDate: '2026-07-30',
    itemId: null,
    reversesTransactionId: null,
    createdAt: new Date('2026-07-30T12:00:00.000Z'),
    updatedAt: new Date('2026-07-30T12:00:00.000Z'),
  };
}

function authVerifier(userId = ownerA): AuthVerifier {
  return {
    verifyAccessToken: vi.fn(async (token) =>
      token === 'valid' ? { id: userId, email: 'a@example.com' } : undefined,
    ),
  };
}

function notConfigured() {
  throw new Error('Repository method is not configured for this test.');
}

function goalRepository(overrides: Partial<GoalRepository> = {}): GoalRepository {
  return {
    listByOwner: notConfigured,
    findByOwnerAndId: notConfigured,
    listItemsByOwnerAndGoal: notConfigured,
    create: notConfigured,
    update: notConfigured,
    updateLocked: notConfigured,
    permanentlyDelete: notConfigured,
    createItem: notConfigured,
    updateItem: notConfigured,
    deleteItem: notConfigured,
    reorderItems: notConfigured,
    ...overrides,
  } as GoalRepository;
}

function financialRepository(
  snapshot: FinancialSnapshot | undefined,
): FinancialRepository & { findSnapshotCalls: number; mutationCalls: number } {
  const repository = {
    findSnapshotCalls: 0,
    mutationCalls: 0,
    async findSnapshot(ownerId: string, id: string) {
      repository.findSnapshotCalls += 1;
      if (!snapshot || ownerId !== snapshot.goal.ownerId || id !== snapshot.goal.id) {
        return undefined;
      }
      return snapshot;
    },
    async runLockedMutation(): Promise<never> {
      repository.mutationCalls += 1;
      throw new Error('Simulations must never use the mutation path.');
    },
  };
  return repository;
}

const servers: Array<ReturnType<typeof buildServer>> = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => server.close()));
});

describe('M4 guidance in goal detail', () => {
  it('includes deterministic guidance in goal-detail responses', async () => {
    const snapshot: FinancialSnapshot = {
      goal: goal(),
      items: [item()],
      transactions: [contribution(18000n)],
    };
    const server = buildServer({
      authVerifier: authVerifier(),
      now,
      goalRepository: goalRepository({
        async findByOwnerAndId() {
          return snapshot.goal;
        },
        async listItemsByOwnerAndGoal() {
          return snapshot.items;
        },
      }),
      financialRepository: financialRepository(snapshot),
    });
    servers.push(server);

    const response = await server.inject({
      method: 'GET',
      url: `/api/v1/goals/${goalId}`,
      headers: { authorization: 'Bearer valid' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().guidance).toMatchObject({
      target: '3000.00',
      remaining: '2820.00',
      fullyFunded: false,
      setupIncomplete: false,
      status: 'on_track',
      obligation: {
        kind: 'dated_items',
        dueMonth: '2026-10',
        itemNames: ['Flights'],
        required: '720.00',
        remainingOpportunities: 6,
      },
      recommendation: {
        perContribution: '120.00',
        monthly: '240.00',
        contributionsPerMonth: 2,
      },
      expectedProgress: '240.00',
      progress: '180.00',
      paceDelta: '-60.00',
      forecastMonth: null,
      explanation: { code: 'pace_delta', delta: '-60.00' },
    });
  });

  it('reports absent pace for open goals without a preferred amount', async () => {
    const openGoal = goal({ finalMonth: null });
    const snapshot: FinancialSnapshot = {
      goal: openGoal,
      items: [],
      transactions: [contribution(60000n)],
    };
    const server = buildServer({
      authVerifier: authVerifier(),
      now,
      goalRepository: goalRepository({
        async findByOwnerAndId() {
          return openGoal;
        },
        async listItemsByOwnerAndGoal() {
          return [];
        },
      }),
      financialRepository: financialRepository(snapshot),
    });
    servers.push(server);

    const response = await server.inject({
      method: 'GET',
      url: `/api/v1/goals/${goalId}`,
      headers: { authorization: 'Bearer valid' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().guidance).toMatchObject({
      status: null,
      obligation: null,
      recommendation: null,
      explanation: { code: 'no_pace' },
    });
  });
});

describe('M4 simulation endpoint', () => {
  const gymSnapshot: FinancialSnapshot = {
    goal: goal({
      name: 'Home Gym',
      targetMode: 'items',
      fixedTargetMinor: null,
      contributionsPerMonth: 2,
    }),
    items: [
      item({ name: 'Bench', expectedPriceMinor: 25000n, dueMonth: null }),
      item({
        id: '55555555-5555-4555-8555-555555555555',
        name: 'Plates',
        expectedPriceMinor: 34000n,
        dueMonth: null,
        position: 1,
      }),
    ],
    transactions: [contribution(70000n)],
  };

  it('rejects unauthenticated simulation requests', async () => {
    const server = buildServer({ financialRepository: financialRepository(gymSnapshot) });
    servers.push(server);
    const response = await server.inject({
      method: 'POST',
      url: `/api/v1/goals/${goalId}/simulations`,
      payload: { phases: [{ months: 1, amountPerContribution: '150.00' }] },
    });
    expect(response.statusCode).toBe(401);
    expect(response.json().error.code).toBe('AUTH_REQUIRED');
  });

  it('returns an in-memory simulation report without touching the mutation path', async () => {
    const repository = financialRepository(gymSnapshot);
    const server = buildServer({
      authVerifier: authVerifier(),
      now: () => new Date('2026-09-10T12:00:00.000Z'),
      financialRepository: repository,
    });
    servers.push(server);

    const response = await server.inject({
      method: 'POST',
      url: `/api/v1/goals/${goalId}/simulations`,
      headers: { authorization: 'Bearer valid' },
      payload: {
        phases: [
          { months: 3, amountPerContribution: '150.00' },
          { months: 3, amountPerContribution: '80.00', continueUntilTarget: true },
        ],
      },
    });

    expect(response.statusCode).toBe(200);
    const report = response.json();
    // Item-derived target = 25000 + 34000 = 59000, already funded → current month.
    expect(report.targetReachedMonth).toBe('2026-09');
    expect(report.months[0]).toEqual({ month: '2026-09', funded: '1000.00', available: '1000.00' });
    expect(report.months).toHaveLength(6);
    expect(report.itemAffordability).toEqual([
      { itemId, affordableMonth: '2026-09' },
      { itemId: '55555555-5555-4555-8555-555555555555', affordableMonth: '2026-09' },
    ]);
    // Proof that simulations write no rows: one snapshot read, zero mutations.
    expect(repository.findSnapshotCalls).toBe(1);
    expect(repository.mutationCalls).toBe(0);
  });

  it('accepts a zero-contribution phase and preserves the simulated balances', async () => {
    const repository = financialRepository(gymSnapshot);
    const server = buildServer({
      authVerifier: authVerifier(),
      now: () => new Date('2026-09-10T12:00:00.000Z'),
      financialRepository: repository,
    });
    servers.push(server);

    const response = await server.inject({
      method: 'POST',
      url: `/api/v1/goals/${goalId}/simulations`,
      headers: { authorization: 'Bearer valid' },
      payload: { phases: [{ months: 1, amountPerContribution: '0.00' }] },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().months).toEqual([
      { month: '2026-09', funded: '700.00', available: '700.00' },
    ]);
    expect(repository.mutationCalls).toBe(0);
  });

  it('rejects invalid phase shapes with the stable error envelope', async () => {
    const server = buildServer({
      authVerifier: authVerifier(),
      now,
      financialRepository: financialRepository(gymSnapshot),
    });
    servers.push(server);

    const response = await server.inject({
      method: 'POST',
      url: `/api/v1/goals/${goalId}/simulations`,
      headers: { authorization: 'Bearer valid' },
      payload: {
        phases: [
          { months: 1, amountPerContribution: '10.00' },
          { months: 1, amountPerContribution: '10.00' },
          { months: 1, amountPerContribution: '10.00' },
          { months: 1, amountPerContribution: '10.00' },
        ],
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toMatchObject({
      code: 'VALIDATION_ERROR',
      requestId: expect.any(String),
    });
  });

  it('maps domain simulation rejections to stable 400 codes', async () => {
    const emptySnapshot: FinancialSnapshot = {
      goal: goal({ targetMode: 'items', fixedTargetMinor: null }),
      items: [],
      transactions: [],
    };
    const server = buildServer({
      authVerifier: authVerifier(),
      now,
      financialRepository: financialRepository(emptySnapshot),
    });
    servers.push(server);

    const response = await server.inject({
      method: 'POST',
      url: `/api/v1/goals/${goalId}/simulations`,
      headers: { authorization: 'Bearer valid' },
      payload: {
        phases: [{ months: 2, amountPerContribution: '100.00', continueUntilTarget: true }],
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('CONTINUATION_WITHOUT_TARGET');
  });

  it('scopes simulations to the authenticated owner', async () => {
    const server = buildServer({
      authVerifier: authVerifier('22222222-2222-4222-8222-222222222222'),
      now,
      financialRepository: financialRepository(gymSnapshot),
    });
    servers.push(server);

    const response = await server.inject({
      method: 'POST',
      url: `/api/v1/goals/${goalId}/simulations`,
      headers: { authorization: 'Bearer valid' },
      payload: { phases: [{ months: 1, amountPerContribution: '150.00' }] },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe('GOAL_NOT_FOUND');
  });
});
