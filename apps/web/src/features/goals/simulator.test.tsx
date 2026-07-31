import type { GoalDetail } from '@goal-tracker/contracts';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SimulatorPage } from './simulator';
import { ApiRequestError, type GoalTrackerApi } from '../../lib/api';
import { guidanceFixture, simulationReportFixture } from '../../test/fixtures';

const session = { accessToken: 'token', email: 'alex@example.com' };

const gym = {
  id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  name: 'Home Gym',
  description: null,
  currency: 'USD',
  targetMode: 'items',
  fixedTarget: null,
  startMonth: '2026-07',
  finalMonth: null,
  contributionsPerMonth: 2,
  preferredContribution: null,
  status: 'active',
  createdAt: '2026-07-30T12:00:00.000Z',
  updatedAt: '2026-07-30T12:00:00.000Z',
  derived: {
    currentTarget: '590.00',
    setupIncomplete: false,
    itemsTotal: '590.00',
    allocated: null,
    unallocated: null,
    overallocated: null,
    allocationState: null,
    itemCount: 2,
    financial: { funded: '700.00', spent: '560.00', available: '140.00', remaining: '0.00' },
    currencyLocked: true,
  },
  items: [
    {
      id: '33333333-3333-4333-8333-333333333333',
      goalId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      name: 'Bench',
      expectedPrice: '250.00',
      dueMonth: null,
      position: 0,
      createdAt: '2026-07-30T12:00:00.000Z',
      updatedAt: '2026-07-30T12:00:00.000Z',
      purchase: null,
    },
    {
      id: '44444444-4444-4444-8444-444444444444',
      goalId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      name: 'Plates',
      expectedPrice: '340.00',
      dueMonth: null,
      position: 1,
      createdAt: '2026-07-30T12:00:00.000Z',
      updatedAt: '2026-07-30T12:00:00.000Z',
      purchase: null,
    },
  ],
  guidance: guidanceFixture({ target: '590.00', remaining: '0.00' }),
} as GoalDetail;

const report = simulationReportFixture({
  months: [
    { month: '2026-09', funded: '1000.00', available: '440.00' },
    { month: '2026-10', funded: '1300.00', available: '740.00' },
  ],
  targetReachedMonth: '2026-10',
  fundedAtTarget: '1300.00',
  itemAffordability: [
    { itemId: '33333333-3333-4333-8333-333333333333', affordableMonth: '2026-09' },
    { itemId: '44444444-4444-4444-8444-444444444444', affordableMonth: '2026-09' },
  ],
});

function apiMock(overrides: Partial<GoalTrackerApi> = {}): GoalTrackerApi {
  return {
    getGoal: vi.fn().mockResolvedValue(gym),
    simulate: vi.fn().mockResolvedValue(report),
    ...overrides,
  } as GoalTrackerApi;
}

beforeEach(() => {
  window.history.replaceState({}, '', `/goals/${gym.id}/simulator`);
});

afterEach(cleanup);

async function renderSimulator(api = apiMock()) {
  const onBack = vi.fn();
  render(<SimulatorPage api={api} session={session} goalId={gym.id} onBack={onBack} />);
  await screen.findByRole('heading', { name: 'Home Gym · simulator' });
  return { api, onBack };
}

describe('M4 simulator page', () => {
  it('shows the temporary banner and asks for amount and duration first', async () => {
    await renderSimulator();
    expect(screen.getByText('Temporary preview')).toBeInTheDocument();
    expect(screen.getByText('Nothing here changes your goal.')).toBeInTheDocument();
    expect(screen.getByText('Add a duration and contribution amount to every phase.')).toBeInTheDocument();
  });

  it('runs the simulation when every phase is complete and renders the report', async () => {
    const { api } = await renderSimulator();
    fireEvent.change(screen.getByLabelText('Months'), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText('Per contribution'), { target: { value: '150' } });

    await waitFor(() =>
      expect(api.simulate).toHaveBeenCalledWith(session, gym.id, {
        phases: [{ months: 3, amountPerContribution: '150.00' }],
      }),
    );
    expect((await screen.findAllByText('Oct 2026')).length).toBeGreaterThan(0);
    expect((await screen.findAllByText('$1,300')).length).toBeGreaterThan(0);
    expect(screen.getByText('Each item becomes affordable')).toBeInTheDocument();
    expect(screen.getByText(/Simulated purchases are never applied\./)).toBeInTheDocument();
    expect(screen.getByText('Month by month')).toBeInTheDocument();
    expect(screen.getByText('$1,000')).toBeInTheDocument();
  });

  it('simulates a zero-contribution phase and disables automatic continuation for it', async () => {
    const { api } = await renderSimulator();
    fireEvent.change(screen.getByLabelText('Months'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Per contribution'), { target: { value: '0' } });

    await waitFor(() =>
      expect(api.simulate).toHaveBeenCalledWith(session, gym.id, {
        phases: [{ months: 1, amountPerContribution: '0.00' }],
      }),
    );
    expect(
      screen.getByRole('switch', {
        name: /Use more than \$0 in the last phase to continue automatically/,
      }),
    ).toBeDisabled();
  });

  it('adds and removes phases up to three', async () => {
    await renderSimulator();
    fireEvent.click(screen.getByRole('button', { name: 'Add a second phase' }));
    expect(screen.getByText('Phase 2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Add a third phase' }));
    expect(screen.getByText('Phase 3')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Add a .* phase/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: /Remove/ })[0]!);
    expect(screen.queryByText('Phase 3')).not.toBeInTheDocument();
  });

  it('sends continueUntilTarget for the last phase when the toggle is on', async () => {
    const { api } = await renderSimulator();
    fireEvent.change(screen.getByLabelText('Months'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('Per contribution'), { target: { value: '80' } });
    fireEvent.click(
      screen.getByRole('switch', { name: /Keep the last phase going until the target is reached/ }),
    );

    await waitFor(() =>
      expect(api.simulate).toHaveBeenCalledWith(session, gym.id, {
        phases: [{ months: 2, amountPerContribution: '80.00', continueUntilTarget: true }],
      }),
    );
  });

  it('shows API rejections without a report', async () => {
    const api = apiMock({
      simulate: vi
        .fn()
        .mockRejectedValue(
          new ApiRequestError(
            'Continuing the final phase needs a target or a future item deadline.',
            400,
            'CONTINUATION_WITHOUT_TARGET',
          ),
        ),
    });
    await renderSimulator(api);
    fireEvent.change(screen.getByLabelText('Months'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('Per contribution'), { target: { value: '80' } });

    expect(
      await screen.findByText(
        'Continuing the final phase needs a target or a future item deadline.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText('Month by month')).not.toBeInTheDocument();
  });

  it('resets the phases and the report', async () => {
    await renderSimulator();
    fireEvent.change(screen.getByLabelText('Months'), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText('Per contribution'), { target: { value: '150' } });
    await screen.findByText('Month by month');

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.queryByText('Month by month')).not.toBeInTheDocument();
    expect(screen.getByText('Add a duration and contribution amount to every phase.')).toBeInTheDocument();
  });

  it('navigates back to the goal', async () => {
    const { onBack } = await renderSimulator();
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
