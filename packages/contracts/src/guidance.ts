import { z } from 'zod';

import { businessMonthSchema } from './business-month.js';
import { moneyDecimalStringSchema, nonNegativeMoneyDecimalStringSchema } from './money.js';
import { contributionsPerMonthSchema } from './planning.js';

export const paceStatusSchema = z.enum(['ahead', 'on_track', 'at_risk', 'behind']);
export type PaceStatus = z.infer<typeof paceStatusSchema>;

export const projectionExplanationCodeSchema = z.enum([
  'fully_funded',
  'setup_incomplete',
  'behind_deadline',
  'pace_delta',
  'open_goal_forecast',
  'no_pace',
]);
export type ProjectionExplanationCode = z.infer<typeof projectionExplanationCodeSchema>;

export const projectionExplanationSchema = z
  .object({
    code: projectionExplanationCodeSchema,
    delta: moneyDecimalStringSchema.optional(),
    required: moneyDecimalStringSchema.optional(),
    dueMonth: businessMonthSchema.optional(),
    forecastMonth: businessMonthSchema.optional(),
  })
  .strict();
export type ProjectionExplanation = z.infer<typeof projectionExplanationSchema>;

export const guidanceObligationSchema = z
  .object({
    kind: z.enum(['dated_items', 'final_target']),
    dueMonth: businessMonthSchema,
    itemNames: z.array(z.string()),
    required: moneyDecimalStringSchema,
    remainingOpportunities: z.number().int().min(0),
  })
  .strict();
export type GuidanceObligation = z.infer<typeof guidanceObligationSchema>;

export const guidanceRecommendationSchema = z
  .object({
    perContribution: moneyDecimalStringSchema,
    monthly: moneyDecimalStringSchema,
    contributionsPerMonth: contributionsPerMonthSchema,
  })
  .strict();
export type GuidanceRecommendation = z.infer<typeof guidanceRecommendationSchema>;

/** Guidance projection attached to goal-detail responses (PRM §6). */
export const guidanceSchema = z
  .object({
    asOfMonth: businessMonthSchema,
    target: moneyDecimalStringSchema.nullable(),
    remaining: moneyDecimalStringSchema.nullable(),
    fullyFunded: z.boolean(),
    setupIncomplete: z.boolean(),
    status: paceStatusSchema.nullable(),
    obligation: guidanceObligationSchema.nullable(),
    recommendation: guidanceRecommendationSchema.nullable(),
    progress: moneyDecimalStringSchema.nullable(),
    expectedProgress: moneyDecimalStringSchema.nullable(),
    paceDelta: moneyDecimalStringSchema.nullable(),
    forecastMonth: businessMonthSchema.nullable(),
    explanation: projectionExplanationSchema,
  })
  .strict();
export type Guidance = z.infer<typeof guidanceSchema>;

export const simulationPhaseInputSchema = z
  .object({
    months: z.number().int().min(1).max(600),
    amountPerContribution: nonNegativeMoneyDecimalStringSchema,
    continueUntilTarget: z.boolean().optional(),
  })
  .strict();
export type SimulationPhaseInput = z.infer<typeof simulationPhaseInputSchema>;

export const simulateRequestSchema = z
  .object({
    phases: z.array(simulationPhaseInputSchema).min(1).max(3),
  })
  .strict();
export type SimulateRequest = z.infer<typeof simulateRequestSchema>;

export const simulationMonthRowSchema = z
  .object({
    month: businessMonthSchema,
    funded: moneyDecimalStringSchema,
    available: moneyDecimalStringSchema,
  })
  .strict();
export type SimulationMonthRow = z.infer<typeof simulationMonthRowSchema>;

export const simulationItemAffordabilitySchema = z
  .object({
    itemId: z.uuid(),
    affordableMonth: businessMonthSchema.nullable(),
  })
  .strict();
export type SimulationItemAffordability = z.infer<typeof simulationItemAffordabilitySchema>;

/** Temporary, contribution-only simulation report (PRM §7). Never persisted. */
export const simulationReportSchema = z
  .object({
    months: z.array(simulationMonthRowSchema),
    targetReachedMonth: businessMonthSchema.nullable(),
    fundedAtTarget: moneyDecimalStringSchema.nullable(),
    itemAffordability: z.array(simulationItemAffordabilitySchema),
  })
  .strict();
export type SimulationReport = z.infer<typeof simulationReportSchema>;
