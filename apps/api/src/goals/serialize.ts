import {
  goalDetailSchema,
  goalItemSchema,
  goalSchema,
  type Goal,
  type GoalDetail,
  type GoalItem,
} from '@goal-tracker/contracts';
import { calculateTarget, serializeMoney, toDisplayMonth } from '@goal-tracker/domain';
import type { GoalItemRecord, GoalRecord } from '@goal-tracker/database';

export function toGoalDto(goal: GoalRecord, items: GoalItemRecord[]): Goal {
  const derived = calculateTarget({
    targetMode: goal.targetMode,
    fixedTargetMinor: goal.fixedTargetMinor,
    items: items.map((item) => ({ expectedPriceMinor: item.expectedPriceMinor })),
  });

  return goalSchema.parse({
    id: goal.id,
    name: goal.name,
    description: goal.description,
    currency: goal.currency,
    targetMode: goal.targetMode,
    fixedTarget: goal.fixedTargetMinor == null ? null : serializeMoney(goal.fixedTargetMinor),
    startMonth: toDisplayMonth(goal.startMonth),
    finalMonth: goal.finalMonth == null ? null : toDisplayMonth(goal.finalMonth),
    contributionsPerMonth: goal.contributionsPerMonth as 1 | 2,
    preferredContribution:
      goal.preferredContributionMinor == null
        ? null
        : serializeMoney(goal.preferredContributionMinor),
    status: goal.status,
    createdAt: goal.createdAt.toISOString(),
    updatedAt: goal.updatedAt.toISOString(),
    derived: {
      currentTarget:
        derived.currentTargetMinor == null ? null : serializeMoney(derived.currentTargetMinor),
      setupIncomplete: derived.setupIncomplete,
      itemsTotal: serializeMoney(derived.itemsTotalMinor),
      allocated: derived.allocatedMinor == null ? null : serializeMoney(derived.allocatedMinor),
      unallocated:
        derived.unallocatedMinor == null ? null : serializeMoney(derived.unallocatedMinor),
      overallocated:
        derived.overallocatedMinor == null ? null : serializeMoney(derived.overallocatedMinor),
      allocationState: derived.allocationState,
      itemCount: items.length,
    },
  });
}

export function toGoalItemDto(item: GoalItemRecord): GoalItem {
  return goalItemSchema.parse({
    id: item.id,
    goalId: item.goalId,
    name: item.name,
    expectedPrice: serializeMoney(item.expectedPriceMinor),
    dueMonth: item.dueMonth == null ? null : toDisplayMonth(item.dueMonth),
    position: item.position,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  });
}

export function toGoalDetailDto(goal: GoalRecord, items: GoalItemRecord[]): GoalDetail {
  return goalDetailSchema.parse({
    ...toGoalDto(goal, items),
    items: items.map(toGoalItemDto),
  });
}
