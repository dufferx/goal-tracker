import { z } from 'zod';

export const apiFieldErrorsSchema = z.record(z.string(), z.array(z.string()));

export const apiErrorSchema = z
  .object({
    error: z
      .object({
        code: z.string().min(1),
        message: z.string().min(1),
        fieldErrors: apiFieldErrorsSchema.optional(),
        requestId: z.string().min(1),
      })
      .strict(),
  })
  .strict();

export type ApiError = z.infer<typeof apiErrorSchema>;
