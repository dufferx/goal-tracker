import { z } from 'zod';

export const currencyCodeSchema = z
  .string()
  .regex(/^[A-Z]{3}$/, 'Use a three-letter uppercase currency code.');

export const deploymentCapabilitiesSchema = z
  .object({
    registrationEnabled: z.boolean(),
    passwordRecoveryEmailEnabled: z.boolean(),
  })
  .strict();

export type DeploymentCapabilities = z.infer<typeof deploymentCapabilitiesSchema>;

export const profileSchema = z
  .object({
    id: z.uuid(),
    displayName: z.string().trim().min(1).max(100).nullable(),
    defaultCurrency: currencyCodeSchema,
    createdAt: z.iso.datetime({ offset: true }),
    updatedAt: z.iso.datetime({ offset: true }),
  })
  .strict();

export type Profile = z.infer<typeof profileSchema>;

export const updateProfileRequestSchema = z
  .object({
    displayName: z.string().trim().min(1).max(100).nullable(),
    defaultCurrency: currencyCodeSchema,
  })
  .strict();

export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>;

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
