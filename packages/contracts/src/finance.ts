import { z } from 'zod';
import { moneyDecimalStringSchema, positiveMoneyDecimalStringSchema } from './money.js';

export const financialKindSchema = z.enum([
  'contribution',
  'withdrawal',
  'purchase',
  'purchase_undo',
]);
export const effectiveDateSchema = z.iso.date();
export const createFinancialTransactionRequestSchema = z
  .object({
    kind: z.enum(['contribution', 'withdrawal']),
    amount: positiveMoneyDecimalStringSchema,
    effectiveDate: effectiveDateSchema,
  })
  .strict();
export type CreateFinancialTransactionRequest = z.infer<
  typeof createFinancialTransactionRequestSchema
>;
export const updateFinancialTransactionRequestSchema = z
  .object({
    amount: positiveMoneyDecimalStringSchema.optional(),
    effectiveDate: effectiveDateSchema.optional(),
    overageDecision: z.enum(['keep_target', 'increase_target']).optional(),
  })
  .strict()
  .refine((value) => value.amount !== undefined || value.effectiveDate !== undefined, {
    message: 'Provide an amount or effective date to update.',
  });
export type UpdateFinancialTransactionRequest = z.infer<
  typeof updateFinancialTransactionRequestSchema
>;
export const purchaseItemRequestSchema = z
  .object({
    amount: positiveMoneyDecimalStringSchema,
    effectiveDate: effectiveDateSchema,
    overageDecision: z.enum(['keep_target', 'increase_target']).optional(),
  })
  .strict();
export type PurchaseItemRequest = z.infer<typeof purchaseItemRequestSchema>;
export const undoPurchaseRequestSchema = z.object({ effectiveDate: effectiveDateSchema }).strict();
export type UndoPurchaseRequest = z.infer<typeof undoPurchaseRequestSchema>;
export const financialTotalsSchema = z
  .object({
    funded: moneyDecimalStringSchema,
    spent: moneyDecimalStringSchema,
    available: moneyDecimalStringSchema,
    remaining: moneyDecimalStringSchema.nullable(),
  })
  .strict();
export type FinancialTotals = z.infer<typeof financialTotalsSchema>;
export const financialTransactionSchema = z
  .object({
    id: z.uuid(),
    goalId: z.uuid(),
    kind: financialKindSchema,
    amount: moneyDecimalStringSchema,
    effectiveDate: effectiveDateSchema,
    itemId: z.uuid().nullable(),
    itemName: z.string().nullable(),
    reversesTransactionId: z.uuid().nullable(),
    edited: z.boolean(),
    createdAt: z.iso.datetime({ offset: true }),
    updatedAt: z.iso.datetime({ offset: true }),
    balanceAfter: z
      .object({
        funded: moneyDecimalStringSchema,
        spent: moneyDecimalStringSchema,
        available: moneyDecimalStringSchema,
      })
      .strict(),
  })
  .strict();
export type FinancialTransaction = z.infer<typeof financialTransactionSchema>;
export const financialHistorySchema = z
  .object({ totals: financialTotalsSchema, transactions: z.array(financialTransactionSchema) })
  .strict();
export type FinancialHistory = z.infer<typeof financialHistorySchema>;
export const financialMutationResponseSchema = z
  .object({ totals: financialTotalsSchema, transaction: financialTransactionSchema.nullable() })
  .strict();
export type FinancialMutationResponse = z.infer<typeof financialMutationResponseSchema>;
