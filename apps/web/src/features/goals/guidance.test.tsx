import type { GoalDetail, Guidance } from '@goal-tracker/contracts';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { GuidanceCard } from './guidance-card';
import { guidanceFixture, onTrackGuidanceFixture } from '../../test/fixtures';

const goal = (guidance: Guidance): GoalDetail =>
  ({
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    name: 'Japan Trip',
    description: null,
    currency: 'USD',
    targetMode: 'fixed',
    fixedTarget: '3000.00',
    startMonth: '2026-07',
    finalMonth: '2027-02',
    contributionsPerMonth: 2,
    preferredContribution: null,
    status: 'active',
    createdAt: '2026-07-30T12:00:00.000Z',
    updatedAt: '2026-07-30T12:00:00.000Z',
    derived: {
      currentTarget: '3000.00',
      setupIncomplete: false,
      itemsTotal: '900.00',
      allocated: '900.00',
      unallocated: '2100.00',
      overallocated: '0.00',
      allocationState: 'unallocated',
      itemCount: 1,
      financial: { funded: '180.00', spent: '0.00', available: '180.00', remaining: '2820.00' },
      currencyLocked: true,
    },
    items: [],
    guidance,
  }) as GoalDetail;

function renderCard(guidance: Guidance) {
  const callbacks = {
    onAddContribution: vi.fn(),
    onEditGoal: vi.fn(),
    onOpenItems: vi.fn(),
  };
  render(<GuidanceCard goal={goal(guidance)} {...callbacks} />);
  return callbacks;
}

afterEach(cleanup);

describe('M4 guidance card', () => {
  it('renders the on-track reference state with recommendation and explanation', () => {
    renderCard(onTrackGuidanceFixture());

    expect(screen.getByText('On track')).toBeInTheDocument();
    expect(screen.getByText('Add $120 twice this month.')).toBeInTheDocument();
    expect(screen.getByText('Next item')).toBeInTheDocument();
    expect(screen.getByText(/Flights · Oct 2026/)).toBeInTheDocument();
    expect(screen.getByText(/\$720/)).toBeInTheDocument();
    expect(screen.getByText(/over 6 contributions/)).toBeInTheDocument();
    expect(screen.getByText('$240')).toBeInTheDocument();
    expect(
      screen.getByText(
        "You're $60 below the expected pace, which is still within one contribution.",
      ),
    ).toBeInTheDocument();
  });

  it('opens the contribution flow from the recommendation CTA', () => {
    const callbacks = renderCard(onTrackGuidanceFixture());
    fireEvent.click(screen.getByRole('button', { name: 'Add $120' }));
    expect(callbacks.onAddContribution).toHaveBeenCalledTimes(1);
  });

  it.each([
    {
      status: 'ahead' as const,
      label: 'Ahead',
      delta: '100.00',
      text: 'ahead of the expected pace',
    },
    {
      status: 'at_risk' as const,
      label: 'At risk',
      delta: '-180.00',
      text: 'at least one contribution behind',
    },
  ])('renders the $status pill with its explanation', ({ status, label, delta, text }) => {
    renderCard(onTrackGuidanceFixture({ status, explanation: { code: 'pace_delta', delta } }));
    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(text))).toBeInTheDocument();
  });

  it('renders the behind state with the overdue amount and no pace rows', () => {
    renderCard(
      guidanceFixture({
        status: 'behind',
        obligation: {
          kind: 'dated_items',
          dueMonth: '2026-10',
          itemNames: ['Flights'],
          required: '720.00',
          remainingOpportunities: 0,
        },
        explanation: { code: 'behind_deadline', required: '720.00', dueMonth: '2026-10' },
      }),
    );
    expect(screen.getByText('Behind')).toBeInTheDocument();
    expect(screen.getByText('Add $720 to catch up.')).toBeInTheDocument();
    expect(screen.getByText(/\$720 was due in Oct 2026 and is still needed\./)).toBeInTheDocument();
    expect(screen.queryByText('Monthly')).not.toBeInTheDocument();
  });

  it('renders the no-pace state with setup actions', () => {
    const callbacks = renderCard(guidanceFixture());
    expect(screen.getByText('No pace status')).toBeInTheDocument();
    expect(
      screen.getByText(
        "There's no deadline and no preferred amount, so there's no pace to measure.",
      ),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Set a preferred amount' }));
    expect(callbacks.onEditGoal).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Add a due month' }));
    expect(callbacks.onEditGoal).toHaveBeenCalledTimes(2);
  });

  it('renders the fully funded completion state without a contribution CTA', () => {
    renderCard(
      guidanceFixture({
        fullyFunded: true,
        remaining: '0.00',
        explanation: { code: 'fully_funded' },
      }),
    );
    expect(screen.getByText('Fully funded', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText('Fully funded.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Add \$/ })).not.toBeInTheDocument();
  });

  it('renders the incomplete setup state with an add-item action', () => {
    const callbacks = renderCard(
      guidanceFixture({
        target: null,
        remaining: null,
        setupIncomplete: true,
        explanation: { code: 'setup_incomplete' },
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add an item' }));
    expect(callbacks.onOpenItems).toHaveBeenCalledTimes(1);
  });

  it('renders the open-goal forecast with its estimate', () => {
    renderCard(
      guidanceFixture({
        status: 'on_track',
        recommendation: { perContribution: '100.00', monthly: '100.00', contributionsPerMonth: 1 },
        forecastMonth: '2026-12',
        explanation: { code: 'open_goal_forecast', forecastMonth: '2026-12' },
      }),
    );
    expect(screen.getByText('Add $100 once this month.')).toBeInTheDocument();
    expect(screen.getByText('At this pace you reach the target in Dec 2026.')).toBeInTheDocument();
  });
});
