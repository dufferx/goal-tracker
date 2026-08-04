import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppShell } from './app-shell';

describe('AppShell', () => {
  it('renders product navigation with counts, primary action, and semantic active state', () => {
    const add = vi.fn();
    render(
      <AppShell
        active="goals"
        rail={{ kind: 'product', activeCount: 3, archivedCount: 2 }}
        onNavigateGoals={() => undefined}
        onNavigateSettings={() => undefined}
        onAddContribution={add}
      >
        <h1>Goals</h1>
      </AppShell>,
    );

    const primary = screen.getByRole('navigation', { name: 'Primary' });
    expect(primary).toHaveTextContent('Goals');
    expect(primary.querySelector('[aria-current="page"]')).toHaveTextContent('Goals');
    expect(screen.getByText('Active').parentElement).toHaveTextContent('3');
    fireEvent.click(screen.getAllByRole('button', { name: 'Add contribution' })[0]!);
    expect(add).toHaveBeenCalledOnce();
  });

  it('renders contextual goal navigation with one current destination', () => {
    render(
      <AppShell
        active="goals"
        rail={{
          kind: 'goal',
          active: 'history',
          onAllGoals: () => undefined,
          onOverview: () => undefined,
          onItems: () => undefined,
          onHistory: () => undefined,
          onSimulator: () => undefined,
          onEdit: () => undefined,
        }}
        onNavigateGoals={() => undefined}
        onNavigateSettings={() => undefined}
      >
        <h1>History</h1>
      </AppShell>,
    );

    const goalNavigation = screen.getByRole('navigation', { name: 'Goal' });
    expect(goalNavigation.querySelector('[aria-current="page"]')).toHaveTextContent('History');
    expect(goalNavigation).toHaveTextContent('Simulator');
    expect(goalNavigation).toHaveTextContent('Edit goal');
  });
});
