import { z } from 'zod';

import { businessMonthSchema } from './business-month.js';
import { currencyCodeSchema } from './currency.js';
import { moneyDecimalStringSchema, positiveMoneyDecimalStringSchema } from './money.js';

export const targetModeSchema = z.enum(['fixed', 'items']);
export const goalStatusSchema = z.enum(['active', 'archived']);
export const contributionsPerMonthSchema = z.union([z.literal(1), z.literal(2)]);
export const fixedOverageDecisionSchema = z.enum(['keep_target', 'increase_target']);
export const allocationStateSchema = z.enum(['allocated', 'unallocated', 'overallocated']);

export const goalItemInputSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    expectedPrice: positiveMoneyDecimalStringSchema,
    dueMonth: businessMonthSchema.nullable().optional(),
  })
  .strict();

export const createGoalRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().min(1).max(2000).nullable().optional(),
    currency: currencyCodeSchema,
    targetMode: targetModeSchema,
    fixedTarget: positiveMoneyDecimalStringSchema.nullable().optional(),
    startMonth: businessMonthSchema,
    finalMonth: businessMonthSchema.nullable().optional(),
    contributionsPerMonth: contributionsPerMonthSchema,
    preferredContribution: positiveMoneyDecimalStringSchema.nullable().optional(),
    items: z.array(goalItemInputSchema).max(100).optional(),
    overageDecision: fixedOverageDecisionSchema.optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.targetMode === 'fixed' && (value.fixedTarget == null || value.fixedTarget === '')) {
      ctx.addIssue({
        code: 'custom',
        path: ['fixedTarget'],
        message: 'fixedTarget is required when targetMode is fixed.',
      });
    }
    if (value.targetMode === 'items' && value.fixedTarget != null) {
      ctx.addIssue({
        code: 'custom',
        path: ['fixedTarget'],
        message: 'fixedTarget must be omitted when targetMode is items.',
      });
    }
  });

export type CreateGoalRequest = z.infer<typeof createGoalRequestSchema>;

export const updateGoalRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().min(1).max(2000).nullable().optional(),
    currency: currencyCodeSchema.optional(),
    targetMode: targetModeSchema.optional(),
    fixedTarget: positiveMoneyDecimalStringSchema.nullable().optional(),
    startMonth: businessMonthSchema.optional(),
    finalMonth: businessMonthSchema.nullable().optional(),
    contributionsPerMonth: contributionsPerMonthSchema.optional(),
    preferredContribution: positiveMoneyDecimalStringSchema.nullable().optional(),
    overageDecision: fixedOverageDecisionSchema.optional(),
    confirmTargetModeChange: z.boolean().optional(),
  })
  .strict();

export type UpdateGoalRequest = z.infer<typeof updateGoalRequestSchema>;

export const planningPreviewRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().min(1).max(2000).nullable().optional(),
    currency: currencyCodeSchema.optional(),
    targetMode: targetModeSchema.optional(),
    fixedTarget: positiveMoneyDecimalStringSchema.nullable().optional(),
    startMonth: businessMonthSchema.optional(),
    finalMonth: businessMonthSchema.nullable().optional(),
    contributionsPerMonth: contributionsPerMonthSchema.optional(),
    preferredContribution: positiveMoneyDecimalStringSchema.nullable().optional(),
    overageDecision: fixedOverageDecisionSchema.optional(),
  })
  .strict();

export type PlanningPreviewRequest = z.infer<typeof planningPreviewRequestSchema>;

export const deleteGoalRequestSchema = z
  .object({
    confirmationName: z.string().min(1).max(120),
  })
  .strict();

export type DeleteGoalRequest = z.infer<typeof deleteGoalRequestSchema>;

export const createGoalItemRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    expectedPrice: positiveMoneyDecimalStringSchema,
    dueMonth: businessMonthSchema.nullable().optional(),
    overageDecision: fixedOverageDecisionSchema.optional(),
  })
  .strict();

export type CreateGoalItemRequest = z.infer<typeof createGoalItemRequestSchema>;

export const updateGoalItemRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    expectedPrice: positiveMoneyDecimalStringSchema.optional(),
    dueMonth: businessMonthSchema.nullable().optional(),
    overageDecision: fixedOverageDecisionSchema.optional(),
  })
  .strict();

export type UpdateGoalItemRequest = z.infer<typeof updateGoalItemRequestSchema>;

export const reorderGoalItemsRequestSchema = z
  .object({
    orderedItemIds: z.array(z.uuid()).min(1),
  })
  .strict();

export type ReorderGoalItemsRequest = z.infer<typeof reorderGoalItemsRequestSchema>;

export const goalItemSchema = z
  .object({
    id: z.uuid(),
    goalId: z.uuid(),
    name: z.string().min(1).max(120),
    expectedPrice: moneyDecimalStringSchema,
    dueMonth: businessMonthSchema.nullable(),
    position: z.number().int().min(0),
    createdAt: z.iso.datetime({ offset: true }),
    updatedAt: z.iso.datetime({ offset: true }),
  })
  .strict();

export type GoalItem = z.infer<typeof goalItemSchema>;

export const goalDerivedSchema = z
  .object({
    currentTarget: moneyDecimalStringSchema.nullable(),
    setupIncomplete: z.boolean(),
    itemsTotal: moneyDecimalStringSchema,
    allocated: moneyDecimalStringSchema.nullable(),
    unallocated: moneyDecimalStringSchema.nullable(),
    overallocated: moneyDecimalStringSchema.nullable(),
    allocationState: allocationStateSchema.nullable(),
    itemCount: z.number().int().min(0),
  })
  .strict();

export type GoalDerived = z.infer<typeof goalDerivedSchema>;

export const goalSchema = z
  .object({
    id: z.uuid(),
    name: z.string().min(1).max(120),
    description: z.string().min(1).max(2000).nullable(),
    currency: currencyCodeSchema,
    targetMode: targetModeSchema,
    fixedTarget: moneyDecimalStringSchema.nullable(),
    startMonth: businessMonthSchema,
    finalMonth: businessMonthSchema.nullable(),
    contributionsPerMonth: contributionsPerMonthSchema,
    preferredContribution: moneyDecimalStringSchema.nullable(),
    status: goalStatusSchema,
    createdAt: z.iso.datetime({ offset: true }),
    updatedAt: z.iso.datetime({ offset: true }),
    derived: goalDerivedSchema,
  })
  .strict();

export type Goal = z.infer<typeof goalSchema>;

export const goalDetailSchema = goalSchema
  .extend({
    items: z.array(goalItemSchema),
  })
  .strict();

export type GoalDetail = z.infer<typeof goalDetailSchema>;

export const goalListSchema = z
  .object({
    active: z.array(goalSchema),
    archived: z.array(goalSchema),
  })
  .strict();

export type GoalList = z.infer<typeof goalListSchema>;

export const planningImpactSchema = z
  .object({
    kind: z.enum([
      'target_changed',
      'target_mode_changed',
      'deadline_changed',
      'setup_completeness_changed',
      'allocation_changed',
      'frequency_changed',
      'preferred_contribution_changed',
    ]),
    label: z.string().min(1),
    before: z.string().nullable(),
    after: z.string().nullable(),
  })
  .strict();

export const planningPreviewResponseSchema = z
  .object({
    impacts: z.array(planningImpactSchema),
    resultingFixedTarget: moneyDecimalStringSchema.nullable(),
    requiresOverageDecision: z.boolean(),
    requiresTargetModeConfirmation: z.boolean(),
  })
  .strict();

export type PlanningPreviewResponse = z.infer<typeof planningPreviewResponseSchema>;

export const convertPercentRequestSchema = z
  .object({
    percent: z.number().gt(0).lte(100),
    fixedTarget: positiveMoneyDecimalStringSchema,
  })
  .strict();

export type ConvertPercentRequest = z.infer<typeof convertPercentRequestSchema>;

export const convertPercentResponseSchema = z
  .object({
    expectedPrice: moneyDecimalStringSchema,
  })
  .strict();

export type ConvertPercentResponse = z.infer<typeof convertPercentResponseSchema>;
