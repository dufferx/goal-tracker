import { z } from 'zod';

/** Decimal money string at JSON boundaries. Never use number for monetary amounts. */
export const moneyDecimalStringSchema = z
  .string()
  .regex(/^-?\d+(\.\d{1,2})?$/, 'Use a decimal amount with up to two fractional digits.');

export const positiveMoneyDecimalStringSchema = z
  .string()
  .regex(/^(?!0+(?:\.0+)?$)\d+(\.\d{1,2})?$/, 'Amount must be a positive decimal value.');
