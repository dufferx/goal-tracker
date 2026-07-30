import type { DeploymentCapabilities } from '@goal-tracker/contracts';

export interface ApiConfig {
  allowedWebOrigin: string;
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
    allowedWebOrigin: requireEnvironmentValue(environment, 'WEB_ORIGIN'),
    databaseUrl: requireEnvironmentValue(environment, 'DATABASE_URL'),
    deploymentCapabilities: {
      registrationEnabled: readBoolean(environment, 'PUBLIC_REGISTRATION_ENABLED'),
      passwordRecoveryEmailEnabled: readBoolean(
        environment,
        'PUBLIC_PASSWORD_RECOVERY_EMAIL_ENABLED',
      ),
    },
    supabasePublishableKey: requireEnvironmentValue(environment, 'SUPABASE_PUBLISHABLE_KEY'),
    supabaseUrl: requireEnvironmentValue(environment, 'SUPABASE_URL'),
  };
}
