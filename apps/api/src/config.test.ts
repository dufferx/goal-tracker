import { describe, expect, it } from 'vitest';

import { readApiConfig } from './config.js';

const validEnvironment = {
  DATABASE_URL: 'postgresql://example',
  PUBLIC_PASSWORD_RECOVERY_EMAIL_ENABLED: 'false',
  PUBLIC_REGISTRATION_ENABLED: 'true',
  SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
  SUPABASE_URL: 'https://auth.example.test',
  WEB_ORIGIN: 'https://app.example.test',
};

describe('readApiConfig', () => {
  it('separates public capabilities from server connection settings', () => {
    expect(readApiConfig(validEnvironment)).toEqual({
      allowedWebOrigin: 'https://app.example.test',
      databaseUrl: 'postgresql://example',
      deploymentCapabilities: {
        passwordRecoveryEmailEnabled: false,
        registrationEnabled: true,
      },
      supabasePublishableKey: 'publishable-key',
      supabaseUrl: 'https://auth.example.test',
    });
  });

  it('rejects ambiguous boolean values', () => {
    expect(() =>
      readApiConfig({
        ...validEnvironment,
        PUBLIC_REGISTRATION_ENABLED: 'yes',
      }),
    ).toThrow('PUBLIC_REGISTRATION_ENABLED must be either "true" or "false".');
  });

  it('rejects a missing required server setting', () => {
    expect(() =>
      readApiConfig({
        ...validEnvironment,
        DATABASE_URL: ' ',
      }),
    ).toThrow('Missing required environment variable: DATABASE_URL');
  });
});
