import { z } from 'zod';

/** Shared planning primitives (leaf module to avoid schema import cycles). */
export const contributionsPerMonthSchema = z.union([z.literal(1), z.literal(2)]);
export type ContributionsPerMonth = z.infer<typeof contributionsPerMonthSchema>;
