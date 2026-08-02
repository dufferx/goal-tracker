import {
  addBusinessMonths,
  compareBusinessMonths,
  diffBusinessMonths,
  parseBusinessMonth,
  type BusinessMonth,
} from './business-month.js';
import { calculateTarget, type TargetMode } from './targets.js';

/**
 * Guidance and projection (PRM §6). Pure and deterministic: callers pass the
 * current business month explicitly; nothing here reads a clock.
 *
 * One public entry point, `projectGuidance`, returns calculations, pace
 * status, explanation, and recommendation together. Explanation is
 * structured (code + ingredients) so the API/UI owns the final wording while
 * the business rule stays in exactly one module.
 */

export type PaceStatus = 'ahead' | 'on_track' | 'at_risk' | 'behind';

export type ProjectionExplanationCode =
  | 'fully_funded'
  | 'setup_incomplete'
  | 'behind_deadline'
  | 'pace_delta'
  | 'open_goal_forecast'
  | 'no_pace';

export interface ProjectionExplanation {
  code: ProjectionExplanationCode;
  /** Signed progress minus expected progress, for 'pace_delta'. */
  deltaMinor?: bigint;
  /** Remaining amount needed, for 'behind_deadline'. */
  requiredMinor?: bigint;
  /** Deadline month, for 'behind_deadline'. */
  dueMonth?: BusinessMonth;
  /** Forecast completion month, for 'open_goal_forecast'. */
  forecastMonth?: BusinessMonth;
}

export interface ProjectionItemInput {
  id: string;
  name: string;
  expectedPriceMinor: bigint;
  /** Actual price of the item's active purchase, when purchased. */
  actualPriceMinor?: bigint | null;
  dueMonth: BusinessMonth | null;
}

export interface ProjectionInput {
  targetMode: TargetMode;
  fixedTargetMinor: bigint | null;
  startMonth: BusinessMonth;
  finalMonth: BusinessMonth | null;
  contributionsPerMonth: 1 | 2;
  preferredContributionMinor: bigint | null;
  items: readonly ProjectionItemInput[];
  /** Funded money (contributions minus withdrawals); purchases do not reduce it. */
  fundedMinor: bigint;
  /** Explicit calculation month (no clock reads in the domain). */
  currentMonth: BusinessMonth;
}

export interface ProjectionObligation {
  kind: 'dated_items' | 'final_target';
  dueMonth: BusinessMonth;
  /** Names of the unpurchased items covered by this obligation. */
  itemNames: string[];
  /** Remaining money required to satisfy this obligation. */
  requiredMinor: bigint;
  /** Remaining contribution opportunities (inclusive months × frequency). */
  remainingOpportunities: number;
}

export interface ProjectionRecommendation {
  perContributionMinor: bigint;
  monthlyMinor: bigint;
  contributionsPerMonth: 1 | 2;
}

export interface Projection {
  targetMinor: bigint | null;
  /** Target minus funded, clamped at zero; null when there is no target. */
  remainingMinor: bigint | null;
  /** Completion condition, separate from pace status (PRM §6.4). */
  fullyFunded: boolean;
  /** Item-derived goal without items: no target, pace, or estimate (PRM §4.2). */
  setupIncomplete: boolean;
  /** Null when there is not enough planning information to measure pace. */
  status: PaceStatus | null;
  /** The next unfinished dated obligation being evaluated, when any. */
  obligation: ProjectionObligation | null;
  /** Deadline-based or preferred-amount baseline; null when not applicable. */
  recommendation: ProjectionRecommendation | null;
  /** Funded progress toward the evaluated obligation. */
  progressMinor: bigint | null;
  /** Expected progress from completed months and the current plan. */
  expectedProgressMinor: bigint | null;
  /** progressMinor minus expectedProgressMinor. */
  paceDeltaMinor: bigint | null;
  /** Open-goal preferred-amount forecast completion month, when calculable. */
  forecastMonth: BusinessMonth | null;
  explanation: ProjectionExplanation;
}

function ceilDivMinor(amount: bigint, divisor: bigint): bigint {
  if (amount <= 0n) return 0n;
  return (amount + divisor - 1n) / divisor;
}

function paceStatusFromDelta(delta: bigint, baselineMinor: bigint): PaceStatus {
  if (delta <= -baselineMinor) return 'at_risk';
  if (delta >= baselineMinor) return 'ahead';
  return 'on_track';
}

interface ObligationGroup {
  dueMonth: BusinessMonth;
  itemNames: string[];
  groupRequiredMinor: bigint;
  cumulativeRequiredMinor: bigint;
}

/** Cumulative dated obligations in month order, priced at actual ?? expected. */
function cumulativeObligations(items: readonly ProjectionItemInput[]): ObligationGroup[] {
  const dated = items
    .filter((item) => item.dueMonth != null)
    .map((item) => ({
      name: item.name,
      dueMonth: parseBusinessMonth(item.dueMonth!),
      purchased: item.actualPriceMinor != null,
      priceMinor: item.actualPriceMinor ?? item.expectedPriceMinor,
    }))
    .sort((a, b) => compareBusinessMonths(a.dueMonth, b.dueMonth) || a.name.localeCompare(b.name));

  const groups: ObligationGroup[] = [];
  let cumulative = 0n;
  for (const item of dated) {
    cumulative += item.priceMinor;
    const existing = groups[groups.length - 1];
    if (existing && existing.dueMonth === item.dueMonth) {
      if (!item.purchased) existing.itemNames.push(item.name);
      existing.groupRequiredMinor += item.priceMinor;
      existing.cumulativeRequiredMinor = cumulative;
    } else {
      groups.push({
        dueMonth: item.dueMonth,
        itemNames: item.purchased ? [] : [item.name],
        groupRequiredMinor: item.priceMinor,
        cumulativeRequiredMinor: cumulative,
      });
    }
  }
  return groups;
}

function paceProjection(params: {
  requiredMinor: bigint;
  progressMinor: bigint;
  satisfiedBeforeMinor: bigint;
  dueMonth: BusinessMonth;
  startMonth: BusinessMonth;
  currentMonth: BusinessMonth;
  contributionsPerMonth: 1 | 2;
  kind: ProjectionObligation['kind'];
  itemNames: string[];
}): Pick<
  Projection,
  | 'status'
  | 'obligation'
  | 'recommendation'
  | 'progressMinor'
  | 'expectedProgressMinor'
  | 'paceDeltaMinor'
  | 'explanation'
> {
  const {
    requiredMinor,
    progressMinor,
    dueMonth,
    startMonth,
    currentMonth,
    contributionsPerMonth,
    kind,
    itemNames,
  } = params;

  // Past unmet obligations are reported as behind rather than divided over
  // negative or zero opportunities (PRM §6.2).
  if (compareBusinessMonths(dueMonth, currentMonth) < 0) {
    return {
      status: 'behind',
      obligation: {
        kind,
        dueMonth,
        itemNames,
        requiredMinor,
        remainingOpportunities: 0,
      },
      recommendation: null,
      progressMinor,
      expectedProgressMinor: null,
      paceDeltaMinor: null,
      explanation: { code: 'behind_deadline', requiredMinor, dueMonth },
    };
  }

  const paceStart = compareBusinessMonths(currentMonth, startMonth) < 0 ? startMonth : currentMonth;
  const monthsInclusive = diffBusinessMonths(paceStart, dueMonth) + 1;
  const remainingOpportunities = monthsInclusive * contributionsPerMonth;
  const perContributionMinor = ceilDivMinor(requiredMinor, BigInt(remainingOpportunities));
  const monthlyMinor = perContributionMinor * BigInt(contributionsPerMonth);

  // Expected progress: completed calendar months from the planning start
  // month × the current recommended plan (PRM §6.4).
  const completedMonths = Math.max(0, diffBusinessMonths(startMonth, currentMonth));
  const expectedProgressMinor =
    BigInt(completedMonths * contributionsPerMonth) * perContributionMinor;
  const deltaMinor = progressMinor - expectedProgressMinor;
  const status = paceStatusFromDelta(deltaMinor, perContributionMinor);

  return {
    status,
    obligation: { kind, dueMonth, itemNames, requiredMinor, remainingOpportunities },
    recommendation: { perContributionMinor, monthlyMinor, contributionsPerMonth },
    progressMinor,
    expectedProgressMinor,
    paceDeltaMinor: deltaMinor,
    explanation: { code: 'pace_delta', deltaMinor },
  };
}

export function projectGuidance(input: ProjectionInput): Projection {
  const currentMonth = parseBusinessMonth(input.currentMonth);
  const startMonth = parseBusinessMonth(input.startMonth);
  const finalMonth = input.finalMonth == null ? null : parseBusinessMonth(input.finalMonth);
  const frequency = input.contributionsPerMonth;

  const target = calculateTarget({
    targetMode: input.targetMode,
    fixedTargetMinor: input.fixedTargetMinor,
    items: input.items.map((item) => ({
      expectedPriceMinor: item.expectedPriceMinor,
      actualPriceMinor: item.actualPriceMinor ?? null,
    })),
  });
  const targetMinor = target.currentTargetMinor;
  const remainingMinor =
    targetMinor == null
      ? null
      : targetMinor > input.fundedMinor
        ? targetMinor - input.fundedMinor
        : 0n;
  const fullyFunded = targetMinor != null && input.fundedMinor >= targetMinor;

  const base = {
    targetMinor,
    remainingMinor,
    fullyFunded,
    setupIncomplete: target.setupIncomplete,
    obligation: null,
    recommendation: null,
    progressMinor: null,
    expectedProgressMinor: null,
    paceDeltaMinor: null,
    forecastMonth: null,
  };

  // Item-derived goal without items: totals exist, but no target, remaining,
  // pace status, or completion state (PRM §4.2).
  if (target.setupIncomplete) {
    return {
      ...base,
      status: null,
      explanation: { code: 'setup_incomplete' },
    };
  }

  // Completion is a separate condition, not another pace status (PRM §6.4).
  if (fullyFunded) {
    return {
      ...base,
      status: null,
      explanation: { code: 'fully_funded' },
    };
  }

  // Dated plan (PRM §6.2): evaluate the next unfinished dated-item
  // requirement; a purchased item is satisfied by its actual purchase.
  const groups = cumulativeObligations(input.items);
  const nextGroup = groups.find((group) => group.cumulativeRequiredMinor > input.fundedMinor);
  if (nextGroup) {
    const satisfiedBeforeMinor = nextGroup.cumulativeRequiredMinor - nextGroup.groupRequiredMinor;
    return {
      ...base,
      ...paceProjection({
        requiredMinor: nextGroup.cumulativeRequiredMinor - input.fundedMinor,
        progressMinor: input.fundedMinor - satisfiedBeforeMinor,
        satisfiedBeforeMinor,
        dueMonth: nextGroup.dueMonth,
        startMonth,
        currentMonth,
        contributionsPerMonth: frequency,
        kind: 'dated_items',
        itemNames: nextGroup.itemNames,
      }),
    };
  }

  // No unfinished dated items: evaluate the final target (PRM §6.2).
  if (finalMonth && targetMinor != null && remainingMinor != null && remainingMinor > 0n) {
    const datedTotalMinor =
      groups.length === 0 ? 0n : groups[groups.length - 1]!.cumulativeRequiredMinor;
    return {
      ...base,
      ...paceProjection({
        requiredMinor: remainingMinor,
        progressMinor: input.fundedMinor - datedTotalMinor,
        satisfiedBeforeMinor: datedTotalMinor,
        dueMonth: finalMonth,
        startMonth,
        currentMonth,
        contributionsPerMonth: frequency,
        kind: 'final_target',
        itemNames: [],
      }),
    };
  }

  // Open goals (PRM §6.3): no future due month and no final month.
  if (input.preferredContributionMinor != null) {
    const perContributionMinor = input.preferredContributionMinor;
    const monthlyMinor = perContributionMinor * BigInt(frequency);
    const completedMonths = Math.max(0, diffBusinessMonths(startMonth, currentMonth));
    const expectedProgressMinor = BigInt(completedMonths * frequency) * perContributionMinor;
    const deltaMinor = input.fundedMinor - expectedProgressMinor;
    const forecastMonth =
      remainingMinor != null && remainingMinor > 0n
        ? addBusinessMonths(currentMonth, Number(ceilDivMinor(remainingMinor, monthlyMinor)) - 1)
        : null;
    return {
      ...base,
      status: paceStatusFromDelta(deltaMinor, perContributionMinor),
      recommendation: { perContributionMinor, monthlyMinor, contributionsPerMonth: frequency },
      progressMinor: input.fundedMinor,
      expectedProgressMinor,
      paceDeltaMinor: deltaMinor,
      forecastMonth,
      explanation: { code: 'open_goal_forecast', forecastMonth: forecastMonth ?? undefined },
    };
  }

  // No deadline and no preferred amount: totals and remaining only (PRM §6.3).
  return {
    ...base,
    status: null,
    explanation: { code: 'no_pace' },
  };
}
