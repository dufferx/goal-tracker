import { expect, test } from '@playwright/test';

test('keyboard navigation exposes the skip link and manages contribution focus', async ({
  page,
}) => {
  await page.goto('/goals?__design=active');
  await expect(page.getByRole('heading', { name: 'Goals' })).toBeVisible();

  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: 'Skip to content' });
  await expect(skipLink).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();

  const trigger = page.getByRole('button', { name: 'Add contribution' });
  await trigger.focus();
  await page.keyboard.press('Enter');

  const overlay = page.getByRole('dialog', {
    name: 'Add contribution',
  });
  await expect(overlay).toBeVisible();
  await page.keyboard.press('Tab');
  await expect
    .poll(async () => overlay.evaluate((element) => element.contains(document.activeElement)))
    .toBe(true);

  await page.keyboard.press('Escape');
  await expect(overlay).toBeHidden();
  await expect(trigger).toBeFocused();
});
