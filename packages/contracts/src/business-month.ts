import { z } from 'zod';

/** API business month as YYYY-MM. Internally persisted as YYYY-MM-01. */
export const businessMonthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use YYYY-MM for business months.');

export const businessMonthDateSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])-01$/, 'Business month dates must be YYYY-MM-01.');
