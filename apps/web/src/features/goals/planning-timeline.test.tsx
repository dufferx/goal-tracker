import type { GoalDetail } from '@goal-tracker/contracts';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { guidanceFixture } from '../../test/fixtures';
import { PlanningTimeline } from './planning-timeline';

afterEach(cleanup);

describe('M4 planning timeline', () => {
  it('keeps a funded due item visible after guidance advances to the final target', () => {
    const goal = {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      name: 'Japan Trip',
      currency: 'USD',
      targetMode: 'fixed',
      fixedTarget: '4000.00',
      startMonth: '2026-07',
      finalMonth: '2027-03',
      contributionsPerMonth: 2,
      preferredContribution: null,
      status: 'active',
      description: null,
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-01T00:00:00.000Z',
      derived: {
        currentTarget: '4000.00',
        setupIncomplete: false,
        itemsTotal: '1500.00',
        allocated: '1500.00',
        unallocated: '2500.00',
        overallocated: '0.00',
        allocationState: 'unallocated',
        itemCount: 1,
        financial: {
          funded: '2000.00',
          spent: '0.00',
          available: '2000.00',
          remaining: '2000.00',
        },
        currencyLocked: true,
      },
      items: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          goalId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          name: 'Flights',
          expectedPrice: '1500.00',
          dueMonth: '2027-03',
          position: 0,
          createdAt: '2026-07-01T00:00:00.000Z',
          updatedAt: '2026-07-01T00:00:00.000Z',
          purchase: null,
        },
      ],
      guidance: guidanceFixture({
        asOfMonth: '2026-07',
        target: '4000.00',
        remaining: '2000.00',
        status: 'ahead',
        obligation: {
          kind: 'final_target',
          dueMonth: '2027-03',
          itemNames: [],
          required: '2000.00',
          remainingOpportunities: 18,
        },
        recommendation: {
          perContribution: '111.12',
          monthly: '222.24',
          contributionsPerMonth: 2,
        },
        progress: '500.00',
        expectedProgress: '0.00',
        paceDelta: '500.00',
        explanation: { code: 'pace_delta', delta: '500.00' },
      }),
    } as GoalDetail;

    render(<PlanningTimeline goal={goal} onOpenItems={vi.fn()} />);

    expect(screen.getByText('Flights')).toBeInTheDocument();
    expect(screen.getByText('Funded')).toBeInTheDocument();
    expect(screen.getByText('$1,500')).toBeInTheDocument();
    expect(screen.getAllByText('Final target')).toHaveLength(1);
    expect(screen.getByText('$4,000')).toBeInTheDocument();
  });
});
