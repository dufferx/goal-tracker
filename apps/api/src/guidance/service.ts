import type { SimulateRequest, SimulationReport } from '@goal-tracker/contracts';
import type { FinancialRepository } from '@goal-tracker/database';
import {
  SimulationError,
  calculateTarget,
  parseMoneyString,
  replayLedger,
  simulatePhases,
  type BusinessMonth,
} from '@goal-tracker/domain';

import { businessMonthFromDate, toSimulationReportDto } from './serialize.js';

export class GuidanceServiceError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly statusCode: number,
    readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'GuidanceServiceError';
  }
}

/**
 * Read-only guidance operations. Simulations run entirely in memory over a
 * snapshot: they never touch the mutation path (PRM §7).
 */
export function createGuidanceService(
  repository: FinancialRepository,
  options: { now?: () => Date } = {},
) {
  const now = options.now ?? (() => new Date());
  const currentMonth = (): BusinessMonth => businessMonthFromDate(now());

  return {
    async simulate(
      ownerId: string,
      goalId: string,
      request: SimulateRequest,
    ): Promise<SimulationReport> {
      const snapshot = await repository.findSnapshot(ownerId, goalId);
      if (!snapshot) {
        throw new GuidanceServiceError('GOAL_NOT_FOUND', 'Goal not found.', 404);
      }
      const replay = replayLedger(snapshot.transactions.map((row) => ({ ...row })));
      const target = calculateTarget({
        targetMode: snapshot.goal.targetMode,
        fixedTargetMinor: snapshot.goal.fixedTargetMinor,
        items: snapshot.items.map((item) => ({
          expectedPriceMinor: item.expectedPriceMinor,
          actualPriceMinor: replay.activePurchases.get(item.id)?.amountMinor ?? null,
        })),
      });
      try {
        const report = simulatePhases({
          fundedMinor: replay.totals.fundedMinor,
          availableMinor: replay.totals.availableMinor,
          targetMinor: target.currentTargetMinor,
          contributionsPerMonth: snapshot.goal.contributionsPerMonth as 1 | 2,
          currentMonth: currentMonth(),
          items: snapshot.items
            .filter((item) => !replay.activePurchases.has(item.id))
            .map((item) => ({
              id: item.id,
              name: item.name,
              priceMinor: item.expectedPriceMinor,
              dueMonth: item.dueMonth,
            })),
          phases: request.phases.map((phase) => ({
            months: phase.months,
            amountPerContributionMinor: parseMoneyString(
              phase.amountPerContribution,
              'amountPerContribution',
            ),
            ...(phase.continueUntilTarget !== undefined
              ? { continueUntilTarget: phase.continueUntilTarget }
              : {}),
          })),
        });
        return toSimulationReportDto(report);
      } catch (error) {
        if (error instanceof SimulationError) {
          throw new GuidanceServiceError(error.code, error.message, 400);
        }
        throw error;
      }
    },
  };
}

export type GuidanceService = ReturnType<typeof createGuidanceService>;
