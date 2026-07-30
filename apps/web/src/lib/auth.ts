import { createClient, type AuthChangeEvent, type Session } from '@supabase/supabase-js';

export type AuthSession = {
  accessToken: string;
  email: string;
};

export type AuthResult = { error?: string };

export interface AuthGateway {
  restoreSession(): Promise<AuthSession | null>;
  onChange(callback: (event: AuthChangeEvent, session: AuthSession | null) => void): () => void;
  signIn(email: string, password: string): Promise<AuthResult>;
  signUp(email: string, password: string, defaultCurrency: string): Promise<AuthResult>;
  signOut(): Promise<AuthResult>;
  requestPasswordReset(email: string, redirectTo: string): Promise<AuthResult>;
  updatePassword(password: string): Promise<AuthResult>;
}

function toAuthSession(session: Session | null): AuthSession | null {
  const email = session?.user.email;
  if (!session || !email) return null;
  return { accessToken: session.access_token, email };
}

export function createSupabaseAuthGateway(options: {
  url: string;
  publishableKey: string;
}): AuthGateway {
  const supabase = createClient(options.url, options.publishableKey, {
    auth: {
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  return {
    async restoreSession() {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw new Error(error.message);
      return toAuthSession(data.session);
    },
    onChange(callback) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        callback(event, toAuthSession(session));
      });
      return () => subscription.unsubscribe();
    },
    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error ? { error: error.message } : {};
    },
    async signUp(email, password, defaultCurrency) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { default_currency: defaultCurrency } },
      });
      return error ? { error: error.message } : {};
    },
    async signOut() {
      const { error } = await supabase.auth.signOut();
      return error ? { error: error.message } : {};
    },
    async requestPasswordReset(email, redirectTo) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      return error ? { error: error.message } : {};
    },
    async updatePassword(password) {
      const { error } = await supabase.auth.updateUser({ password });
      return error ? { error: error.message } : {};
    },
  };
}
