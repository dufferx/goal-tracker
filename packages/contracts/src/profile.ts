import { z } from 'zod';

import { currencyCodeSchema } from './currency.js';

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
