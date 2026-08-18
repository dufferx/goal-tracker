import { createClient } from '@supabase/supabase-js';
import {
  createDatabase,
  createFinancialRepository,
  createGoalRepository,
} from '@goal-tracker/database';
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { createFinancialService } from './finance/service.js';
import { createGoalService } from './goals/service.js';

const url = process.env.M3_SUPABASE_URL;
const publishableKey = process.env.M3_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.M3_SUPABASE_SERVICE_ROLE_KEY;
const databaseUrl = process.env.M3_DATABASE_URL;
const available = Boolean(url && publishableKey && serviceRoleKey && databaseUrl);
const integration = describe.skipIf(!available);
const createdUsers: string[] = [];

integration('M3 ledger migration, RLS, and locking', () => {
  const testUrl = url ?? 'http://127.0.0.1:54321';
  const testPublicKey = publishableKey ?? 'integration-not-configured';
  const testServiceKey = serviceRoleKey ?? 'integration-not-configured';
  const admin = createClient(testUrl, testServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const database = createDatabase(
    databaseUrl ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
  );
  const service = createFinancialService(createFinancialRepository(database.db), {
    now: () => new Date('2026-07-31T12:00:00.000Z'),
  });

  afterEach(async () => {
    await Promise.all(createdUsers.splice(0).map((id) => admin.auth.admin.deleteUser(id)));
  });
  afterAll(async () => {
    await database.close();
  });

  async function user() {
    const email = `m3-${crypto.randomUUID()}@example.test`;
    const password = `M3-${crypto.randomUUID()}!`;
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { default_currency: 'USD' },
    });
    expect(created.error).toBeNull();
    createdUsers.push(created.data.user!.id);
    const client = createClient(testUrl, testPublicKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    expect((await client.auth.signInWithPassword({ email, password })).error).toBeNull();
    return { id: created.data.user!.id, client };
  }

  async function goal(owner: Awaited<ReturnType<typeof user>>, itemCount = 1) {
    const goalId = crypto.randomUUID();
    // Seeds run through the service role: authenticated clients cannot write
    // application tables directly.
    expect(
      (
        await admin.from('goals').insert({
          id: goalId,
          owner_id: owner.id,
          name: 'Home Gym',
          currency: 'USD',
          target_mode: 'items',
          fixed_target_minor: null,
          start_month: '2026-07-01',
          contributions_per_month: 1,
          status: 'active',
        })
      ).error,
    ).toBeNull();
    const itemIds = Array.from({ length: itemCount }, () => crypto.randomUUID());
    expect(
      (
        await admin.from('goal_items').insert(
          itemIds.map((id, position) => ({
            id,
            owner_id: owner.id,
            goal_id: goalId,
            name: `Item ${position + 1}`,
            expected_price_minor: 40000,
            position,
          })),
        )
      ).error,
    ).toBeNull();
    return { goalId, itemIds };
  }

  it('isolates ledger rows and enforces structural kind/reference constraints', async () => {
    const a = await user();
    const b = await user();
    const aggregate = await goal(a);
    const transactionId = crypto.randomUUID();
    const inserted = await admin.from('financial_transactions').insert({
      id: transactionId,
      owner_id: a.id,
      goal_id: aggregate.goalId,
      kind: 'contribution',
      amount_minor: 60000,
      effective_date: '2026-07-30',
    });
    expect(inserted.error).toBeNull();
    expect(
      (await b.client.from('financial_transactions').select('id').eq('id', transactionId)).data,
    ).toEqual([]);
    // Direct writes are rejected for everyone, including the owner: ledger
    // mutations only flow through the backend Financial Engine.
    expect(
      (
        await b.client
          .from('financial_transactions')
          .update({ amount_minor: 1 })
          .eq('id', transactionId)
          .select('id')
      ).error,
    ).not.toBeNull();
    expect(
      (
        await b.client.from('financial_transactions').insert({
          id: crypto.randomUUID(),
          owner_id: a.id,
          goal_id: aggregate.goalId,
          kind: 'contribution',
          amount_minor: 1,
          effective_date: '2026-07-30',
        })
      ).error,
    ).not.toBeNull();
    expect(
      (
        await a.client.from('financial_transactions').insert({
          id: crypto.randomUUID(),
          owner_id: a.id,
          goal_id: aggregate.goalId,
          kind: 'contribution',
          amount_minor: 1,
          effective_date: '2026-07-30',
        })
      ).error,
    ).not.toBeNull();
    const malformed = await admin.from('financial_transactions').insert({
      id: crypto.randomUUID(),
      owner_id: a.id,
      goal_id: aggregate.goalId,
      kind: 'purchase',
      amount_minor: 100,
      effective_date: '2026-07-30',
      item_id: null,
    });
    expect(malformed.error?.message).toMatch(/kind_references_check/);
  });

  it('serializes concurrent purchases so the aggregate cannot double-spend', async () => {
    const owner = await user();
    const aggregate = await goal(owner, 2);
    await service.create(owner.id, aggregate.goalId, {
      kind: 'contribution',
      amount: '600.00',
      effectiveDate: '2026-07-30',
    });
    const results = await Promise.allSettled(
      aggregate.itemIds.map((itemId) =>
        service.purchase(owner.id, aggregate.goalId, itemId, {
          amount: '400.00',
          effectiveDate: '2026-07-31',
        }),
      ),
    );
    expect(results.filter((entry) => entry.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((entry) => entry.status === 'rejected')).toHaveLength(1);
    const history = await service.history(owner.id, aggregate.goalId);
    expect(history.totals).toMatchObject({
      funded: '600.00',
      spent: '400.00',
      available: '200.00',
    });

    const purchased = history.transactions.find((row) => row.kind === 'purchase');
    expect(purchased?.itemId).toBeTruthy();
    const goals = createGoalService(
      createGoalRepository(database.db),
      createFinancialRepository(database.db),
    );
    await expect(
      goals.deleteItem(owner.id, aggregate.goalId, purchased!.itemId!),
    ).rejects.toMatchObject({ code: 'PURCHASED_ITEM_DELETE_BLOCKED' });
    await expect(
      goals.update(owner.id, aggregate.goalId, { currency: 'EUR' }),
    ).rejects.toMatchObject({ code: 'CURRENCY_LOCKED' });

    // After a full undo the item can be deleted; its net-zero purchase pair
    // leaves the ledger with it, and the remaining history replays cleanly.
    await service.undo(owner.id, aggregate.goalId, purchased!.id, {
      effectiveDate: '2026-07-31',
    });
    const afterDelete = await goals.deleteItem(owner.id, aggregate.goalId, purchased!.itemId!);
    expect(afterDelete.items.some((entry) => entry.id === purchased!.itemId)).toBe(false);
    const finalHistory = await service.history(owner.id, aggregate.goalId);
    expect(finalHistory.transactions.some((row) => row.itemId === purchased!.itemId)).toBe(false);
    expect(finalHistory.totals).toMatchObject({
      funded: '600.00',
      spent: '0.00',
      available: '600.00',
    });
  });
});
