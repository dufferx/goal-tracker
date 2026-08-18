import {
  guidanceSchema,
  simulationReportSchema,
  type Guidance,
  type SimulationReport,
} from '@goal-tracker/contracts';
import type {
  FinancialTransactionRecord,
  GoalItemRecord,
  GoalRecord,
} from '@goal-tracker/database';
import {
  projectGuidance,
  replayLedger,
  serializeMoney,
  toDisplayMonth,
  type BusinessMonth,
  type Projection,
  type SimulationReport as DomainSimulationReport,
} from '@goal-tracker/domain';

/** UTC business month for a technical timestamp (YYYY-MM-01). */
export function businessMonthFromDate(date: Date): BusinessMonth {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-01`;
}

export function toGuidanceDto(projection: Projection, currentMonth: BusinessMonth): Guidance {
  return guidanceSchema.parse({
    asOfMonth: toDisplayMonth(currentMonth),
    target: projection.targetMinor == null ? null : serializeMoney(projection.targetMinor),
    remaining: projection.remainingMinor == null ? null : serializeMoney(projection.remainingMinor),
    fullyFunded: projection.fullyFunded,
    setupIncomplete: projection.setupIncomplete,
    status: projection.status,
    obligation:
      projection.obligation == null
        ? null
        : {
            kind: projection.obligation.kind,
            dueMonth: toDisplayMonth(projection.obligation.dueMonth),
            itemNames: projection.obligation.itemNames,
            required: serializeMoney(projection.obligation.requiredMinor),
            remainingOpportunities: projection.obligation.remainingOpportunities,
          },
    recommendation:
      projection.recommendation == null
        ? null
        : {
            perContribution: serializeMoney(projection.recommendation.perContributionMinor),
            monthly: serializeMoney(projection.recommendation.monthlyMinor),
            contributionsPerMonth: projection.recommendation.contributionsPerMonth,
          },
    progress: projection.progressMinor == null ? null : serializeMoney(projection.progressMinor),
    expectedProgress:
      projection.expectedProgressMinor == null
        ? null
        : serializeMoney(projection.expectedProgressMinor),
    paceDelta: projection.paceDeltaMinor == null ? null : serializeMoney(projection.paceDeltaMinor),
    forecastMonth:
      projection.forecastMonth == null ? null : toDisplayMonth(projection.forecastMonth),
    explanation: {
      code: projection.explanation.code,
      ...(projection.explanation.deltaMinor !== undefined
        ? { delta: serializeMoney(projection.explanation.deltaMinor) }
        : {}),
      ...(projection.explanation.requiredMinor !== undefined
        ? { required: serializeMoney(projection.explanation.requiredMinor) }
        : {}),
      ...(projection.explanation.dueMonth !== undefined
        ? { dueMonth: toDisplayMonth(projection.explanation.dueMonth) }
        : {}),
      ...(projection.explanation.forecastMonth !== undefined
        ? { forecastMonth: toDisplayMonth(projection.explanation.forecastMonth) }
        : {}),
    },
  });
}

/** Compute guidance for a goal detail from its authoritative ledger data. */
export function buildGuidanceDto(
  goal: GoalRecord,
  items: GoalItemRecord[],
  transactions: FinancialTransactionRecord[],
  currentMonth: BusinessMonth,
): Guidance {
  const replay = replayLedger(transactions.map((row) => ({ ...row })));
  return toGuidanceDto(
    projectGuidance({
      targetMode: goal.targetMode,
      fixedTargetMinor: goal.fixedTargetMinor,
      startMonth: goal.startMonth,
      finalMonth: goal.finalMonth,
      contributionsPerMonth: goal.contributionsPerMonth as 1 | 2,
      preferredContributionMinor: goal.preferredContributionMinor,
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        expectedPriceMinor: item.expectedPriceMinor,
        actualPriceMinor: replay.activePurchases.get(item.id)?.amountMinor ?? null,
        dueMonth: item.dueMonth,
      })),
      fundedMinor: replay.totals.fundedMinor,
      currentMonth,
    }),
    currentMonth,
  );
}

export function toSimulationReportDto(report: DomainSimulationReport): SimulationReport {
  return simulationReportSchema.parse({
    months: report.months.map((row) => ({
      month: toDisplayMonth(row.month),
      funded: serializeMoney(row.fundedMinor),
      available: serializeMoney(row.availableMinor),
    })),
    targetReachedMonth:
      report.targetReachedMonth == null ? null : toDisplayMonth(report.targetReachedMonth),
    fundedAtTarget:
      report.fundedAtTargetMinor == null ? null : serializeMoney(report.fundedAtTargetMinor),
    itemAffordability: report.itemAffordability.map((entry) => ({
      itemId: entry.itemId,
      affordableMonth: entry.affordableMonth == null ? null : toDisplayMonth(entry.affordableMonth),
    })),
  });
}
