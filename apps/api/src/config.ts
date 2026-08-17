import type { DeploymentCapabilities } from '@goal-tracker/contracts';

export interface ApiConfig {
  allowedWebOrigin: string;
  databaseSsl: boolean;
  databaseUrl: string;
  deploymentCapabilities: DeploymentCapabilities;
  supabasePublishableKey: string;
  supabaseUrl: string;
}

function requireEnvironmentValue(
  environment: NodeJS.ProcessEnv,
  name: keyof NodeJS.ProcessEnv,
): string {
  const value = environment[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function requireUrl(environment: NodeJS.ProcessEnv, name: keyof NodeJS.ProcessEnv): string {
  const value = requireEnvironmentValue(environment, name);

  try {
    new URL(value);
  } catch {
    throw new Error(`${name} must be a valid URL.`);
  }

  // Origins are compared literally against the Origin header, which never carries a trailing
  // slash; keep the configured value free of trailing slashes.
  return value.replace(/\/+$/, '');
}

function readBoolean(environment: NodeJS.ProcessEnv, name: keyof NodeJS.ProcessEnv): boolean {
  const value = requireEnvironmentValue(environment, name);

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  throw new Error(`${name} must be either "true" or "false".`);
}

export function readApiConfig(environment: NodeJS.ProcessEnv): ApiConfig {
  return {
    allowedWebOrigin: requireUrl(environment, 'WEB_ORIGIN'),
    databaseSsl: readBoolean(environment, 'DATABASE_SSL'),
    databaseUrl: requireEnvironmentValue(environment, 'DATABASE_URL'),
    deploymentCapabilities: {
      registrationEnabled: readBoolean(environment, 'PUBLIC_REGISTRATION_ENABLED'),
      passwordRecoveryEmailEnabled: readBoolean(
        environment,
        'PUBLIC_PASSWORD_RECOVERY_EMAIL_ENABLED',
      ),
      version: requireEnvironmentValue(environment, 'APP_VERSION'),
    },
    supabasePublishableKey: requireEnvironmentValue(environment, 'SUPABASE_PUBLISHABLE_KEY'),
    supabaseUrl: requireUrl(environment, 'SUPABASE_URL'),
  };
}
