import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import * as axe from 'axe-core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { App } from './app';
import { createDesignPreviewDependencies } from './design-preview';

const japanId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

function violationSummary(violations: axe.Result[]): string {
  return violations
    .map(
      (violation) =>
        `${violation.id}: ${violation.help}\n${violation.nodes
          .map((node) => `  ${node.target.join(' ')} — ${node.failureSummary ?? 'failed'}`)
          .join('\n')}`,
    )
    .join('\n\n');
}

async function expectNoAccessibilityViolations(): Promise<void> {
  const result = await axe.run(document.body, {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
    },
    rules: {
      // jsdom has no layout/canvas implementation. Contrast is covered by the manual browser pass.
      'color-contrast': { enabled: false },
    },
  });

  expect(result.violations, violationSummary(result.violations)).toEqual([]);
}

beforeEach(() => {
  window.history.replaceState({}, '', '/');
});

afterEach(cleanup);

describe('M5B automated accessibility gate', () => {
  it('checks authentication', async () => {
    const dependencies = createDesignPreviewDependencies('public');
    render(<App {...dependencies} />);

    await screen.findByRole('heading', { name: 'Welcome back' });
    await expectNoAccessibilityViolations();
  });

  it.each([
    ['/goals', 'Goals'],
    ['/goals/new', 'New goal'],
    [`/goals/${japanId}`, 'Japan Trip'],
    [`/goals/${japanId}/items`, 'Japan Trip · items'],
    [`/goals/${japanId}/history`, 'Japan Trip · history'],
    [`/goals/${japanId}/simulator`, 'Japan Trip · simulator'],
    ['/settings', 'Settings'],
  ])('checks the %s surface', async (path, heading) => {
    window.history.replaceState({}, '', path);
    const dependencies = createDesignPreviewDependencies('active');
    render(<App {...dependencies} />);

    await screen.findByRole('heading', { name: heading });
    await expectNoAccessibilityViolations();
  });

  it.each([
    ['loading', 'Loading goals'],
    ['error', 'Could not load your goals'],
  ])('checks the dashboard %s state', async (state, accessibleName) => {
    window.history.replaceState({}, '', '/goals');
    const dependencies = createDesignPreviewDependencies(state);
    render(<App {...dependencies} />);

    if (state === 'loading') {
      await screen.findByRole('status', { name: accessibleName });
    } else {
      await screen.findByRole('heading', { name: accessibleName });
    }
    await expectNoAccessibilityViolations();
  });

  it('checks the empty dashboard state', async () => {
    window.history.replaceState({}, '', '/goals');
    const dependencies = createDesignPreviewDependencies('empty');
    render(<App {...dependencies} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Look around first' }));
    await screen.findByRole('heading', { name: 'No goals yet' });
    await expectNoAccessibilityViolations();
  });

  it('checks the mobile contribution drawer', async () => {
    window.history.replaceState({}, '', '/goals');
    const dependencies = createDesignPreviewDependencies('incomplete');
    render(<App {...dependencies} />);

    const mobileNavigation = await screen.findByRole('navigation', { name: 'Mobile' });
    fireEvent.click(within(mobileNavigation).getByRole('button', { name: 'Add contribution' }));
    await screen.findByRole('heading', { name: 'Add contribution' });
    await expectNoAccessibilityViolations();
  });

  it('checks the purchase drawer', async () => {
    window.history.replaceState({}, '', `/goals/${japanId}`);
    const dependencies = createDesignPreviewDependencies('active');
    render(<App {...dependencies} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Buy Flights' }));
    await screen.findByRole('heading', { name: 'Buy Flights' });
    await expectNoAccessibilityViolations();
  });
});
