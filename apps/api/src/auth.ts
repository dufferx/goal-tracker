import { createClient } from '@supabase/supabase-js';
import type { FastifyRequest } from 'fastify';

export interface AuthenticatedUser {
  id: string;
}

export interface AuthVerifier {
  verifyAccessToken(accessToken: string): Promise<AuthenticatedUser | undefined>;
}

export function extractBearerToken(request: FastifyRequest): string | undefined {
  const authorization = request.headers.authorization;

  if (!authorization) {
    return undefined;
  }

  const match = /^Bearer ([^\s,]+)$/.exec(authorization);
  return match?.[1];
}

export function createSupabaseAuthVerifier(
  supabaseUrl: string,
  publishableKey: string,
): AuthVerifier {
  const client = createClient(supabaseUrl, publishableKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });

  return {
    async verifyAccessToken(accessToken) {
      const {
        data: { user },
        error,
      } = await client.auth.getUser(accessToken);

      if (error || !user) {
        return undefined;
      }

      return { id: user.id };
    },
  };
}
