import { createClient } from '@supabase/supabase-js';
import { afterEach, describe, expect, it } from 'vitest';

const supabaseUrl = process.env.M1_SUPABASE_URL;
const publishableKey = process.env.M1_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.M1_SUPABASE_SERVICE_ROLE_KEY;
const integrationAvailable = Boolean(supabaseUrl && publishableKey && serviceRoleKey);
const createdUserIds: string[] = [];

const integration = describe.skipIf(!integrationAvailable);

integration('M1 profile provisioning, constraints, and RLS', () => {
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

  async function createUser(defaultCurrency: string) {
    const email = `m1-${crypto.randomUUID()}@example.test`;
    const password = `M1-${crypto.randomUUID()}!`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { default_currency: defaultCurrency },
    });

    expect(error).toBeNull();
    expect(data.user).not.toBeNull();
    createdUserIds.push(data.user!.id);

    const client = createClient(url, publicKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const signIn = await client.auth.signInWithPassword({ email, password });
    expect(signIn.error).toBeNull();

    return { client, userId: data.user!.id };
  }

  it('provisions a profile from validated untrusted currency metadata and falls back safely', async () => {
    const japaneseUser = await createUser('JPY');
    const invalidMetadataUser = await createUser('not-a-currency');

    const japaneseProfile = await japaneseUser.client
      .from('profiles')
      .select('id, display_name, default_currency')
      .single();
    const fallbackProfile = await invalidMetadataUser.client
      .from('profiles')
      .select('id, display_name, default_currency')
      .single();

    expect(japaneseProfile.error).toBeNull();
    expect(japaneseProfile.data).toEqual({
      id: japaneseUser.userId,
      display_name: null,
      default_currency: 'JPY',
    });
    expect(fallbackProfile.error).toBeNull();
    expect(fallbackProfile.data?.default_currency).toBe('USD');
  });

  it('allows own access while hiding and protecting another user profile', async () => {
    const userA = await createUser('JPY');
    const userB = await createUser('USD');

    const ownRead = await userA.client.from('profiles').select('id').eq('id', userA.userId);
    const foreignRead = await userA.client.from('profiles').select('id').eq('id', userB.userId);
    const foreignUpdate = await userA.client
      .from('profiles')
      .update({ default_currency: 'EUR' })
      .eq('id', userB.userId)
      .select('id');
    const userBProfile = await userB.client.from('profiles').select('default_currency').single();

    expect(ownRead.error).toBeNull();
    expect(ownRead.data).toEqual([{ id: userA.userId }]);
    expect(foreignRead.error).toBeNull();
    expect(foreignRead.data).toEqual([]);
    expect(foreignUpdate.error).toBeNull();
    expect(foreignUpdate.data).toEqual([]);
    expect(userBProfile.data?.default_currency).toBe('USD');
  });

  it('denies anonymous access and enforces profile constraints', async () => {
    const user = await createUser('USD');
    const anonymous = createClient(url, publicKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const anonymousRead = await anonymous.from('profiles').select('id');
    const invalidCurrency = await user.client
      .from('profiles')
      .update({ default_currency: 'usd' })
      .eq('id', user.userId);
    const untrimmedName = await user.client
      .from('profiles')
      .update({ display_name: ' Aang ' })
      .eq('id', user.userId);

    expect(anonymousRead.error).not.toBeNull();
    expect(invalidCurrency.error?.message).toContain('profiles_default_currency_format_check');
    expect(untrimmedName.error?.message).toContain('profiles_display_name_trimmed_bounded_check');
  });
});
