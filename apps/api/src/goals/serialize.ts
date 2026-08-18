import {
  goalDetailSchema,
  goalItemSchema,
  goalSchema,
  type Goal,
  type GoalDetail,
  type GoalItem,
  type Guidance,
} from '@goal-tracker/contracts';
import {
  calculateTarget,
  replayLedger,
  serializeMoney,
  toDisplayMonth,
} from '@goal-tracker/domain';
import type {
  FinancialTransactionRecord,
  GoalItemRecord,
  GoalRecord,
} from '@goal-tracker/database';

function replay(transactions: FinancialTransactionRecord[]) {
  return replayLedger(transactions.map((row) => ({ ...row })));
}

export function toGoalDto(
  goal: GoalRecord,
  items: GoalItemRecord[],
  transactions: FinancialTransactionRecord[] = [],
): Goal {
  const ledger = replay(transactions);
  const derived = calculateTarget({
    targetMode: goal.targetMode,
    fixedTargetMinor: goal.fixedTargetMinor,
    items: items.map((item) => ({
      expectedPriceMinor: item.expectedPriceMinor,
      actualPriceMinor: ledger.activePurchases.get(item.id)?.amountMinor,
    })),
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
      financial: {
        funded: serializeMoney(ledger.totals.fundedMinor),
        spent: serializeMoney(ledger.totals.spentMinor),
        available: serializeMoney(ledger.totals.availableMinor),
        remaining:
          derived.currentTargetMinor == null
            ? null
            : serializeMoney(
                derived.currentTargetMinor > ledger.totals.fundedMinor
                  ? derived.currentTargetMinor - ledger.totals.fundedMinor
                  : 0n,
              ),
      },
      currencyLocked: transactions.length > 0,
    },
  });
}

export function toGoalItemDto(
  item: GoalItemRecord,
  transactions: FinancialTransactionRecord[] = [],
): GoalItem {
  const purchase = replay(transactions).activePurchases.get(item.id);
  return goalItemSchema.parse({
    id: item.id,
    goalId: item.goalId,
    name: item.name,
    expectedPrice: serializeMoney(item.expectedPriceMinor),
    dueMonth: item.dueMonth == null ? null : toDisplayMonth(item.dueMonth),
    position: item.position,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    purchase: purchase
      ? {
          transactionId: purchase.id,
          actualPrice: serializeMoney(purchase.amountMinor),
          effectiveDate: purchase.effectiveDate,
        }
      : null,
  });
}

export function toGoalDetailDto(
  goal: GoalRecord,
  items: GoalItemRecord[],
  transactions: FinancialTransactionRecord[],
  guidance: Guidance,
): GoalDetail {
  return goalDetailSchema.parse({
    ...toGoalDto(goal, items, transactions),
    items: items.map((item) => toGoalItemDto(item, transactions)),
    guidance,
  });
}
