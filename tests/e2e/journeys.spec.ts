import { expect, type Page, test } from '@playwright/test';

async function registerAndSignIn(page: Page, journey: string): Promise<void> {
  const email = `m5b-${journey}-${crypto.randomUUID()}@example.test`;
  const password = 'Goal-tracker-42!';

  await page.goto('/');
  await page.getByRole('button', { name: 'Create an account' }).click();
  await page.getByLabel('Email').fill(email);
  await page.getByRole('textbox', { name: 'Password', exact: true }).fill(password);
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  const onboarding = page.getByRole('heading', { name: 'Know where you stand, monthly.' });
  const created = page.getByText('Account created');
  await expect(onboarding.or(created)).toBeVisible();

  if (await created.isVisible()) {
    await page.getByRole('button', { name: 'Continue to sign in' }).click();
    await page.getByLabel('Email').fill(email);
    await page.getByRole('textbox', { name: 'Password', exact: true }).fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();
  }

  await expect(onboarding).toBeVisible();
}

async function addContribution(page: Page, amount: string): Promise<void> {
  const globalAction = page.getByRole('button', { name: 'Add contribution' });
  const contextualAction = page.getByRole('button', { name: 'Other amount' });
  await Promise.race([
    globalAction.waitFor({ state: 'visible' }),
    contextualAction.waitFor({ state: 'visible' }),
  ]);
  if (await globalAction.isVisible()) {
    await globalAction.click();
  } else {
    await contextualAction.click();
  }
  await expect(page.getByRole('heading', { name: 'Add contribution' })).toBeVisible();
  await page.getByLabel('Amount').fill(amount);
  await page.getByRole('button', { name: /^Add .+/ }).click();
  await expect(page.getByText(/Contribution added/)).toBeVisible();
}

test('Japan Trip supports a dated purchase journey', async ({ page }, testInfo) => {
  await registerAndSignIn(page, `japan-${testInfo.project.name}`);
  await page.getByRole('button', { name: 'Create my first goal' }).click();
  await page.getByLabel('Name').fill('Japan Trip');
  await page.getByLabel('Target').fill('3000');

  await page.getByRole('combobox', { name: 'Start planning' }).click();
  await page.getByRole('option', { name: 'Jul 2026' }).click();
  await page.getByRole('combobox', { name: 'Finish by' }).click();
  await page.getByRole('option', { name: 'Feb 2027' }).click();
  await page.getByRole('button', { name: 'Create goal' }).click();

  await expect(page.getByRole('heading', { name: 'Goals' })).toBeVisible();
  await page.getByRole('button', { name: 'Open Japan Trip' }).click();
  await page.getByRole('button', { name: 'Manage items' }).click();
  await page.getByRole('button', { name: 'Add an item' }).click();
  await page.getByLabel('Name').fill('Flights');
  await page.getByLabel('Expected price').fill('900');
  await page.getByRole('combobox', { name: 'Due month' }).click();
  await page.getByRole('option', { name: 'Oct 2026' }).click();
  await page.getByRole('button', { name: 'Save item' }).click();

  await page.getByRole('button', { name: 'Add an item' }).click();
  await page.getByLabel('Name').fill('Hotel');
  await page.getByLabel('Expected price').fill('700');
  await page.getByRole('button', { name: 'Save item' }).click();
  await page.getByRole('button', { name: /^(Back|Overview)$/ }).click();

  await addContribution(page, '1000');
  await page.getByRole('button', { name: 'Buy Flights' }).click();
  await page.getByLabel('What you paid').fill('850');
  await page.getByRole('button', { name: 'Record purchase' }).click();

  await expect(page.getByText('Purchase recorded')).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Planning timeline' }).getByText('Purchased'),
  ).toBeVisible();
  await expect(page.getByText(/\$850 actual/)).toBeVisible();
  await page.getByRole('button', { name: 'See all' }).click();
  await expect(page.getByRole('heading', { name: 'Japan Trip · history' })).toBeVisible();
  await expect(page.getByText('Purchase · Flights')).toBeVisible();
  await expect(page.getByRole('button', { name: /^Contribution / })).toBeVisible();
});

test('Home Gym updates an item-derived target after purchase', async ({ page }, testInfo) => {
  await registerAndSignIn(page, `gym-${testInfo.project.name}`);
  await page.getByRole('button', { name: 'Create my first goal' }).click();
  await page.getByLabel('Name').fill('Home Gym');
  await page.getByRole('radio', { name: /A list of things/ }).click();
  await page.getByRole('button', { name: 'Add another' }).click();
  await page.getByRole('button', { name: 'Add another' }).click();

  await page.getByLabel('Item name').nth(0).fill('Dumbbell set');
  await page.getByLabel('Expected price').nth(0).fill('300');
  await page.getByLabel('Item name').nth(1).fill('Bench');
  await page.getByLabel('Expected price').nth(1).fill('500');
  await page.getByRole('button', { name: 'Create goal' }).click();

  await addContribution(page, '400');
  await page.getByRole('button', { name: 'Open Home Gym' }).click();
  await page.getByRole('button', { name: 'Buy Dumbbell set' }).click();
  await page.getByLabel('What you paid').fill('280');
  await page.getByRole('button', { name: 'Record purchase' }).click();

  await expect(page.getByText('Purchase recorded')).toBeVisible();
  await expect(page.getByText(/\$280 actual/)).toBeVisible();
  await expect(page.getByText('$780', { exact: false }).first()).toBeVisible();
});
