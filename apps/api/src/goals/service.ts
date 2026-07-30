import type {
  CreateGoalItemRequest,
  CreateGoalRequest,
  DeleteGoalRequest,
  PlanningPreviewRequest,
  PlanningPreviewResponse,
  ReorderGoalItemsRequest,
  UpdateGoalItemRequest,
  UpdateGoalRequest,
} from '@goal-tracker/contracts';
import type { GoalItemRecord, GoalRecord, GoalRepository } from '@goal-tracker/database';
import {
  BusinessMonthError,
  MoneyError,
  TargetError,
  assertDueMonthAllowed,
  parseBusinessMonth,
  parseMoneyString,
  percentageOfFixedTarget,
  previewPlanningChange,
  resolveFixedOverage,
  serializeMoney,
  validateGoalPlanning,
} from '@goal-tracker/domain';

export class GoalServiceError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly statusCode: number,
    readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'GoalServiceError';
  }
}

function mapDomainError(error: unknown): never {
  if (error instanceof GoalServiceError) {
    throw error;
  }
  if (
    error instanceof TargetError ||
    error instanceof BusinessMonthError ||
    error instanceof MoneyError
  ) {
    throw new GoalServiceError('VALIDATION_ERROR', error.message, 400);
  }
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    Reflect.get(error, 'code') === 'ITEM_REORDER_MISMATCH'
  ) {
    throw new GoalServiceError(
      'ITEM_REORDER_MISMATCH',
      error instanceof Error ? error.message : 'Item reorder list is invalid.',
      400,
    );
  }
  throw error;
}

function parseOptionalMoney(value: string | null | undefined, field: string): bigint | null {
  if (value == null) {
    return null;
  }
  return parseMoneyString(value, field);
}

function toCanonicalMonth(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }
  return parseBusinessMonth(value);
}

export function createGoalService(goalRepository: GoalRepository) {
  async function requireGoal(ownerId: string, goalId: string): Promise<GoalRecord> {
    const goal = await goalRepository.findByOwnerAndId(ownerId, goalId);
    if (!goal) {
      throw new GoalServiceError('GOAL_NOT_FOUND', 'Goal not found.', 404);
    }
    return goal;
  }

  async function requireActiveGoal(ownerId: string, goalId: string): Promise<GoalRecord> {
    const goal = await requireGoal(ownerId, goalId);
    if (goal.status === 'archived') {
      throw new GoalServiceError(
        'GOAL_ARCHIVED',
        'Archived goals reject mutations except restore and permanent delete.',
        409,
      );
    }
    return goal;
  }

  return {
    async list(ownerId: string) {
      const goals = await goalRepository.listByOwner(ownerId);
      const withItems = await Promise.all(
        goals.map(async (goal) => ({
          goal,
          items: await goalRepository.listItemsByOwnerAndGoal(ownerId, goal.id),
        })),
      );
      return {
        active: withItems.filter((entry) => entry.goal.status === 'active'),
        archived: withItems.filter((entry) => entry.goal.status === 'archived'),
      };
    },

    async get(ownerId: string, goalId: string) {
      const goal = await requireGoal(ownerId, goalId);
      const items = await goalRepository.listItemsByOwnerAndGoal(ownerId, goalId);
      return { goal, items };
    },

    async create(ownerId: string, request: CreateGoalRequest) {
      try {
        const items = (request.items ?? []).map((item) => ({
          name: item.name,
          expectedPriceMinor: parseMoneyString(item.expectedPrice, 'expectedPrice'),
          dueMonth: item.dueMonth == null ? null : parseBusinessMonth(item.dueMonth, 'dueMonth'),
        }));

        const validated = validateGoalPlanning({
          targetMode: request.targetMode,
          fixedTargetMinor:
            request.targetMode === 'fixed'
              ? parseMoneyString(request.fixedTarget!, 'fixedTarget')
              : null,
          startMonth: request.startMonth,
          finalMonth: request.finalMonth,
          contributionsPerMonth: request.contributionsPerMonth,
          preferredContributionMinor: parseOptionalMoney(
            request.preferredContribution,
            'preferredContribution',
          ),
          items,
        });

        let fixedTargetMinor = validated.fixedTargetMinor;
        if (request.targetMode === 'fixed' && fixedTargetMinor != null) {
          const resolution = resolveFixedOverage({
            fixedTargetMinor,
            itemsTotalMinor: validated.target.itemsTotalMinor,
            decision: request.overageDecision,
          });
          fixedTargetMinor = resolution.resultingFixedTargetMinor;
        }

        return await goalRepository.create({
          ownerId,
          name: request.name,
          description: request.description ?? null,
          currency: request.currency,
          targetMode: request.targetMode,
          fixedTargetMinor,
          startMonth: validated.startMonth,
          finalMonth: validated.finalMonth,
          contributionsPerMonth: validated.contributionsPerMonth,
          preferredContributionMinor: validated.preferredContributionMinor,
          items,
        });
      } catch (error) {
        mapDomainError(error);
      }
    },

    async update(ownerId: string, goalId: string, request: UpdateGoalRequest) {
      try {
        const goal = await requireActiveGoal(ownerId, goalId);
        const items = await goalRepository.listItemsByOwnerAndGoal(ownerId, goalId);

        const nextMode = request.targetMode ?? goal.targetMode;
        const nextFixed =
          request.fixedTarget !== undefined
            ? parseOptionalMoney(request.fixedTarget, 'fixedTarget')
            : goal.fixedTargetMinor;

        if (request.targetMode && request.targetMode !== goal.targetMode) {
          if (request.confirmTargetModeChange !== true) {
            throw new GoalServiceError(
              'TARGET_MODE_CONFIRMATION_REQUIRED',
              'Confirm the target mode change before saving.',
              409,
            );
          }
        }

        const validated = validateGoalPlanning({
          targetMode: nextMode,
          fixedTargetMinor: nextMode === 'fixed' ? nextFixed : null,
          startMonth: request.startMonth ?? toCanonicalMonth(goal.startMonth)!,
          finalMonth:
            request.finalMonth !== undefined
              ? request.finalMonth
              : goal.finalMonth == null
                ? null
                : toCanonicalMonth(goal.finalMonth),
          contributionsPerMonth: request.contributionsPerMonth ?? goal.contributionsPerMonth,
          preferredContributionMinor:
            request.preferredContribution !== undefined
              ? parseOptionalMoney(request.preferredContribution, 'preferredContribution')
              : goal.preferredContributionMinor,
          items,
        });

        let fixedTargetMinor = validated.fixedTargetMinor;
        if (nextMode === 'fixed' && fixedTargetMinor != null) {
          const resolution = resolveFixedOverage({
            fixedTargetMinor,
            itemsTotalMinor: validated.target.itemsTotalMinor,
            decision: request.overageDecision,
          });
          fixedTargetMinor = resolution.resultingFixedTargetMinor;
        }

        if (nextMode === 'items') {
          fixedTargetMinor = null;
        }

        const updated = await goalRepository.update(ownerId, goalId, {
          name: request.name,
          description: request.description,
          currency: request.currency,
          targetMode: nextMode,
          fixedTargetMinor,
          startMonth: validated.startMonth,
          finalMonth: validated.finalMonth,
          contributionsPerMonth: validated.contributionsPerMonth,
          preferredContributionMinor: validated.preferredContributionMinor,
        });

        if (!updated) {
          throw new GoalServiceError('GOAL_NOT_FOUND', 'Goal not found.', 404);
        }

        return {
          goal: updated,
          items: await goalRepository.listItemsByOwnerAndGoal(ownerId, goalId),
        };
      } catch (error) {
        mapDomainError(error);
      }
    },

    async preview(
      ownerId: string,
      goalId: string,
      request: PlanningPreviewRequest,
    ): Promise<{ preview: PlanningPreviewResponse; goal: GoalRecord; items: GoalItemRecord[] }> {
      try {
        const goal = await requireGoal(ownerId, goalId);
        const items = await goalRepository.listItemsByOwnerAndGoal(ownerId, goalId);

        const afterMode = request.targetMode ?? goal.targetMode;
        const afterFixed =
          request.fixedTarget !== undefined
            ? parseOptionalMoney(request.fixedTarget, 'fixedTarget')
            : goal.fixedTargetMinor;

        const result = previewPlanningChange({
          before: {
            name: goal.name,
            description: goal.description,
            currency: goal.currency,
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
              dueMonth: item.dueMonth,
              position: item.position,
            })),
          },
          after: {
            name: request.name ?? goal.name,
            description: request.description !== undefined ? request.description : goal.description,
            currency: request.currency ?? goal.currency,
            targetMode: afterMode,
            fixedTargetMinor: afterMode === 'fixed' ? afterFixed : null,
            startMonth: request.startMonth ?? toCanonicalMonth(goal.startMonth)!,
            finalMonth:
              request.finalMonth !== undefined
                ? request.finalMonth
                : goal.finalMonth == null
                  ? null
                  : toCanonicalMonth(goal.finalMonth),
            contributionsPerMonth: (request.contributionsPerMonth ?? goal.contributionsPerMonth) as
              1 | 2,
            preferredContributionMinor:
              request.preferredContribution !== undefined
                ? parseOptionalMoney(request.preferredContribution, 'preferredContribution')
                : goal.preferredContributionMinor,
          },
          overageDecision: request.overageDecision,
        });

        let requiresOverageDecision = false;
        if (afterMode === 'fixed' && afterFixed != null) {
          const itemsTotal = items.reduce((sum, item) => sum + item.expectedPriceMinor, 0n);
          if (itemsTotal > afterFixed && request.overageDecision == null) {
            requiresOverageDecision = true;
          }
        }

        return {
          goal,
          items,
          preview: {
            impacts: result.impacts,
            resultingFixedTarget:
              result.resultingFixedTargetMinor == null
                ? null
                : serializeMoney(result.resultingFixedTargetMinor),
            requiresOverageDecision,
            requiresTargetModeConfirmation:
              request.targetMode != null && request.targetMode !== goal.targetMode,
          },
        };
      } catch (error) {
        mapDomainError(error);
      }
    },

    async archive(ownerId: string, goalId: string) {
      const goal = await requireActiveGoal(ownerId, goalId);
      const updated = await goalRepository.update(ownerId, goal.id, { status: 'archived' });
      if (!updated) {
        throw new GoalServiceError('GOAL_NOT_FOUND', 'Goal not found.', 404);
      }
      return {
        goal: updated,
        items: await goalRepository.listItemsByOwnerAndGoal(ownerId, goalId),
      };
    },

    async restore(ownerId: string, goalId: string) {
      const goal = await requireGoal(ownerId, goalId);
      if (goal.status !== 'archived') {
        throw new GoalServiceError(
          'GOAL_NOT_ARCHIVED',
          'Only archived goals can be restored.',
          409,
        );
      }
      const updated = await goalRepository.update(ownerId, goal.id, { status: 'active' });
      if (!updated) {
        throw new GoalServiceError('GOAL_NOT_FOUND', 'Goal not found.', 404);
      }
      return {
        goal: updated,
        items: await goalRepository.listItemsByOwnerAndGoal(ownerId, goalId),
      };
    },

    async permanentlyDelete(ownerId: string, goalId: string, request: DeleteGoalRequest) {
      const goal = await requireGoal(ownerId, goalId);
      if (request.confirmationName.trim() !== goal.name) {
        throw new GoalServiceError(
          'DELETE_CONFIRMATION_MISMATCH',
          'Type the exact goal name to permanently delete it.',
          400,
          { confirmationName: ['Must match the goal name exactly.'] },
        );
      }
      const deleted = await goalRepository.permanentlyDelete(ownerId, goalId);
      if (!deleted) {
        throw new GoalServiceError('GOAL_NOT_FOUND', 'Goal not found.', 404);
      }
    },

    async createItem(ownerId: string, goalId: string, request: CreateGoalItemRequest) {
      try {
        const goal = await requireActiveGoal(ownerId, goalId);
        const items = await goalRepository.listItemsByOwnerAndGoal(ownerId, goalId);
        const expectedPriceMinor = parseMoneyString(request.expectedPrice, 'expectedPrice');
        const dueMonth = assertDueMonthAllowed(request.dueMonth, goal.startMonth, goal.finalMonth);

        if (goal.targetMode === 'fixed' && goal.fixedTargetMinor != null) {
          const itemsTotal =
            items.reduce((sum, item) => sum + item.expectedPriceMinor, 0n) + expectedPriceMinor;
          const resolution = resolveFixedOverage({
            fixedTargetMinor: goal.fixedTargetMinor,
            itemsTotalMinor: itemsTotal,
            decision: request.overageDecision,
          });
          if (resolution.resultingFixedTargetMinor !== goal.fixedTargetMinor) {
            await goalRepository.update(ownerId, goalId, {
              fixedTargetMinor: resolution.resultingFixedTargetMinor,
            });
          }
        }

        const created = await goalRepository.createItem(ownerId, goalId, {
          name: request.name,
          expectedPriceMinor,
          dueMonth,
        });
        if (!created) {
          throw new GoalServiceError('GOAL_NOT_FOUND', 'Goal not found.', 404);
        }

        const updatedGoal = await requireGoal(ownerId, goalId);
        const updatedItems = await goalRepository.listItemsByOwnerAndGoal(ownerId, goalId);
        return { goal: updatedGoal, items: updatedItems, item: created };
      } catch (error) {
        mapDomainError(error);
      }
    },

    async updateItem(
      ownerId: string,
      goalId: string,
      itemId: string,
      request: UpdateGoalItemRequest,
    ) {
      try {
        const goal = await requireActiveGoal(ownerId, goalId);
        const items = await goalRepository.listItemsByOwnerAndGoal(ownerId, goalId);
        const current = items.find((item) => item.id === itemId);
        if (!current) {
          throw new GoalServiceError('ITEM_NOT_FOUND', 'Goal item not found.', 404);
        }

        const expectedPriceMinor =
          request.expectedPrice !== undefined
            ? parseMoneyString(request.expectedPrice, 'expectedPrice')
            : current.expectedPriceMinor;
        const dueMonth =
          request.dueMonth !== undefined
            ? assertDueMonthAllowed(request.dueMonth, goal.startMonth, goal.finalMonth)
            : current.dueMonth;

        if (goal.targetMode === 'fixed' && goal.fixedTargetMinor != null) {
          const itemsTotal = items.reduce(
            (sum, item) =>
              sum + (item.id === itemId ? expectedPriceMinor : item.expectedPriceMinor),
            0n,
          );
          const resolution = resolveFixedOverage({
            fixedTargetMinor: goal.fixedTargetMinor,
            itemsTotalMinor: itemsTotal,
            decision: request.overageDecision,
          });
          if (resolution.resultingFixedTargetMinor !== goal.fixedTargetMinor) {
            await goalRepository.update(ownerId, goalId, {
              fixedTargetMinor: resolution.resultingFixedTargetMinor,
            });
          }
        }

        const updatedItem = await goalRepository.updateItem(ownerId, goalId, itemId, {
          name: request.name,
          expectedPriceMinor,
          dueMonth,
        });
        if (!updatedItem) {
          throw new GoalServiceError('ITEM_NOT_FOUND', 'Goal item not found.', 404);
        }

        return {
          goal: await requireGoal(ownerId, goalId),
          items: await goalRepository.listItemsByOwnerAndGoal(ownerId, goalId),
          item: updatedItem,
        };
      } catch (error) {
        mapDomainError(error);
      }
    },

    async deleteItem(ownerId: string, goalId: string, itemId: string) {
      await requireActiveGoal(ownerId, goalId);
      const deleted = await goalRepository.deleteItem(ownerId, goalId, itemId);
      if (!deleted) {
        throw new GoalServiceError('ITEM_NOT_FOUND', 'Goal item not found.', 404);
      }
      return {
        goal: await requireGoal(ownerId, goalId),
        items: await goalRepository.listItemsByOwnerAndGoal(ownerId, goalId),
      };
    },

    async reorderItems(ownerId: string, goalId: string, request: ReorderGoalItemsRequest) {
      try {
        await requireActiveGoal(ownerId, goalId);
        const items = await goalRepository.reorderItems(ownerId, goalId, request.orderedItemIds);
        if (items === undefined) {
          throw new GoalServiceError('GOAL_NOT_FOUND', 'Goal not found.', 404);
        }
        return {
          goal: await requireGoal(ownerId, goalId),
          items,
        };
      } catch (error) {
        mapDomainError(error);
      }
    },

    convertPercent(fixedTarget: string, percent: number) {
      try {
        const amount = percentageOfFixedTarget(
          parseMoneyString(fixedTarget, 'fixedTarget'),
          percent,
        );
        return { expectedPrice: serializeMoney(amount) };
      } catch (error) {
        mapDomainError(error);
      }
    },
  };
}

export type GoalService = ReturnType<typeof createGoalService>;
