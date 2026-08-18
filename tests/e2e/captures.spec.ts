import { expect, test } from '@playwright/test';
import path from 'node:path';

const captureEnabled = process.env.CAPTURE_M5B === '1';
const japanId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

const surfaces = [
  { name: 'auth-sign-in', path: '/?__design=public', heading: 'Welcome back' },
  { name: 'dashboard', path: '/goals?__design=active', heading: 'Goals' },
  { name: 'archives', path: '/goals?__design=archived', heading: 'Goals' },
  { name: 'goal-create', path: '/goals/new?__design=populated', heading: 'New goal' },
  { name: 'goal-detail', path: `/goals/${japanId}?__design=active`, heading: 'Japan Trip' },
  {
    name: 'items',
    path: `/goals/${japanId}/items?__design=active`,
    heading: 'Japan Trip · items',
  },
  {
    name: 'history',
    path: `/goals/${japanId}/history?__design=active`,
    heading: 'Japan Trip · history',
  },
  {
    name: 'simulator',
    path: `/goals/${japanId}/simulator?__design=m4-simulator`,
    heading: 'Japan Trip · simulator',
  },
  { name: 'settings', path: '/settings?__design=active', heading: 'Settings' },
  {
    name: 'contribution-overlay',
    path: `/goals/${japanId}?__design=m3-contribution`,
    heading: 'Japan Trip',
    overlay: 'Add contribution',
  },
  {
    name: 'purchase-overlay',
    path: `/goals/${japanId}?__design=m3-purchase`,
    heading: 'Japan Trip',
    overlay: 'Buy Flights',
  },
] as const;

test('captures the final M5B mobile and desktop surface set', async ({ page }, testInfo) => {
  test.skip(!captureEnabled, 'Run with CAPTURE_M5B=1 to refresh repository evidence.');

  const mobile = testInfo.project.name === 'mobile';
  await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });

  for (const surface of surfaces) {
    await page.goto(surface.path);
    if ('overlay' in surface) {
      await expect(page.getByRole('dialog', { name: surface.overlay })).toBeVisible();
    } else {
      await expect(page.getByRole('heading', { name: surface.heading })).toBeVisible();
    }
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: path.resolve(
        'docs/design/implementation/m5b',
        `${mobile ? 'mobile' : 'desktop'}-${surface.name}-${mobile ? '390' : '1280'}.png`,
      ),
      scale: 'css',
    });
  }
});
