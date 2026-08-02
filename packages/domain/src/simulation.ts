import {
  addBusinessMonths,
  compareBusinessMonths,
  parseBusinessMonth,
  type BusinessMonth,
} from './business-month.js';
import { assertNonNegativeMinor } from './money.js';

/**
 * Temporary simulation (PRM §7). An in-memory, contribution-only report: it
 * never creates, updates, or purchases anything, and never reduces
 * hypothetical available money for affordable items. Pure and deterministic;
 * the caller passes the current business month explicitly.
 */

export type SimulationErrorCode =
  | 'NO_PHASES'
  | 'TOO_MANY_PHASES'
  | 'INVALID_DURATION'
  | 'INVALID_AMOUNT'
  | 'CONTINUATION_NOT_LAST'
  | 'CONTINUATION_WITHOUT_CONTRIBUTION'
  | 'CONTINUATION_WITHOUT_TARGET';

export class SimulationError extends Error {
  constructor(
    readonly code: SimulationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'SimulationError';
  }
}

/** Hard cap on simulated rows so a continuation cannot run unbounded. */
export const SIMULATION_MAX_MONTHS = 600;

export interface SimulationPhaseInput {
  /** Number of calendar months; a positive integer. */
  months: number;
  /** Hypothetical amount per contribution; the goal frequency applies it. */
  amountPerContributionMinor: bigint;
  /** Last phase only: keep going until the next item deadline or the target. */
  continueUntilTarget?: boolean;
}

export interface SimulationItemInput {
  id: string;
  name: string;
  /** Expected price of an unpurchased item. */
  priceMinor: bigint;
  dueMonth: BusinessMonth | null;
}

export interface SimulationInput {
  fundedMinor: bigint;
  availableMinor: bigint;
  targetMinor: bigint | null;
  contributionsPerMonth: 1 | 2;
  currentMonth: BusinessMonth;
  /** Unpurchased items for the affordability timeline. */
  items: readonly SimulationItemInput[];
  phases: readonly SimulationPhaseInput[];
}

export interface SimulationMonthRow {
  month: BusinessMonth;
  fundedMinor: bigint;
  availableMinor: bigint;
}

export interface SimulationItemAffordability {
  itemId: string;
  /** First simulated month the item becomes affordable; null when never. */
  affordableMonth: BusinessMonth | null;
}

export interface SimulationReport {
  /** One row per simulated month, starting at the current month. */
  months: SimulationMonthRow[];
  /** First month funded reaches the target; null when not calculable. */
  targetReachedMonth: BusinessMonth | null;
  /** Funded money at the target-reached month. */
  fundedAtTargetMinor: bigint | null;
  itemAffordability: SimulationItemAffordability[];
}

function validatePhases(phases: readonly SimulationPhaseInput[]): void {
  if (phases.length === 0) {
    throw new SimulationError('NO_PHASES', 'Define at least one phase.');
  }
  if (phases.length > 3) {
    throw new SimulationError('TOO_MANY_PHASES', 'A simulation allows up to three phases.');
  }
  phases.forEach((phase, index) => {
    if (
      !Number.isInteger(phase.months) ||
      phase.months < 1 ||
      phase.months > SIMULATION_MAX_MONTHS
    ) {
      throw new SimulationError(
        'INVALID_DURATION',
        'Each phase needs a whole number of months of 1 or more.',
      );
    }
    try {
      assertNonNegativeMinor(phase.amountPerContributionMinor, 'amountPerContribution');
    } catch {
      throw new SimulationError(
        'INVALID_AMOUNT',
        'Each phase needs a contribution amount of zero or more.',
      );
    }
    if (phase.continueUntilTarget && index !== phases.length - 1) {
      throw new SimulationError(
        'CONTINUATION_NOT_LAST',
        'Only the final phase may continue until a deadline or the target.',
      );
    }
    if (phase.continueUntilTarget && phase.amountPerContributionMinor === 0n) {
      throw new SimulationError(
        'CONTINUATION_WITHOUT_CONTRIBUTION',
        'Automatic continuation needs a contribution amount greater than zero.',
      );
    }
  });
}

export function simulatePhases(input: SimulationInput): SimulationReport {
  const currentMonth = parseBusinessMonth(input.currentMonth);
  validatePhases(input.phases);
  const frequency = BigInt(input.contributionsPerMonth);

  const lastPhase = input.phases[input.phases.length - 1]!;
  let continuationDeadline: BusinessMonth | null = null;
  if (lastPhase.continueUntilTarget && input.targetMinor == null) {
    // Without a target, continuation runs until the next item deadline.
    continuationDeadline =
      input.items
        .filter((item) => item.dueMonth != null)
        .map((item) => parseBusinessMonth(item.dueMonth!))
        .filter((month) => compareBusinessMonths(month, currentMonth) >= 0)
        .sort(compareBusinessMonths)[0] ?? null;
    if (continuationDeadline == null) {
      throw new SimulationError(
        'CONTINUATION_WITHOUT_TARGET',
        'Continuing the final phase needs a target or a future item deadline.',
      );
    }
  }

  let funded = input.fundedMinor;
  let available = input.availableMinor;
  let cursor = currentMonth;
  const rows: SimulationMonthRow[] = [];

  function simulateMonth(monthlyAddMinor: bigint) {
    funded += monthlyAddMinor;
    available += monthlyAddMinor;
    rows.push({ month: cursor, fundedMinor: funded, availableMinor: available });
    cursor = addBusinessMonths(cursor, 1);
  }

  for (const phase of input.phases) {
    const monthlyAddMinor = phase.amountPerContributionMinor * frequency;
    for (let index = 0; index < phase.months; index += 1) {
      simulateMonth(monthlyAddMinor);
    }
  }

  if (lastPhase.continueUntilTarget) {
    const monthlyAddMinor = lastPhase.amountPerContributionMinor * frequency;
    let guard = rows.length;
    for (;;) {
      if (input.targetMinor != null) {
        if (funded >= input.targetMinor) break;
      } else if (
        continuationDeadline == null ||
        compareBusinessMonths(cursor, continuationDeadline) > 0
      ) {
        break;
      }
      if (guard >= SIMULATION_MAX_MONTHS) break;
      simulateMonth(monthlyAddMinor);
      guard += 1;
    }
  }

  // Target completion when calculable; an already-reached target completes in
  // the current month.
  let targetReachedMonth: BusinessMonth | null = null;
  let fundedAtTargetMinor: bigint | null = null;
  if (input.targetMinor != null) {
    if (input.fundedMinor >= input.targetMinor) {
      targetReachedMonth = currentMonth;
      fundedAtTargetMinor = input.fundedMinor;
    } else {
      const reached = rows.find((row) => row.fundedMinor >= input.targetMinor!);
      if (reached) {
        targetReachedMonth = reached.month;
        fundedAtTargetMinor = reached.fundedMinor;
      }
    }
  }

  // Affordability is informational only: simulated purchases are never
  // applied and available money is never reduced for them (PRM §7).
  const itemAffordability = input.items.map((item) => {
    if (input.availableMinor >= item.priceMinor) {
      return { itemId: item.id, affordableMonth: currentMonth };
    }
    const row = rows.find((entry) => entry.availableMinor >= item.priceMinor);
    return { itemId: item.id, affordableMonth: row ? row.month : null };
  });

  return {
    months: rows,
    targetReachedMonth,
    fundedAtTargetMinor,
    itemAffordability,
  };
}
