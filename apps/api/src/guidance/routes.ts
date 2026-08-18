import { simulateRequestSchema, simulationReportSchema } from '@goal-tracker/contracts';
import type { FastifyInstance } from 'fastify';

import type { AuthVerifier } from '../auth.js';
import { requireOwnerId } from '../auth-guard.js';
import { apiError, zodFieldErrors } from '../errors.js';
import { GuidanceServiceError, type GuidanceService } from './service.js';

export function registerGuidanceRoutes(
  server: FastifyInstance,
  dependencies: {
    authVerifier: AuthVerifier;
    guidanceService: GuidanceService;
  },
) {
  const { authVerifier, guidanceService } = dependencies;

  // Temporary simulation report. Read-only by design: it writes no rows.
  server.post('/api/v1/goals/:goalId/simulations', async (request, reply) => {
    const ownerId = await requireOwnerId(request, reply, authVerifier);
    if (!ownerId) return;
    const { goalId } = request.params as { goalId: string };

    const parsed = simulateRequestSchema.safeParse(request.body);
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
      const report = await guidanceService.simulate(ownerId, goalId, parsed.data);
      return simulationReportSchema.parse(report);
    } catch (error) {
      if (error instanceof GuidanceServiceError) {
        return reply
          .code(error.statusCode)
          .send(apiError(request.id, error.code, error.message, error.fieldErrors));
      }
      request.log.error({ err: error }, 'Simulation failed');
      return reply
        .code(500)
        .send(apiError(request.id, 'INTERNAL_ERROR', 'The simulation could not be created.'));
    }
  });
}
