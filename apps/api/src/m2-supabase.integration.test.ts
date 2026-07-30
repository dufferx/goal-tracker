import { createClient } from '@supabase/supabase-js';
import { afterEach, describe, expect, it } from 'vitest';

const supabaseUrl = process.env.M1_SUPABASE_URL ?? process.env.M2_SUPABASE_URL;
const publishableKey =
  process.env.M1_SUPABASE_PUBLISHABLE_KEY ?? process.env.M2_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey =
  process.env.M1_SUPABASE_SERVICE_ROLE_KEY ?? process.env.M2_SUPABASE_SERVICE_ROLE_KEY;
const integrationAvailable = Boolean(supabaseUrl && publishableKey && serviceRoleKey);
const createdUserIds: string[] = [];

const integration = describe.skipIf(!integrationAvailable);

integration('M2 goals/items migration, constraints, and RLS', () => {
  const url = supabaseUrl ?? 'http://127.0.0.1:54321';
  const publicKey = publishableKey ?? 'integration-test-key-not-configured';
  const serviceKey = serviceRoleKey ?? 'integration-test-key-not-configured';
  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  afterEach(async () => {
    await Promise.all(
      createdUserIds.splice(0).map(async (userId) => {
        await admin.auth.admin.deleteUser(userId);
      }),
    );
  });

  async function createUser() {
    const email = `m2-${crypto.randomUUID()}@example.test`;
    const password = `M2-${crypto.randomUUID()}!`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { default_currency: 'USD' },
    });
    expect(error).toBeNull();
    createdUserIds.push(data.user!.id);

    const client = createClient(url, publicKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const signIn = await client.auth.signInWithPassword({ email, password });
    expect(signIn.error).toBeNull();
    return { client, userId: data.user!.id };
  }

  it('applies constraints, month normalization, item order, and cascade delete', async () => {
    const user = await createUser();
    const goalId = crypto.randomUUID();
    const itemA = crypto.randomUUID();
    const itemB = crypto.randomUUID();

    const createdGoal = await user.client
      .from('goals')
      .insert({
        id: goalId,
        owner_id: user.userId,
        name: 'Japan Trip',
        description: 'Flights and hotel',
        currency: 'USD',
        target_mode: 'fixed',
        fixed_target_minor: 300000,
        start_month: '2026-07-01',
        final_month: '2027-02-01',
        contributions_per_month: 2,
        preferred_contribution_minor: 12000,
        status: 'active',
      })
      .select('id, start_month, fixed_target_minor')
      .single();
    expect(createdGoal.error).toBeNull();
    expect(createdGoal.data?.start_month).toBe('2026-07-01');

    const itemsModeWithoutTarget = await user.client.from('goals').insert({
      id: crypto.randomUUID(),
      owner_id: user.userId,
      name: 'Bad fixed',
      currency: 'USD',
      target_mode: 'fixed',
      fixed_target_minor: null,
      start_month: '2026-07-01',
      contributions_per_month: 1,
      status: 'active',
    });
    expect(itemsModeWithoutTarget.error?.message).toMatch(/goals_fixed_target_mode_check/);

    const createdItems = await user.client
      .from('goal_items')
      .insert([
        {
          id: itemA,
          owner_id: user.userId,
          goal_id: goalId,
          name: 'Flights',
          expected_price_minor: 90000,
          due_month: '2026-10-01',
          position: 0,
        },
        {
          id: itemB,
          owner_id: user.userId,
          goal_id: goalId,
          name: 'Hotel',
          expected_price_minor: 70000,
          due_month: null,
          position: 1,
        },
      ])
      .select('id, position')
      .order('position');
    expect(createdItems.error).toBeNull();
    expect(createdItems.data?.map((row) => row.position)).toEqual([0, 1]);

    const earlyDue = await user.client.from('goal_items').insert({
      id: crypto.randomUUID(),
      owner_id: user.userId,
      goal_id: goalId,
      name: 'Too early',
      expected_price_minor: 1000,
      due_month: '2026-01-01',
      position: 2,
    });
    expect(earlyDue.error?.message).toMatch(/due_month cannot precede/i);

    const deleted = await user.client.from('goals').delete().eq('id', goalId);
    expect(deleted.error).toBeNull();
    const remainingItems = await user.client.from('goal_items').select('id').eq('goal_id', goalId);
    expect(remainingItems.error).toBeNull();
    expect(remainingItems.data).toEqual([]);
  });

  it('isolates goals and items between two users and rejects anonymous access', async () => {
    const userA = await createUser();
    const userB = await createUser();
    const goalId = crypto.randomUUID();
    const itemId = crypto.randomUUID();

    const insertGoal = await userA.client.from('goals').insert({
      id: goalId,
      owner_id: userA.userId,
      name: 'Home Gym',
      currency: 'USD',
      target_mode: 'items',
      fixed_target_minor: null,
      start_month: '2026-07-01',
      contributions_per_month: 1,
      status: 'active',
    });
    expect(insertGoal.error).toBeNull();

    const insertItem = await userA.client.from('goal_items').insert({
      id: itemId,
      owner_id: userA.userId,
      goal_id: goalId,
      name: 'Bench',
      expected_price_minor: 25000,
      due_month: null,
      position: 0,
    });
    expect(insertItem.error).toBeNull();

    const foreignGoalRead = await userB.client.from('goals').select('id').eq('id', goalId);
    const foreignItemRead = await userB.client.from('goal_items').select('id').eq('id', itemId);
    const foreignGoalUpdate = await userB.client
      .from('goals')
      .update({ name: 'Hijacked' })
      .eq('id', goalId)
      .select('id');
    const foreignItemDelete = await userB.client
      .from('goal_items')
      .delete()
      .eq('id', itemId)
      .select('id');
    const forgedInsert = await userB.client.from('goals').insert({
      id: crypto.randomUUID(),
      owner_id: userA.userId,
      name: 'Forged',
      currency: 'USD',
      target_mode: 'items',
      fixed_target_minor: null,
      start_month: '2026-07-01',
      contributions_per_month: 1,
      status: 'active',
    });

    expect(foreignGoalRead.data).toEqual([]);
    expect(foreignItemRead.data).toEqual([]);
    expect(foreignGoalUpdate.data).toEqual([]);
    expect(foreignItemDelete.data).toEqual([]);
    expect(forgedInsert.error).not.toBeNull();

    const anonymous = createClient(url, publicKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const anonymousGoals = await anonymous.from('goals').select('id');
    const anonymousItems = await anonymous.from('goal_items').select('id');
    expect(anonymousGoals.error).not.toBeNull();
    expect(anonymousItems.error).not.toBeNull();
  });

  it('rejects owner-inconsistent goal_items foreign keys', async () => {
    const userA = await createUser();
    const userB = await createUser();
    const goalId = crypto.randomUUID();

    const goal = await userA.client.from('goals').insert({
      id: goalId,
      owner_id: userA.userId,
      name: 'Owned by A',
      currency: 'USD',
      target_mode: 'items',
      fixed_target_minor: null,
      start_month: '2026-07-01',
      contributions_per_month: 1,
      status: 'active',
    });
    expect(goal.error).toBeNull();

    const inconsistent = await admin.from('goal_items').insert({
      id: crypto.randomUUID(),
      owner_id: userB.userId,
      goal_id: goalId,
      name: 'Wrong owner',
      expected_price_minor: 1000,
      due_month: null,
      position: 0,
    });
    expect(inconsistent.error).not.toBeNull();
  });
});
