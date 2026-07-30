import type { FastifyReply, FastifyRequest } from 'fastify';

import type { AuthVerifier } from './auth.js';
import { extractBearerToken } from './auth.js';
import { apiError } from './errors.js';

export async function requireOwnerId(
  request: FastifyRequest,
  reply: FastifyReply,
  authVerifier: AuthVerifier,
): Promise<string | undefined> {
  const accessToken = extractBearerToken(request);

  if (!accessToken) {
    await reply
      .code(401)
      .send(apiError(request.id, 'AUTH_REQUIRED', 'A valid access token is required.'));
    return undefined;
  }

  let user;

  try {
    user = await authVerifier.verifyAccessToken(accessToken);
  } catch (error) {
    request.log.error({ err: error }, 'Authentication verification failed');
    await reply
      .code(503)
      .send(apiError(request.id, 'AUTH_UNAVAILABLE', 'Authentication is temporarily unavailable.'));
    return undefined;
  }

  if (!user) {
    await reply
      .code(401)
      .send(apiError(request.id, 'AUTH_INVALID', 'The access token is invalid or expired.'));
    return undefined;
  }

  return user.id;
}
