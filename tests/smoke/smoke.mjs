#!/usr/bin/env node
/**
 * Deployed-environment smoke test.
 *
 * Verifies the managed reference stack after deployment:
 *   SMOKE_API_URL — base URL of the API container on Render or Railway.
 *   SMOKE_WEB_URL — base URL of the web SPA on Vercel.
 *
 * Usage: SMOKE_API_URL=https://api.example.com SMOKE_WEB_URL=https://app.example.com \
 *   pnpm test:smoke
 */

const apiUrl = process.env.SMOKE_API_URL?.replace(/\/$/, '');
const webUrl = process.env.SMOKE_WEB_URL?.replace(/\/$/, []);

if (!apiUrl || !webUrl) {
  console.error('SMOKE_API_URL and SMOKE_WEB_URL are both required.');
  process.exit(1);
}

let failures = 0;

function report(ok, label, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures += 1;
}

async function check(label, fn) {
  try {
    await fn();
    report(true, label);
  } catch (error) {
    report(false, label, error instanceof Error ? error.message : String(error));
  }
}

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`GET ${url} returned ${response.status}`);
  }
  return response.json();
}

await check('API health endpoint responds ok', async () => {
  const body = await getJson(`${apiUrl}/health`);
  if (body?.status !== 'ok') {
    throw new Error(`unexpected body: ${JSON.stringify(body)}`);
  }
});

await check('API capabilities expose public deployment shape', async () => {
  const body = await getJson(`${apiUrl}/api/v1/capabilities`);
  if (
    typeof body?.registrationEnabled !== 'boolean' ||
    typeof body?.passwordRecoveryEmailEnabled !== 'boolean' ||
    typeof body?.version !== 'string' ||
    body.version.length === 0
  ) {
    throw new Error(`unexpected body: ${JSON.stringify(body)}`);
  }
});

await check('API rejects unknown routes with the shared error envelope', async () => {
  const response = await fetch(`${apiUrl}/api/v1/does-not-exist`);
  if (response.status !== 404) {
    throw new Error(`expected 404, got ${response.status}`);
  }
  const body = await response.json();
  if (typeof body?.error?.requestId !== 'string' || body?.error?.code !== 'NOT_FOUND') {
    throw new Error(`unexpected body: ${JSON.stringify(body)}`);
  }
});

await check('Web SPA serves its HTML shell', async () => {
  const response = await fetch(webUrl);
  if (!response.ok) {
    throw new Error(`GET ${webUrl} returned ${response.status}`);
  }
  const html = await response.text();
  if (!html.includes('<div id="root">')) {
    throw new Error('the response is not the Vite SPA shell');
  }
});

await check('Web SPA serves client-side routes (SPA fallback)', async () => {
  const response = await fetch(`${webUrl}/settings`);
  if (!response.ok) {
    throw new Error(`GET ${webUrl}/settings returned ${response.status}`);
  }
  const html = await response.text();
  if (!html.includes('<div id="root">')) {
    throw new Error('client-side route did not return the SPA shell');
  }
});

if (failures > 0) {
  console.error(`\n${failures} smoke check(s) failed.`);
  process.exit(1);
}

console.log('\nAll smoke checks passed.');
