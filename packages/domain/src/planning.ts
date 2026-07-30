import {
  assertDueMonthAllowed,
  assertMonthRange,
  compareBusinessMonths,
  parseBusinessMonth,
  type BusinessMonth,
} from './business-month.js';
import { serializeMoney } from './money.js';
import {
  assertContributionsPerMonth,
  assertPreferredContribution,
  calculateTarget,
  previewTargetModeChange,
  resolveFixedOverage,
  type FixedOverageDecision,
  type TargetMode,
} from './targets.js';

export interface PlanningItem {
  id?: string;
  name: string;
  expectedPriceMinor: bigint;
  dueMonth: string | null;
  position: number;
}

export interface GoalPlanningState {
  name: string;
  description: string | null;
  currency: string;
  targetMode: TargetMode;
  fixedTargetMinor: bigint | null;
  startMonth: string;
  finalMonth: string | null;
  contributionsPerMonth: 1 | 2;
  preferredContributionMinor: bigint | null;
  items: readonly PlanningItem[];
}

export interface DueMonthGroup {
  dueMonth: BusinessMonth;
  itemIds: string[];
  cumulativeRequiredMinor: bigint;
}

export interface PlanningImpact {
  kind:
    | 'target_changed'
    | 'target_mode_changed'
    | 'deadline_changed'
    | 'setup_completeness_changed'
    | 'allocation_changed'
    | 'frequency_changed'
    | 'preferred_contribution_changed';
  label: string;
  before: string | null;
  after: string | null;
}

export interface PlanningValidationResult {
  startMonth: BusinessMonth;
  finalMonth: BusinessMonth | null;
  contributionsPerMonth: 1 | 2;
  preferredContributionMinor: bigint | null;
  fixedTargetMinor: bigint | null;
  target: ReturnType<typeof calculateTarget>;
}

export function validateGoalPlanning(input: {
  targetMode: TargetMode;
  fixedTargetMinor: bigint | null;
  startMonth: string;
  finalMonth: string | null | undefined;
  contributionsPerMonth: number;
  preferredContributionMinor: bigint | null | undefined;
  items: readonly { expectedPriceMinor: bigint; dueMonth?: string | null }[];
}): PlanningValidationResult {
  const months = assertMonthRange(input.startMonth, input.finalMonth);
  const contributionsPerMonth = assertContributionsPerMonth(input.contributionsPerMonth);
  const preferredContributionMinor = assertPreferredContribution(input.preferredContributionMinor);

  for (const item of input.items) {
    assertDueMonthAllowed(item.dueMonth, months.startMonth, months.finalMonth);
  }

  let fixedTargetMinor = input.fixedTargetMinor;
  if (input.targetMode === 'fixed') {
    if (fixedTargetMinor == null) {
      throw new Error('fixedTargetMinor is required when targetMode is fixed.');
    }
  } else {
    fixedTargetMinor = null;
  }

  const target = calculateTarget({
    targetMode: input.targetMode,
    fixedTargetMinor,
    items: input.items,
  });

  return {
    startMonth: months.startMonth,
    finalMonth: months.finalMonth,
    contributionsPerMonth,
    preferredContributionMinor,
    fixedTargetMinor,
    target,
  };
}

/** Group due items by month and compute cumulative required amounts in month order. */
export function groupDueMonths(
  items: readonly { id: string; expectedPriceMinor: bigint; dueMonth: string | null }[],
): DueMonthGroup[] {
  const dated = items
    .filter((item): item is typeof item & { dueMonth: string } => item.dueMonth != null)
    .map((item) => ({
      ...item,
      dueMonth: parseBusinessMonth(item.dueMonth),
    }))
    .sort((a, b) => compareBusinessMonths(a.dueMonth, b.dueMonth) || a.id.localeCompare(b.id));

  const groups = new Map<BusinessMonth, DueMonthGroup>();
  let cumulative = 0n;

  for (const item of dated) {
    const existing = groups.get(item.dueMonth);
    if (existing) {
      existing.itemIds.push(item.id);
      existing.cumulativeRequiredMinor += item.expectedPriceMinor;
      cumulative = existing.cumulativeRequiredMinor;
      continue;
    }

    cumulative += item.expectedPriceMinor;
    groups.set(item.dueMonth, {
      dueMonth: item.dueMonth,
      itemIds: [item.id],
      cumulativeRequiredMinor: cumulative,
    });
  }

  return [...groups.values()];
}

export function previewPlanningChange(input: {
  before: GoalPlanningState;
  after: Omit<GoalPlanningState, 'items'> & { items?: readonly PlanningItem[] };
  overageDecision?: FixedOverageDecision | null;
}): { impacts: PlanningImpact[]; resultingFixedTargetMinor: bigint | null } {
  const afterItems = input.after.items ?? input.before.items;
  const validatedAfter = validateGoalPlanning({
    targetMode: input.after.targetMode,
    fixedTargetMinor: input.after.fixedTargetMinor,
    startMonth: input.after.startMonth,
    finalMonth: input.after.finalMonth,
    contributionsPerMonth: input.after.contributionsPerMonth,
    preferredContributionMinor: input.after.preferredContributionMinor,
    items: afterItems,
  });

  let resultingFixedTargetMinor = validatedAfter.fixedTargetMinor;
  if (input.after.targetMode === 'fixed' && resultingFixedTargetMinor != null) {
    const resolution = resolveFixedOverage({
      fixedTargetMinor: resultingFixedTargetMinor,
      itemsTotalMinor: validatedAfter.target.itemsTotalMinor,
      decision: input.overageDecision,
    });
    resultingFixedTargetMinor = resolution.resultingFixedTargetMinor;
  }

  const beforeTarget = calculateTarget({
    targetMode: input.before.targetMode,
    fixedTargetMinor: input.before.fixedTargetMinor,
    items: input.before.items,
  });

  const afterTarget = calculateTarget({
    targetMode: input.after.targetMode,
    fixedTargetMinor: input.after.targetMode === 'fixed' ? resultingFixedTargetMinor : null,
    items: afterItems,
  });

  const impacts: PlanningImpact[] = [];

  if (input.before.targetMode !== input.after.targetMode) {
    const modePreview = previewTargetModeChange({
      currentMode: input.before.targetMode,
      nextMode: input.after.targetMode,
      fixedTargetMinor:
        input.after.targetMode === 'fixed'
          ? resultingFixedTargetMinor
          : input.before.fixedTargetMinor,
      items: afterItems,
    });
    impacts.push({
      kind: 'target_mode_changed',
      label: 'Target mode',
      before: input.before.targetMode === 'fixed' ? 'An amount' : 'A list of things',
      after: input.after.targetMode === 'fixed' ? 'An amount' : 'A list of things',
    });
    impacts.push({
      kind: 'target_changed',
      label: 'Target',
      before: formatNullableMoney(modePreview.beforeTargetMinor),
      after: formatNullableMoney(modePreview.afterTargetMinor),
    });
  } else if (beforeTarget.currentTargetMinor !== afterTarget.currentTargetMinor) {
    impacts.push({
      kind: 'target_changed',
      label: 'Target',
      before: formatNullableMoney(beforeTarget.currentTargetMinor),
      after: formatNullableMoney(afterTarget.currentTargetMinor),
    });
  }

  if (beforeTarget.setupIncomplete !== afterTarget.setupIncomplete) {
    impacts.push({
      kind: 'setup_completeness_changed',
      label: 'Setup',
      before: beforeTarget.setupIncomplete ? 'Incomplete' : 'Ready',
      after: afterTarget.setupIncomplete ? 'Incomplete' : 'Ready',
    });
  }

  const beforeStart = parseBusinessMonth(input.before.startMonth);
  const afterStart = validatedAfter.startMonth;
  const beforeFinal = input.before.finalMonth ? parseBusinessMonth(input.before.finalMonth) : null;
  const afterFinal = validatedAfter.finalMonth;

  if (beforeStart !== afterStart || beforeFinal !== afterFinal) {
    impacts.push({
      kind: 'deadline_changed',
      label: 'Planning window',
      before: formatWindow(beforeStart, beforeFinal),
      after: formatWindow(afterStart, afterFinal),
    });
  }

  if (
    input.before.targetMode === 'fixed' &&
    input.after.targetMode === 'fixed' &&
    beforeTarget.allocationState !== afterTarget.allocationState
  ) {
    impacts.push({
      kind: 'allocation_changed',
      label: 'Item allocation',
      before: beforeTarget.allocationState,
      after: afterTarget.allocationState,
    });
  }

  if (input.before.contributionsPerMonth !== validatedAfter.contributionsPerMonth) {
    impacts.push({
      kind: 'frequency_changed',
      label: 'Contributions per month',
      before: String(input.before.contributionsPerMonth),
      after: String(validatedAfter.contributionsPerMonth),
    });
  }

  if (
    (input.before.preferredContributionMinor ?? null) !== validatedAfter.preferredContributionMinor
  ) {
    impacts.push({
      kind: 'preferred_contribution_changed',
      label: 'Preferred contribution',
      before: formatNullableMoney(input.before.preferredContributionMinor),
      after: formatNullableMoney(validatedAfter.preferredContributionMinor),
    });
  }

  return { impacts, resultingFixedTargetMinor };
}

function formatNullableMoney(amount: bigint | null): string | null {
  return amount == null ? null : serializeMoney(amount);
}

function formatWindow(start: BusinessMonth, final: BusinessMonth | null): string {
  const startLabel = start.slice(0, 7);
  return final ? `${startLabel} → ${final.slice(0, 7)}` : `${startLabel} → open`;
}

export function sortItemsByPosition<T extends { position: number; id: string }>(
  items: readonly T[],
): T[] {
  return [...items].sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));
}

export function reorderPositions(orderedIds: readonly string[]): Map<string, number> {
  const unique = new Set(orderedIds);
  if (unique.size !== orderedIds.length) {
    throw new Error('Item reorder list contains duplicate ids.');
  }

  const positions = new Map<string, number>();
  orderedIds.forEach((id, index) => {
    positions.set(id, index);
  });
  return positions;
}
