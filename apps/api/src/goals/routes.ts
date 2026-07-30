import {
  convertPercentRequestSchema,
  createGoalItemRequestSchema,
  createGoalRequestSchema,
  deleteGoalRequestSchema,
  goalDetailSchema,
  goalItemSchema,
  goalListSchema,
  planningPreviewRequestSchema,
  planningPreviewResponseSchema,
  reorderGoalItemsRequestSchema,
  updateGoalItemRequestSchema,
  updateGoalRequestSchema,
} from '@goal-tracker/contracts';
import type { FastifyInstance } from 'fastify';

import type { AuthVerifier } from '../auth.js';
import { requireOwnerId } from '../auth-guard.js';
import { apiError } from '../errors.js';
import { toGoalDetailDto, toGoalDto, toGoalItemDto } from './serialize.js';
import { GoalServiceError, type GoalService } from './service.js';

function zodFieldErrors(error: {
  flatten: () => { fieldErrors: Record<string, string[] | undefined> };
}): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(error.flatten().fieldErrors).filter(
      (entry): entry is [string, string[]] => entry[1] !== undefined,
    ),
  );
}

function sendServiceError(
  reply: { code: (status: number) => { send: (body: unknown) => unknown } },
  requestId: string,
  error: GoalServiceError,
) {
  return reply
    .code(error.statusCode)
    .send(apiError(requestId, error.code, error.message, error.fieldErrors));
}

export function registerGoalRoutes(
  server: FastifyInstance,
  dependencies: {
    authVerifier: AuthVerifier;
    goalService: GoalService;
  },
) {
  const { authVerifier, goalService } = dependencies;

  server.get('/api/v1/goals', async (request, reply) => {
    const ownerId = await requireOwnerId(request, reply, authVerifier);
    if (!ownerId) return;

    try {
      const listed = await goalService.list(ownerId);
      return goalListSchema.parse({
        active: listed.active.map((entry) => toGoalDto(entry.goal, entry.items)),
        archived: listed.archived.map((entry) => toGoalDto(entry.goal, entry.items)),
      });
    } catch (error) {
      if (error instanceof GoalServiceError) {
        return sendServiceError(reply, request.id, error);
      }
      request.log.error({ err: error }, 'Goal list failed');
      return reply
        .code(500)
        .send(apiError(request.id, 'INTERNAL_ERROR', 'Goals could not be loaded.'));
    }
  });

  server.post('/api/v1/goals', async (request, reply) => {
    const ownerId = await requireOwnerId(request, reply, authVerifier);
    if (!ownerId) return;

    const parsed = createGoalRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .code(400)
        .send(
          apiError(
            request.id,
            'VALIDATION_ERROR',
            'Check the highlighted fields.',
            zodFieldErrors(parsed.error),
          ),
        );
    }

    try {
      const created = await goalService.create(ownerId, parsed.data);
      return reply.code(201).send(toGoalDetailDto(created.goal, created.items));
    } catch (error) {
      if (error instanceof GoalServiceError) {
        return sendServiceError(reply, request.id, error);
      }
      request.log.error({ err: error }, 'Goal create failed');
      return reply
        .code(500)
        .send(apiError(request.id, 'INTERNAL_ERROR', 'The goal could not be created.'));
    }
  });

  server.get('/api/v1/goals/:goalId', async (request, reply) => {
    const ownerId = await requireOwnerId(request, reply, authVerifier);
    if (!ownerId) return;
    const { goalId } = request.params as { goalId: string };

    try {
      const detail = await goalService.get(ownerId, goalId);
      return toGoalDetailDto(detail.goal, detail.items);
    } catch (error) {
      if (error instanceof GoalServiceError) {
        return sendServiceError(reply, request.id, error);
      }
      request.log.error({ err: error }, 'Goal detail failed');
      return reply
        .code(500)
        .send(apiError(request.id, 'INTERNAL_ERROR', 'The goal could not be loaded.'));
    }
  });

  server.patch('/api/v1/goals/:goalId', async (request, reply) => {
    const ownerId = await requireOwnerId(request, reply, authVerifier);
    if (!ownerId) return;
    const { goalId } = request.params as { goalId: string };

    const parsed = updateGoalRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .code(400)
        .send(
          apiError(
            request.id,
            'VALIDATION_ERROR',
            'Check the highlighted fields.',
            zodFieldErrors(parsed.error),
          ),
        );
    }

    try {
      const updated = await goalService.update(ownerId, goalId, parsed.data);
      return toGoalDetailDto(updated.goal, updated.items);
    } catch (error) {
      if (error instanceof GoalServiceError) {
        return sendServiceError(reply, request.id, error);
      }
      request.log.error({ err: error }, 'Goal update failed');
      return reply
        .code(500)
        .send(apiError(request.id, 'INTERNAL_ERROR', 'The goal could not be updated.'));
    }
  });

  server.post('/api/v1/goals/:goalId/planning-preview', async (request, reply) => {
    const ownerId = await requireOwnerId(request, reply, authVerifier);
    if (!ownerId) return;
    const { goalId } = request.params as { goalId: string };

    const parsed = planningPreviewRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .code(400)
        .send(
          apiError(
            request.id,
            'VALIDATION_ERROR',
            'Check the highlighted fields.',
            zodFieldErrors(parsed.error),
          ),
        );
    }

    try {
      const result = await goalService.preview(ownerId, goalId, parsed.data);
      return planningPreviewResponseSchema.parse(result.preview);
    } catch (error) {
      if (error instanceof GoalServiceError) {
        return sendServiceError(reply, request.id, error);
      }
      request.log.error({ err: error }, 'Planning preview failed');
      return reply
        .code(500)
        .send(apiError(request.id, 'INTERNAL_ERROR', 'The planning preview could not be created.'));
    }
  });

  server.post('/api/v1/goals/:goalId/archive', async (request, reply) => {
    const ownerId = await requireOwnerId(request, reply, authVerifier);
    if (!ownerId) return;
    const { goalId } = request.params as { goalId: string };

    try {
      const archived = await goalService.archive(ownerId, goalId);
      return toGoalDetailDto(archived.goal, archived.items);
    } catch (error) {
      if (error instanceof GoalServiceError) {
        return sendServiceError(reply, request.id, error);
      }
      request.log.error({ err: error }, 'Goal archive failed');
      return reply
        .code(500)
        .send(apiError(request.id, 'INTERNAL_ERROR', 'The goal could not be archived.'));
    }
  });

  server.post('/api/v1/goals/:goalId/restore', async (request, reply) => {
    const ownerId = await requireOwnerId(request, reply, authVerifier);
    if (!ownerId) return;
    const { goalId } = request.params as { goalId: string };

    try {
      const restored = await goalService.restore(ownerId, goalId);
      return toGoalDetailDto(restored.goal, restored.items);
    } catch (error) {
      if (error instanceof GoalServiceError) {
        return sendServiceError(reply, request.id, error);
      }
      request.log.error({ err: error }, 'Goal restore failed');
      return reply
        .code(500)
        .send(apiError(request.id, 'INTERNAL_ERROR', 'The goal could not be restored.'));
    }
  });

  server.delete('/api/v1/goals/:goalId', async (request, reply) => {
    const ownerId = await requireOwnerId(request, reply, authVerifier);
    if (!ownerId) return;
    const { goalId } = request.params as { goalId: string };

    const parsed = deleteGoalRequestSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply
        .code(400)
        .send(
          apiError(
            request.id,
            'VALIDATION_ERROR',
            'Check the highlighted fields.',
            zodFieldErrors(parsed.error),
          ),
        );
    }

    try {
      await goalService.permanentlyDelete(ownerId, goalId, parsed.data);
      return reply.code(204).send();
    } catch (error) {
      if (error instanceof GoalServiceError) {
        return sendServiceError(reply, request.id, error);
      }
      request.log.error({ err: error }, 'Goal delete failed');
      return reply
        .code(500)
        .send(apiError(request.id, 'INTERNAL_ERROR', 'The goal could not be deleted.'));
    }
  });

  server.get('/api/v1/goals/:goalId/items', async (request, reply) => {
    const ownerId = await requireOwnerId(request, reply, authVerifier);
    if (!ownerId) return;
    const { goalId } = request.params as { goalId: string };

    try {
      const detail = await goalService.get(ownerId, goalId);
      return detail.items.map(toGoalItemDto);
    } catch (error) {
      if (error instanceof GoalServiceError) {
        return sendServiceError(reply, request.id, error);
      }
      request.log.error({ err: error }, 'Item list failed');
      return reply
        .code(500)
        .send(apiError(request.id, 'INTERNAL_ERROR', 'Items could not be loaded.'));
    }
  });

  server.post('/api/v1/goals/:goalId/items', async (request, reply) => {
    const ownerId = await requireOwnerId(request, reply, authVerifier);
    if (!ownerId) return;
    const { goalId } = request.params as { goalId: string };

    const parsed = createGoalItemRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .code(400)
        .send(
          apiError(
            request.id,
            'VALIDATION_ERROR',
            'Check the highlighted fields.',
            zodFieldErrors(parsed.error),
          ),
        );
    }

    try {
      const created = await goalService.createItem(ownerId, goalId, parsed.data);
      return reply
        .code(201)
        .send(goalDetailSchema.parse(toGoalDetailDto(created.goal, created.items)));
    } catch (error) {
      if (error instanceof GoalServiceError) {
        return sendServiceError(reply, request.id, error);
      }
      request.log.error({ err: error }, 'Item create failed');
      return reply
        .code(500)
        .send(apiError(request.id, 'INTERNAL_ERROR', 'The item could not be created.'));
    }
  });

  server.patch('/api/v1/goals/:goalId/items/:itemId', async (request, reply) => {
    const ownerId = await requireOwnerId(request, reply, authVerifier);
    if (!ownerId) return;
    const { goalId, itemId } = request.params as { goalId: string; itemId: string };

    const parsed = updateGoalItemRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .code(400)
        .send(
          apiError(
            request.id,
            'VALIDATION_ERROR',
            'Check the highlighted fields.',
            zodFieldErrors(parsed.error),
          ),
        );
    }

    try {
      const updated = await goalService.updateItem(ownerId, goalId, itemId, parsed.data);
      return toGoalDetailDto(updated.goal, updated.items);
    } catch (error) {
      if (error instanceof GoalServiceError) {
        return sendServiceError(reply, request.id, error);
      }
      request.log.error({ err: error }, 'Item update failed');
      return reply
        .code(500)
        .send(apiError(request.id, 'INTERNAL_ERROR', 'The item could not be updated.'));
    }
  });

  server.delete('/api/v1/goals/:goalId/items/:itemId', async (request, reply) => {
    const ownerId = await requireOwnerId(request, reply, authVerifier);
    if (!ownerId) return;
    const { goalId, itemId } = request.params as { goalId: string; itemId: string };

    try {
      const deleted = await goalService.deleteItem(ownerId, goalId, itemId);
      return toGoalDetailDto(deleted.goal, deleted.items);
    } catch (error) {
      if (error instanceof GoalServiceError) {
        return sendServiceError(reply, request.id, error);
      }
      request.log.error({ err: error }, 'Item delete failed');
      return reply
        .code(500)
        .send(apiError(request.id, 'INTERNAL_ERROR', 'The item could not be deleted.'));
    }
  });

  server.put('/api/v1/goals/:goalId/items/order', async (request, reply) => {
    const ownerId = await requireOwnerId(request, reply, authVerifier);
    if (!ownerId) return;
    const { goalId } = request.params as { goalId: string };

    const parsed = reorderGoalItemsRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .code(400)
        .send(
          apiError(
            request.id,
            'VALIDATION_ERROR',
            'Check the highlighted fields.',
            zodFieldErrors(parsed.error),
          ),
        );
    }

    try {
      const reordered = await goalService.reorderItems(ownerId, goalId, parsed.data);
      return reordered.items.map((item) => goalItemSchema.parse(toGoalItemDto(item)));
    } catch (error) {
      if (error instanceof GoalServiceError) {
        return sendServiceError(reply, request.id, error);
      }
      request.log.error({ err: error }, 'Item reorder failed');
      return reply
        .code(500)
        .send(apiError(request.id, 'INTERNAL_ERROR', 'Items could not be reordered.'));
    }
  });

  server.post('/api/v1/money/convert-percent', async (request, reply) => {
    const ownerId = await requireOwnerId(request, reply, authVerifier);
    if (!ownerId) return;

    const parsed = convertPercentRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .code(400)
        .send(
          apiError(
            request.id,
            'VALIDATION_ERROR',
            'Check the highlighted fields.',
            zodFieldErrors(parsed.error),
          ),
        );
    }

    try {
      return goalService.convertPercent(parsed.data.fixedTarget, parsed.data.percent);
    } catch (error) {
      if (error instanceof GoalServiceError) {
        return sendServiceError(reply, request.id, error);
      }
      request.log.error({ err: error }, 'Percent conversion failed');
      return reply
        .code(500)
        .send(apiError(request.id, 'INTERNAL_ERROR', 'The percentage could not be converted.'));
    }
  });
}
