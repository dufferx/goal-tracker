import {
  deploymentCapabilitiesSchema,
  profileSchema,
  updateProfileRequestSchema,
} from '@goal-tracker/contracts';
import type { DeploymentCapabilities, Profile } from '@goal-tracker/contracts';
import type {
  FinancialRepository,
  GoalRepository,
  ProfileRecord,
  ProfileRepository,
} from '@goal-tracker/database';
import Fastify from 'fastify';

import type { AuthVerifier } from './auth.js';
import { requireOwnerId } from './auth-guard.js';
import { apiError } from './errors.js';
import { registerGoalRoutes } from './goals/routes.js';
import { createGoalService } from './goals/service.js';
import { registerFinancialRoutes } from './finance/routes.js';
import { createFinancialService } from './finance/service.js';

export interface ServerDependencies {
  allowedWebOrigin?: string;
  authVerifier?: AuthVerifier;
  deploymentCapabilities?: DeploymentCapabilities;
  profileRepository?: ProfileRepository;
  goalRepository?: GoalRepository;
  financialRepository?: FinancialRepository;
}

const unavailableAuthVerifier: AuthVerifier = {
  async verifyAccessToken() {
    return undefined;
  },
};

const unavailableProfileRepository: ProfileRepository = {
  async findByOwnerId() {
    throw new Error('Profile repository is not configured.');
  },
  async updateByOwnerId() {
    throw new Error('Profile repository is not configured.');
  },
};

const unavailableGoalRepository: GoalRepository = {
  async listByOwner() {
    throw new Error('Goal repository is not configured.');
  },
  async findByOwnerAndId() {
    throw new Error('Goal repository is not configured.');
  },
  async listItemsByOwnerAndGoal() {
    throw new Error('Goal repository is not configured.');
  },
  async create() {
    throw new Error('Goal repository is not configured.');
  },
  async update() {
    throw new Error('Goal repository is not configured.');
  },
  async updateLocked() {
    throw new Error('Goal repository is not configured.');
  },
  async permanentlyDelete() {
    throw new Error('Goal repository is not configured.');
  },
  async createItem() {
    throw new Error('Goal repository is not configured.');
  },
  async updateItem() {
    throw new Error('Goal repository is not configured.');
  },
  async deleteItem() {
    throw new Error('Goal repository is not configured.');
  },
  async reorderItems() {
    throw new Error('Goal repository is not configured.');
  },
};

const unavailableFinancialRepository: FinancialRepository = {
  async findSnapshot() {
    throw new Error('Financial repository is not configured.');
  },
  async runLockedMutation() {
    throw new Error('Financial repository is not configured.');
  },
};

function toProfile(record: ProfileRecord): Profile {
  return profileSchema.parse({
    id: record.id,
    displayName: record.displayName,
    defaultCurrency: record.defaultCurrency,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  });
}

function clientErrorStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }

  const statusCode = Reflect.get(error, 'statusCode');
  return typeof statusCode === 'number' && statusCode >= 400 && statusCode < 500
    ? statusCode
    : undefined;
}

export function buildServer(dependencies: ServerDependencies = {}) {
  const server = Fastify({
    logger: process.env.NODE_ENV !== 'test',
  });
  const authVerifier = dependencies.authVerifier ?? unavailableAuthVerifier;
  const profileRepository = dependencies.profileRepository ?? unavailableProfileRepository;
  const goalRepository = dependencies.goalRepository ?? unavailableGoalRepository;
  const financialRepository = dependencies.financialRepository ?? unavailableFinancialRepository;
  const goalService = createGoalService(goalRepository, dependencies.financialRepository);
  const financialService = createFinancialService(financialRepository);
  const deploymentCapabilities = deploymentCapabilitiesSchema.parse(
    dependencies.deploymentCapabilities ?? {
      registrationEnabled: false,
      passwordRecoveryEmailEnabled: false,
    },
  );

  if (dependencies.allowedWebOrigin) {
    server.addHook('onRequest', async (request, reply) => {
      if (request.headers.origin === dependencies.allowedWebOrigin) {
        void reply.header('access-control-allow-origin', dependencies.allowedWebOrigin);
        void reply.header('access-control-allow-credentials', 'true');
        void reply.header('vary', 'Origin');
      }
    });

    server.options('*', async (request, reply) => {
      if (request.headers.origin !== dependencies.allowedWebOrigin) {
        return reply.code(403).send();
      }

      return reply
        .headers({
          'access-control-allow-headers': 'authorization, content-type',
          'access-control-allow-methods': 'GET, PUT, POST, PATCH, DELETE, OPTIONS',
        })
        .code(204)
        .send();
    });
  }

  server.get('/health', async () => ({
    status: 'ok',
  }));

  server.get('/api/v1/capabilities', async () => deploymentCapabilities);

  server.get('/api/v1/profile', async (request, reply) => {
    const ownerId = await requireOwnerId(request, reply, authVerifier);

    if (!ownerId) {
      return;
    }

    try {
      const profile = await profileRepository.findByOwnerId(ownerId);

      if (!profile) {
        return reply
          .code(404)
          .send(apiError(request.id, 'PROFILE_NOT_FOUND', 'Profile not found.'));
      }

      return toProfile(profile);
    } catch (error) {
      request.log.error({ err: error }, 'Profile query failed');
      return reply
        .code(500)
        .send(apiError(request.id, 'INTERNAL_ERROR', 'The profile could not be loaded.'));
    }
  });

  server.put('/api/v1/profile', async (request, reply) => {
    const ownerId = await requireOwnerId(request, reply, authVerifier);

    if (!ownerId) {
      return;
    }

    const parsed = updateProfileRequestSchema.safeParse(request.body);

    if (!parsed.success) {
      const fieldErrors = Object.fromEntries(
        Object.entries(parsed.error.flatten().fieldErrors).filter(
          (entry): entry is [string, string[]] => entry[1] !== undefined,
        ),
      );

      return reply
        .code(400)
        .send(
          apiError(request.id, 'VALIDATION_ERROR', 'Check the highlighted fields.', fieldErrors),
        );
    }

    try {
      const profile = await profileRepository.updateByOwnerId(ownerId, parsed.data);

      if (!profile) {
        return reply
          .code(404)
          .send(apiError(request.id, 'PROFILE_NOT_FOUND', 'Profile not found.'));
      }

      return toProfile(profile);
    } catch (error) {
      request.log.error({ err: error }, 'Profile update failed');
      return reply
        .code(500)
        .send(apiError(request.id, 'INTERNAL_ERROR', 'The profile could not be updated.'));
    }
  });

  registerGoalRoutes(server, { authVerifier, goalService });
  registerFinancialRoutes(server, { authVerifier, financialService });

  server.setNotFoundHandler((request, reply) =>
    reply.code(404).send(apiError(request.id, 'NOT_FOUND', 'The requested route was not found.')),
  );

  server.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error }, 'Unhandled request error');
    const statusCode = clientErrorStatus(error) ?? 500;

    return reply
      .code(statusCode)
      .send(
        apiError(
          request.id,
          statusCode === 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR',
          statusCode === 500
            ? 'The request could not be completed.'
            : 'The request is invalid or unsupported.',
        ),
      );
  });

  return server;
}
