import { describe, expect, it } from 'vitest';

import { readApiConfig } from './config.js';

const validEnvironment = {
  APP_VERSION: '1.0.0',
  DATABASE_SSL: 'false',
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
      databaseSsl: false,
      databaseUrl: 'postgresql://example',
      deploymentCapabilities: {
        passwordRecoveryEmailEnabled: false,
        registrationEnabled: true,
        version: '1.0.0',
      },
      supabasePublishableKey: 'publishable-key',
      supabaseUrl: 'https://auth.example.test',
    });
  });

  it('strips trailing slashes so origins match the Origin header literally', () => {
    expect(
      readApiConfig({ ...validEnvironment, WEB_ORIGIN: 'https://app.example.test/' })
        .allowedWebOrigin,
    ).toBe('https://app.example.test');
  });

  it('rejects ambiguous boolean values', () => {
    expect(() =>
      readApiConfig({
        ...validEnvironment,
        PUBLIC_REGISTRATION_ENABLED: 'yes',
      }),
    ).toThrow('PUBLIC_REGISTRATION_ENABLED must be either "true" or "false".');

    expect(() =>
      readApiConfig({
        ...validEnvironment,
        DATABASE_SSL: 'yes',
      }),
    ).toThrow('DATABASE_SSL must be either "true" or "false".');
  });

  it('rejects a missing required server setting', () => {
    expect(() =>
      readApiConfig({
        ...validEnvironment,
        DATABASE_URL: ' ',
      }),
    ).toThrow('Missing required environment variable: DATABASE_URL');

    expect(() =>
      readApiConfig({
        ...validEnvironment,
        APP_VERSION: ' ',
      }),
    ).toThrow('Missing required environment variable: APP_VERSION');
  });

  it('rejects malformed URLs', () => {
    expect(() =>
      readApiConfig({
        ...validEnvironment,
        WEB_ORIGIN: 'not-a-url',
      }),
    ).toThrow('WEB_ORIGIN must be a valid URL.');

    expect(() =>
      readApiConfig({
        ...validEnvironment,
        SUPABASE_URL: 'not-a-url',
      }),
    ).toThrow('SUPABASE_URL must be a valid URL.');
  });
});
