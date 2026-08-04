import { defineConfig, devices } from '@playwright/test';
import { execFileSync } from 'node:child_process';

function localSupabaseEnvironment(): Record<string, string> {
  const output = execFileSync('pnpm', ['supabase', 'status', '-o', 'env'], {
    encoding: 'utf8',
  });
  return Object.fromEntries(
    output
      .split('\n')
      .map((line) => /^([A-Z_]+)="(.*)"$/.exec(line))
      .filter((match): match is RegExpExecArray => Boolean(match))
      .map((match) => [match[1]!, match[2]!] as const),
  );
}

const supabase = localSupabaseEnvironment();
const supabaseUrl = supabase.API_URL;
const publishableKey = supabase.PUBLISHABLE_KEY ?? supabase.ANON_KEY;

if (!supabaseUrl || !publishableKey || !supabase.DB_URL) {
  throw new Error('Start local Supabase with `pnpm infra:start` before running end-to-end tests.');
}

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    colorScheme: 'dark',
    locale: 'en-US',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ?? '/snap/bin/chromium',
      args: ['--no-sandbox'],
    },
  },
  projects: [
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } },
    },
  ],
  webServer: {
    command: 'pnpm dev:e2e',
    url: 'http://127.0.0.1:4173',
    timeout: 120_000,
    reuseExistingServer: false,
    env: {
      ...process.env,
      API_HOST: '127.0.0.1',
      API_PORT: '3100',
      DATABASE_URL: supabase.DB_URL,
      PUBLIC_PASSWORD_RECOVERY_EMAIL_ENABLED: 'true',
      PUBLIC_REGISTRATION_ENABLED: 'true',
      SUPABASE_PUBLISHABLE_KEY: publishableKey,
      SUPABASE_URL: supabaseUrl,
      VITE_API_URL: 'http://127.0.0.1:3100',
      VITE_SUPABASE_PUBLISHABLE_KEY: publishableKey,
      VITE_SUPABASE_URL: supabaseUrl,
      WEB_ORIGIN: 'http://127.0.0.1:4173',
    },
  },
});
