import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AuthVerifier } from '../auth.js';
import { buildServer } from '../server.js';
import type {
  GoalItemRecord,
  GoalRecord,
  GoalRepository,
  UpdateGoalRecordInput,
} from '@goal-tracker/database';

const ownerA = '11111111-1111-4111-8111-111111111111';
const ownerB = '22222222-2222-4222-8222-222222222222';
const goalId = '33333333-3333-4333-8333-333333333333';
const itemId = '44444444-4444-4444-8444-444444444444';

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

function authVerifier(userId = ownerA): AuthVerifier {
  return {
    verifyAccessToken: vi.fn(async (token) =>
      token === 'valid' ? { id: userId, email: 'a@example.com' } : undefined,
    ),
  };
}

function goalRepository(overrides: Partial<GoalRepository> = {}): GoalRepository {
  const store = {
    goals: [goal()] as GoalRecord[],
    items: [item()] as GoalItemRecord[],
  };

  function applyGoalUpdate(entry: GoalRecord, update: UpdateGoalRecordInput): GoalRecord {
    const defined = Object.fromEntries(
      Object.entries(update).filter(([, value]) => value !== undefined),
    );
    return { ...entry, ...defined, updatedAt: new Date() };
  }

  return {
    async listByOwner(ownerId) {
      return store.goals.filter((entry) => entry.ownerId === ownerId);
    },
    async findByOwnerAndId(ownerId, id) {
      return store.goals.find((entry) => entry.ownerId === ownerId && entry.id === id);
    },
    async listItemsByOwnerAndGoal(ownerId, id) {
      return store.items.filter((entry) => entry.ownerId === ownerId && entry.goalId === id);
    },
    async create(input) {
      const created = goal({
        id: '55555555-5555-4555-8555-555555555555',
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
      });
      store.goals.push(created);
      const createdItems = input.items.map((entry, index) =>
        item({
          id: crypto.randomUUID(),
          ownerId: input.ownerId,
          goalId: created.id,
          name: entry.name,
          expectedPriceMinor: entry.expectedPriceMinor,
          dueMonth: entry.dueMonth,
          position: index,
        }),
      );
      store.items.push(...createdItems);
      return { goal: created, items: createdItems };
    },
    async update(ownerId, id, update) {
      const index = store.goals.findIndex((entry) => entry.ownerId === ownerId && entry.id === id);
      if (index < 0) return undefined;
      store.goals[index] = applyGoalUpdate(store.goals[index]!, update);
      return store.goals[index];
    },
    async updateLocked(ownerId, id, update, guard) {
      const index = store.goals.findIndex((entry) => entry.ownerId === ownerId && entry.id === id);
      if (index < 0) return undefined;
      guard?.({ goal: store.goals[index]!, transactionCount: 0 });
      store.goals[index] = applyGoalUpdate(store.goals[index]!, update);
      return store.goals[index];
    },
    async permanentlyDelete(ownerId, id) {
      const before = store.goals.length;
      store.goals = store.goals.filter((entry) => !(entry.ownerId === ownerId && entry.id === id));
      store.items = store.items.filter(
        (entry) => !(entry.ownerId === ownerId && entry.goalId === id),
      );
      return store.goals.length < before;
    },
    async createItem(ownerId, id, input) {
      if (!store.goals.some((entry) => entry.ownerId === ownerId && entry.id === id)) {
        return undefined;
      }
      const created = item({
        id: crypto.randomUUID(),
        ownerId,
        goalId: id,
        name: input.name,
        expectedPriceMinor: input.expectedPriceMinor,
        dueMonth: input.dueMonth,
        position: store.items.filter((entry) => entry.goalId === id).length,
      });
      store.items.push(created);
      return created;
    },
    async updateItem(ownerId, id, currentItemId, update) {
      const index = store.items.findIndex(
        (entry) => entry.ownerId === ownerId && entry.goalId === id && entry.id === currentItemId,
      );
      if (index < 0) return undefined;
      store.items[index] = { ...store.items[index]!, ...update, updatedAt: new Date() };
      return store.items[index];
    },
    async deleteItem(ownerId, id, currentItemId, guard) {
      guard?.([]);
      const before = store.items.length;
      store.items = store.items.filter(
        (entry) =>
          !(entry.ownerId === ownerId && entry.goalId === id && entry.id === currentItemId),
      );
      return store.items.length < before;
    },
    async reorderItems(ownerId, id, orderedItemIds) {
      const current = store.items.filter(
        (entry) => entry.ownerId === ownerId && entry.goalId === id,
      );
      if (
        current.length !== orderedItemIds.length ||
        orderedItemIds.some((value) => !current.some((entry) => entry.id === value))
      ) {
        throw Object.assign(new Error('mismatch'), { code: 'ITEM_REORDER_MISMATCH' });
      }
      store.items = store.items.map((entry) => {
        if (entry.goalId !== id || entry.ownerId !== ownerId) return entry;
        return { ...entry, position: orderedItemIds.indexOf(entry.id) };
      });
      return store.items
        .filter((entry) => entry.goalId === id)
        .sort((a, b) => a.position - b.position);
    },
    ...overrides,
  };
}

const servers: Array<ReturnType<typeof buildServer>> = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => server.close()));
});

describe('M2 goals API', () => {
  it('rejects unauthenticated goal access', async () => {
    const server = buildServer({ goalRepository: goalRepository() });
    servers.push(server);
    const response = await server.inject({ method: 'GET', url: '/api/v1/goals' });
    expect(response.statusCode).toBe(401);
    expect(response.json().error.code).toBe('AUTH_REQUIRED');
  });

  it('scopes lists to the authenticated owner and ignores forged owner ids', async () => {
    const repository = goalRepository({
      async listByOwner(ownerId) {
        expect(ownerId).toBe(ownerA);
        return [goal({ ownerId })];
      },
    });
    const server = buildServer({
      authVerifier: authVerifier(ownerA),
      goalRepository: repository,
    });
    servers.push(server);

    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/goals',
      headers: {
        authorization: 'Bearer valid',
        'x-owner-id': ownerB,
      },
      payload: { ownerId: ownerB },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().active).toHaveLength(1);
    expect(response.json().active[0].name).toBe('Japan Trip');
  });

  it('creates a fixed Japan goal and an item-derived home gym', async () => {
    const server = buildServer({
      authVerifier: authVerifier(),
      goalRepository: goalRepository(),
    });
    servers.push(server);

    const japan = await server.inject({
      method: 'POST',
      url: '/api/v1/goals',
      headers: { authorization: 'Bearer valid' },
      payload: {
        name: 'Japan Trip',
        currency: 'USD',
        targetMode: 'fixed',
        fixedTarget: '3000.00',
        startMonth: '2026-07',
        finalMonth: '2027-02',
        contributionsPerMonth: 2,
        items: [
          { name: 'Flights', expectedPrice: '900.00', dueMonth: '2026-10' },
          { name: 'Hotel', expectedPrice: '700.00' },
        ],
      },
    });
    expect(japan.statusCode).toBe(201);
    expect(japan.json().derived.currentTarget).toBe('3000.00');
    expect(japan.json().derived.allocationState).toBe('unallocated');

    const gym = await server.inject({
      method: 'POST',
      url: '/api/v1/goals',
      headers: { authorization: 'Bearer valid' },
      payload: {
        name: 'Home Gym',
        currency: 'USD',
        targetMode: 'items',
        startMonth: '2026-07',
        contributionsPerMonth: 1,
        items: [
          { name: 'Squat rack', expectedPrice: '600.00' },
          { name: 'Bench', expectedPrice: '250.00' },
        ],
      },
    });
    expect(gym.statusCode).toBe(201);
    expect(gym.json().derived.currentTarget).toBe('850.00');
    expect(gym.json().derived.setupIncomplete).toBe(false);
  });

  it('reports incomplete setup for item-derived goals without items', async () => {
    const server = buildServer({
      authVerifier: authVerifier(),
      goalRepository: goalRepository(),
    });
    servers.push(server);

    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/goals',
      headers: { authorization: 'Bearer valid' },
      payload: {
        name: 'Setup incomplete',
        currency: 'USD',
        targetMode: 'items',
        startMonth: '2026-07',
        contributionsPerMonth: 1,
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().derived.currentTarget).toBeNull();
    expect(response.json().derived.setupIncomplete).toBe(true);
    expect(response.json().derived.itemsTotal).toBe('0.00');
  });

  it('requires an explicit overage decision when items exceed a fixed target', async () => {
    const server = buildServer({
      authVerifier: authVerifier(),
      goalRepository: goalRepository({
        async findByOwnerAndId() {
          return goal({ fixedTargetMinor: 100000n });
        },
        async listItemsByOwnerAndGoal() {
          return [item({ expectedPriceMinor: 90000n })];
        },
      }),
    });
    servers.push(server);

    const rejected = await server.inject({
      method: 'POST',
      url: `/api/v1/goals/${goalId}/items`,
      headers: { authorization: 'Bearer valid' },
      payload: { name: 'Rail pass', expectedPrice: '200.00' },
    });
    expect(rejected.statusCode).toBe(400);
    expect(rejected.json().error.message).toMatch(/keep_target|increase_target/i);

    const accepted = await server.inject({
      method: 'POST',
      url: `/api/v1/goals/${goalId}/items`,
      headers: { authorization: 'Bearer valid' },
      payload: {
        name: 'Rail pass',
        expectedPrice: '200.00',
        overageDecision: 'keep_target',
      },
    });
    expect(accepted.statusCode).toBe(201);
  });

  it('rejects mutations on archived goals except restore and delete', async () => {
    const repository = goalRepository({
      async findByOwnerAndId() {
        return goal({ status: 'archived' });
      },
    });
    const server = buildServer({
      authVerifier: authVerifier(),
      goalRepository: repository,
    });
    servers.push(server);

    const patch = await server.inject({
      method: 'PATCH',
      url: `/api/v1/goals/${goalId}`,
      headers: { authorization: 'Bearer valid' },
      payload: { name: 'Nope' },
    });
    expect(patch.statusCode).toBe(409);
    expect(patch.json().error.code).toBe('GOAL_ARCHIVED');

    const restore = await server.inject({
      method: 'POST',
      url: `/api/v1/goals/${goalId}/restore`,
      headers: { authorization: 'Bearer valid' },
    });
    expect(restore.statusCode).toBe(200);
    expect(restore.json().status).toBe('active');
  });

  it('requires exact name confirmation for permanent delete', async () => {
    const server = buildServer({
      authVerifier: authVerifier(),
      goalRepository: goalRepository(),
    });
    servers.push(server);

    const mismatch = await server.inject({
      method: 'DELETE',
      url: `/api/v1/goals/${goalId}`,
      headers: { authorization: 'Bearer valid' },
      payload: { confirmationName: 'Wrong' },
    });
    expect(mismatch.statusCode).toBe(400);
    expect(mismatch.json().error.code).toBe('DELETE_CONFIRMATION_MISMATCH');

    const deleted = await server.inject({
      method: 'DELETE',
      url: `/api/v1/goals/${goalId}`,
      headers: { authorization: 'Bearer valid' },
      payload: { confirmationName: 'Japan Trip' },
    });
    expect(deleted.statusCode).toBe(204);
  });

  it('reorders items and rejects invalid month ranges', async () => {
    const secondItem = item({
      id: '66666666-6666-4666-8666-666666666666',
      name: 'Hotel',
      expectedPriceMinor: 70000n,
      dueMonth: null,
      position: 1,
    });
    const server = buildServer({
      authVerifier: authVerifier(),
      goalRepository: goalRepository({
        async listItemsByOwnerAndGoal() {
          return [item(), secondItem];
        },
        async reorderItems(_ownerId, _goalId, orderedItemIds) {
          return orderedItemIds.map((id, position) =>
            id === itemId ? item({ position }) : { ...secondItem, position },
          );
        },
      }),
    });
    servers.push(server);

    const reordered = await server.inject({
      method: 'PUT',
      url: `/api/v1/goals/${goalId}/items/order`,
      headers: { authorization: 'Bearer valid' },
      payload: { orderedItemIds: [secondItem.id, itemId] },
    });
    expect(reordered.statusCode).toBe(200);
    expect(reordered.json().map((entry: { id: string }) => entry.id)).toEqual([
      secondItem.id,
      itemId,
    ]);

    const invalidMonth = await server.inject({
      method: 'POST',
      url: '/api/v1/goals',
      headers: { authorization: 'Bearer valid' },
      payload: {
        name: 'Bad months',
        currency: 'USD',
        targetMode: 'fixed',
        fixedTarget: '100.00',
        startMonth: '2026-07',
        finalMonth: '2026-01',
        contributionsPerMonth: 1,
      },
    });
    expect(invalidMonth.statusCode).toBe(400);
  });

  it('returns a planning impact preview without financial fields', async () => {
    const server = buildServer({
      authVerifier: authVerifier(),
      goalRepository: goalRepository(),
    });
    servers.push(server);

    const response = await server.inject({
      method: 'POST',
      url: `/api/v1/goals/${goalId}/planning-preview`,
      headers: { authorization: 'Bearer valid' },
      payload: {
        targetMode: 'items',
        fixedTarget: null,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().requiresTargetModeConfirmation).toBe(true);
    expect(
      response
        .json()
        .impacts.some((impact: { kind: string }) => impact.kind === 'target_mode_changed'),
    ).toBe(true);
    expect(JSON.stringify(response.json())).not.toMatch(
      /on_track|funded|available|recommendation/i,
    );
  });

  it('keeps the stable error envelope with requestId', async () => {
    const server = buildServer({
      authVerifier: authVerifier(),
      goalRepository: goalRepository(),
    });
    servers.push(server);

    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/goals',
      headers: { authorization: 'Bearer valid' },
      payload: { name: 'x' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toMatchObject({
      code: 'VALIDATION_ERROR',
      requestId: expect.any(String),
    });
  });

  it('keeps an already overallocated fixed goal editable without a new decision', async () => {
    const overallocated = goalRepository({
      async findByOwnerAndId() {
        return goal({ fixedTargetMinor: 100000n });
      },
      async listItemsByOwnerAndGoal() {
        return [item({ expectedPriceMinor: 110000n })];
      },
    });
    const server = buildServer({
      authVerifier: authVerifier(),
      goalRepository: overallocated,
    });
    servers.push(server);

    const renamed = await server.inject({
      method: 'PATCH',
      url: `/api/v1/goals/${goalId}`,
      headers: { authorization: 'Bearer valid' },
      payload: { name: 'Renamed trip' },
    });
    expect(renamed.statusCode).toBe(200);
    expect(renamed.json().name).toBe('Renamed trip');
    expect(renamed.json().fixedTarget).toBe('1000.00');
    expect(renamed.json().derived.allocationState).toBe('overallocated');

    const preview = await server.inject({
      method: 'POST',
      url: `/api/v1/goals/${goalId}/planning-preview`,
      headers: { authorization: 'Bearer valid' },
      payload: { name: 'Another name' },
    });
    expect(preview.statusCode).toBe(200);
    expect(preview.json().requiresOverageDecision).toBe(false);

    const lowered = await server.inject({
      method: 'PATCH',
      url: `/api/v1/goals/${goalId}`,
      headers: { authorization: 'Bearer valid' },
      payload: { fixedTarget: '900.00' },
    });
    expect(lowered.statusCode).toBe(400);
    expect(lowered.json().error.message).toMatch(/keep_target|increase_target/i);
  });

  it('returns real financials and currency lock in mutation responses', async () => {
    const contribution = {
      id: '77777777-7777-4777-8777-777777777777',
      ownerId: ownerA,
      goalId,
      kind: 'contribution' as const,
      amountMinor: 60000n,
      effectiveDate: '2026-07-30',
      itemId: null,
      reversesTransactionId: null,
      createdAt: new Date('2026-07-30T12:00:00.000Z'),
      updatedAt: new Date('2026-07-30T12:00:00.000Z'),
    };
    const server = buildServer({
      authVerifier: authVerifier(),
      goalRepository: goalRepository(),
      financialRepository: {
        async findSnapshot(ownerId, id) {
          if (ownerId !== ownerA || id !== goalId) return undefined;
          return { goal: goal(), items: [item()], transactions: [contribution] };
        },
        async runLockedMutation() {
          throw new Error('Not used by goal mutations.');
        },
      },
    });
    servers.push(server);

    const renamed = await server.inject({
      method: 'PATCH',
      url: `/api/v1/goals/${goalId}`,
      headers: { authorization: 'Bearer valid' },
      payload: { name: 'Renamed trip' },
    });
    expect(renamed.statusCode).toBe(200);
    expect(renamed.json().derived.financial).toMatchObject({
      funded: '600.00',
      spent: '0.00',
      available: '600.00',
    });
    expect(renamed.json().derived.currencyLocked).toBe(true);

    const archived = await server.inject({
      method: 'POST',
      url: `/api/v1/goals/${goalId}/archive`,
      headers: { authorization: 'Bearer valid' },
    });
    expect(archived.statusCode).toBe(200);
    expect(archived.json().derived.financial.funded).toBe('600.00');
    expect(archived.json().derived.currencyLocked).toBe(true);
  });

  it('locks the currency after the first financial transaction', async () => {
    const locked = goalRepository({
      async updateLocked(_ownerId, _id, _update, guard) {
        guard?.({ goal: goal(), transactionCount: 1 });
        return goal();
      },
    });
    const server = buildServer({ authVerifier: authVerifier(), goalRepository: locked });
    servers.push(server);

    const rejected = await server.inject({
      method: 'PATCH',
      url: `/api/v1/goals/${goalId}`,
      headers: { authorization: 'Bearer valid' },
      payload: { currency: 'EUR' },
    });
    expect(rejected.statusCode).toBe(409);
    expect(rejected.json().error.code).toBe('CURRENCY_LOCKED');

    const unlockedServer = buildServer({
      authVerifier: authVerifier(),
      goalRepository: goalRepository(),
    });
    servers.push(unlockedServer);
    const allowed = await unlockedServer.inject({
      method: 'PATCH',
      url: `/api/v1/goals/${goalId}`,
      headers: { authorization: 'Bearer valid' },
      payload: { currency: 'EUR' },
    });
    expect(allowed.statusCode).toBe(200);
    expect(allowed.json().currency).toBe('EUR');
  });

  it('deletes an item once its purchase is fully undone and blocks active purchases', async () => {
    const purchase = {
      id: '88888888-8888-4888-8888-888888888888',
      kind: 'purchase' as const,
      reversesTransactionId: null,
    };
    const undo = {
      id: '99999999-9999-4999-8999-999999999999',
      kind: 'purchase_undo' as const,
      reversesTransactionId: purchase.id,
    };
    const withLedger = (references: Array<typeof purchase | typeof undo>) =>
      goalRepository({
        async listItemsByOwnerAndGoal() {
          return [];
        },
        async deleteItem(_ownerId, _id, _currentItemId, guard) {
          guard?.(references);
          return true;
        },
      });

    const undoneServer = buildServer({
      authVerifier: authVerifier(),
      goalRepository: withLedger([purchase, undo]),
    });
    servers.push(undoneServer);
    const deleted = await undoneServer.inject({
      method: 'DELETE',
      url: `/api/v1/goals/${goalId}/items/${itemId}`,
      headers: { authorization: 'Bearer valid' },
    });
    expect(deleted.statusCode).toBe(200);
    expect(deleted.json().items.map((entry: { id: string }) => entry.id)).not.toContain(itemId);

    const activeServer = buildServer({
      authVerifier: authVerifier(),
      goalRepository: withLedger([purchase]),
    });
    servers.push(activeServer);
    const blocked = await activeServer.inject({
      method: 'DELETE',
      url: `/api/v1/goals/${goalId}/items/${itemId}`,
      headers: { authorization: 'Bearer valid' },
    });
    expect(blocked.statusCode).toBe(409);
    expect(blocked.json().error.code).toBe('PURCHASED_ITEM_DELETE_BLOCKED');
  });
});
