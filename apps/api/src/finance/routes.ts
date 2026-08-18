import {
  createFinancialTransactionRequestSchema,
  financialHistorySchema,
  financialMutationResponseSchema,
  purchaseItemRequestSchema,
  undoPurchaseRequestSchema,
  updateFinancialTransactionRequestSchema,
} from '@goal-tracker/contracts';
import type { FastifyInstance, FastifyReply } from 'fastify';
import type { AuthVerifier } from '../auth.js';
import { requireOwnerId } from '../auth-guard.js';
import { apiError } from '../errors.js';
import type { FinancialService } from './service.js';
import { FinancialServiceError } from './service.js';

function validation(
  reply: FastifyReply,
  requestId: string,
  fieldErrors: Record<string, string[] | undefined>,
) {
  const present = Object.fromEntries(
    Object.entries(fieldErrors).filter(
      (entry): entry is [string, string[]] => entry[1] !== undefined,
    ),
  );
  return reply
    .code(400)
    .send(apiError(requestId, 'VALIDATION_ERROR', 'Check the highlighted fields.', present));
}
function failure(reply: FastifyReply, requestId: string, error: FinancialServiceError) {
  return reply
    .code(error.statusCode)
    .send(apiError(requestId, error.code, error.message, error.fieldErrors));
}

export function registerFinancialRoutes(
  server: FastifyInstance,
  dependencies: { authVerifier: AuthVerifier; financialService: FinancialService },
) {
  const { authVerifier, financialService } = dependencies;
  server.get('/api/v1/goals/:goalId/transactions', async (request, reply) => {
    const ownerId = await requireOwnerId(request, reply, authVerifier);
    if (!ownerId) return;
    const { goalId } = request.params as { goalId: string };
    const { kind, month } = request.query as { kind?: string; month?: string };
    if (kind && !['contribution', 'withdrawal', 'purchase', 'purchase_undo'].includes(kind))
      return reply
        .code(400)
        .send(apiError(request.id, 'VALIDATION_ERROR', 'Unknown transaction kind.'));
    if (month && !/^\d{4}-(0[1-9]|1[0-2])$/.test(month))
      return reply
        .code(400)
        .send(apiError(request.id, 'VALIDATION_ERROR', 'Month must use YYYY-MM.'));
    try {
      return financialHistorySchema.parse(
        await financialService.history(ownerId, goalId, { kind, month }),
      );
    } catch (error) {
      if (error instanceof FinancialServiceError) return failure(reply, request.id, error);
      throw error;
    }
  });

  server.post('/api/v1/goals/:goalId/transactions', async (request, reply) => {
    const ownerId = await requireOwnerId(request, reply, authVerifier);
    if (!ownerId) return;
    const parsed = createFinancialTransactionRequestSchema.safeParse(request.body);
    if (!parsed.success) return validation(reply, request.id, parsed.error.flatten().fieldErrors);
    const { goalId } = request.params as { goalId: string };
    try {
      return reply
        .code(201)
        .send(
          financialMutationResponseSchema.parse(
            await financialService.create(ownerId, goalId, parsed.data),
          ),
        );
    } catch (error) {
      if (error instanceof FinancialServiceError) return failure(reply, request.id, error);
      throw error;
    }
  });

  server.patch('/api/v1/goals/:goalId/transactions/:transactionId', async (request, reply) => {
    const ownerId = await requireOwnerId(request, reply, authVerifier);
    if (!ownerId) return;
    const parsed = updateFinancialTransactionRequestSchema.safeParse(request.body);
    if (!parsed.success) return validation(reply, request.id, parsed.error.flatten().fieldErrors);
    const params = request.params as { goalId: string; transactionId: string };
    try {
      return financialMutationResponseSchema.parse(
        await financialService.update(ownerId, params.goalId, params.transactionId, parsed.data),
      );
    } catch (error) {
      if (error instanceof FinancialServiceError) return failure(reply, request.id, error);
      throw error;
    }
  });

  server.delete('/api/v1/goals/:goalId/transactions/:transactionId', async (request, reply) => {
    const ownerId = await requireOwnerId(request, reply, authVerifier);
    if (!ownerId) return;
    const params = request.params as { goalId: string; transactionId: string };
    try {
      return financialMutationResponseSchema.parse(
        await financialService.delete(ownerId, params.goalId, params.transactionId),
      );
    } catch (error) {
      if (error instanceof FinancialServiceError) return failure(reply, request.id, error);
      throw error;
    }
  });

  server.post('/api/v1/goals/:goalId/items/:itemId/purchase', async (request, reply) => {
    const ownerId = await requireOwnerId(request, reply, authVerifier);
    if (!ownerId) return;
    const parsed = purchaseItemRequestSchema.safeParse(request.body);
    if (!parsed.success) return validation(reply, request.id, parsed.error.flatten().fieldErrors);
    const params = request.params as { goalId: string; itemId: string };
    try {
      return reply
        .code(201)
        .send(
          financialMutationResponseSchema.parse(
            await financialService.purchase(ownerId, params.goalId, params.itemId, parsed.data),
          ),
        );
    } catch (error) {
      if (error instanceof FinancialServiceError) return failure(reply, request.id, error);
      throw error;
    }
  });

  server.post('/api/v1/goals/:goalId/transactions/:purchaseId/undo', async (request, reply) => {
    const ownerId = await requireOwnerId(request, reply, authVerifier);
    if (!ownerId) return;
    const parsed = undoPurchaseRequestSchema.safeParse(request.body);
    if (!parsed.success) return validation(reply, request.id, parsed.error.flatten().fieldErrors);
    const params = request.params as { goalId: string; purchaseId: string };
    try {
      return reply
        .code(201)
        .send(
          financialMutationResponseSchema.parse(
            await financialService.undo(ownerId, params.goalId, params.purchaseId, parsed.data),
          ),
        );
    } catch (error) {
      if (error instanceof FinancialServiceError) return failure(reply, request.id, error);
      throw error;
    }
  });
}
