import type { ProfileRepository } from '@goal-tracker/database';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';

import type { AuthVerifier } from './auth.js';
import { buildServer } from './server.js';

const servers: FastifyInstance[] = [];
const ownerId = '7fd02d1e-365d-4b70-9769-4709166e31ea';
const createdAt = new Date('2026-07-29T20:00:00.000Z');

function authenticatedDependencies() {
  const authVerifier: AuthVerifier = {
    verifyAccessToken: vi.fn(async (token) =>
      token === 'valid-token' ? { id: ownerId } : undefined,
    ),
  };
  const profileRepository: ProfileRepository = {
    findByOwnerId: vi.fn(async (requestedOwnerId) =>
      requestedOwnerId === ownerId
        ? {
            id: ownerId,
            displayName: 'Aang',
            defaultCurrency: 'USD',
            createdAt,
            updatedAt: createdAt,
          }
        : undefined,
    ),
    updateByOwnerId: vi.fn(async (requestedOwnerId, update) =>
      requestedOwnerId === ownerId
        ? {
            id: ownerId,
            ...update,
            createdAt,
            updatedAt: new Date('2026-07-29T20:01:00.000Z'),
          }
        : undefined,
    ),
  };

  return { authVerifier, profileRepository };
}

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => server.close()));
});

describe('GET /health', () => {
  it('reports that the API is alive', async () => {
    const server = buildServer();
    servers.push(server);

    const response = await server.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });
});

describe('GET /api/v1/capabilities', () => {
  it('returns only public deployment behavior', async () => {
    const server = buildServer({
      deploymentCapabilities: {
        registrationEnabled: true,
        passwordRecoveryEmailEnabled: false,
        version: '1.0.0',
      },
    });
    servers.push(server);

    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/capabilities',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      registrationEnabled: true,
      passwordRecoveryEmailEnabled: false,
      version: '1.0.0',
    });
  });
});

describe('stable API errors', () => {
  it('uses the shared envelope for unknown routes', async () => {
    const server = buildServer();
    servers.push(server);

    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/unknown',
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      error: {
        code: 'NOT_FOUND',
        message: 'The requested route was not found.',
        requestId: expect.any(String),
      },
    });
  });

  it('uses the shared envelope for malformed JSON', async () => {
    const server = buildServer(authenticatedDependencies());
    servers.push(server);

    const response = await server.inject({
      method: 'PUT',
      url: '/api/v1/profile',
      headers: {
        authorization: 'Bearer valid-token',
        'content-type': 'application/json',
      },
      payload: '{"displayName":',
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: {
        code: 'REQUEST_ERROR',
        requestId: expect.any(String),
      },
    });
  });
});

describe('configured CORS boundary', () => {
  it('allows preflight only from the configured web origin', async () => {
    const server = buildServer({
      allowedWebOrigin: 'https://app.example.test',
    });
    servers.push(server);

    const allowed = await server.inject({
      method: 'OPTIONS',
      url: '/api/v1/profile',
      headers: { origin: 'https://app.example.test' },
    });
    const denied = await server.inject({
      method: 'OPTIONS',
      url: '/api/v1/profile',
      headers: { origin: 'https://other.example.test' },
    });

    expect(allowed.statusCode).toBe(204);
    expect(allowed.headers['access-control-allow-origin']).toBe('https://app.example.test');
    expect(allowed.headers['access-control-allow-methods']).toBe(
      'GET, PUT, POST, PATCH, DELETE, OPTIONS',
    );
    expect(denied.statusCode).toBe(403);
    expect(denied.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('authenticated profile boundary', () => {
  it.each([undefined, 'Basic value', 'Bearer', 'Bearer token with-spaces', 'Bearer invalid-token'])(
    'rejects a missing or malformed credential: %s',
    async (authorization) => {
      const dependencies = authenticatedDependencies();
      const server = buildServer(dependencies);
      servers.push(server);

      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/profile',
        headers: authorization ? { authorization } : {},
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toMatchObject({
        error: {
          code: authorization === 'Bearer invalid-token' ? 'AUTH_INVALID' : 'AUTH_REQUIRED',
          requestId: expect.any(String),
        },
      });
    },
  );

  it('loads only the profile owned by the verified token subject', async () => {
    const dependencies = authenticatedDependencies();
    const server = buildServer(dependencies);
    servers.push(server);

    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/profile',
      headers: { authorization: 'Bearer valid-token' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      id: ownerId,
      displayName: 'Aang',
      defaultCurrency: 'USD',
      createdAt: createdAt.toISOString(),
      updatedAt: createdAt.toISOString(),
    });
    expect(dependencies.profileRepository.findByOwnerId).toHaveBeenCalledWith(ownerId);
  });

  it('updates the verified owner and does not accept a forged owner ID', async () => {
    const dependencies = authenticatedDependencies();
    const server = buildServer(dependencies);
    servers.push(server);

    const forgedResponse = await server.inject({
      method: 'PUT',
      url: '/api/v1/profile',
      headers: { authorization: 'Bearer valid-token' },
      payload: {
        id: 'fc8fdd76-a488-480f-a3eb-4cb6ada54c79',
        displayName: 'Aang',
        defaultCurrency: 'JPY',
      },
    });

    expect(forgedResponse.statusCode).toBe(400);
    expect(dependencies.profileRepository.updateByOwnerId).not.toHaveBeenCalled();

    const response = await server.inject({
      method: 'PUT',
      url: '/api/v1/profile',
      headers: { authorization: 'Bearer valid-token' },
      payload: {
        displayName: 'Avatar Aang',
        defaultCurrency: 'JPY',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(dependencies.profileRepository.updateByOwnerId).toHaveBeenCalledWith(ownerId, {
      displayName: 'Avatar Aang',
      defaultCurrency: 'JPY',
    });
  });

  it('returns stable validation details without calling persistence', async () => {
    const dependencies = authenticatedDependencies();
    const server = buildServer(dependencies);
    servers.push(server);

    const response = await server.inject({
      method: 'PUT',
      url: '/api/v1/profile',
      headers: { authorization: 'Bearer valid-token' },
      payload: {
        displayName: ' ',
        defaultCurrency: 'usd',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: {
        code: 'VALIDATION_ERROR',
        fieldErrors: {
          defaultCurrency: expect.any(Array),
          displayName: expect.any(Array),
        },
        requestId: expect.any(String),
      },
    });
    expect(dependencies.profileRepository.updateByOwnerId).not.toHaveBeenCalled();
  });

  it('maps an Auth service outage without exposing its error', async () => {
    const dependencies = authenticatedDependencies();
    dependencies.authVerifier.verifyAccessToken = vi.fn(async () => {
      throw new Error('sensitive upstream detail');
    });
    const server = buildServer(dependencies);
    servers.push(server);

    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/profile',
      headers: { authorization: 'Bearer valid-token' },
    });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({
      error: {
        code: 'AUTH_UNAVAILABLE',
        requestId: expect.any(String),
      },
    });
    expect(response.body).not.toContain('sensitive');
  });
});
