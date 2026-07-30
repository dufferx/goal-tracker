import { z } from 'zod';

export const currencyCodeSchema = z
  .string()
  .regex(/^[A-Z]{3}$/, 'Use a three-letter uppercase currency code.');
