import type { GoalDetail } from '@goal-tracker/contracts';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ContributionDrawer, PurchaseDrawer } from './financial';
import { ApiRequestError, type GoalTrackerApi } from '../../lib/api';
import { guidanceFixture, simulationReportFixture } from '../../test/fixtures';

const session = { accessToken: 'token', email: 'alex@example.com' };
const goal = {
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
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
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
  guidance: guidanceFixture({
    status: 'on_track',
    obligation: {
      kind: 'dated_items',
      dueMonth: '2026-10',
      itemNames: ['Flights'],
      required: '720.00',
      remainingOpportunities: 6,
    },
    recommendation: { perContribution: '120.00', monthly: '240.00', contributionsPerMonth: 2 },
    progress: '180.00',
    expectedProgress: '240.00',
    paceDelta: '-60.00',
    explanation: { code: 'pace_delta', delta: '-60.00' },
  }),
} as GoalDetail;

function api(overrides: Partial<GoalTrackerApi> = {}): GoalTrackerApi {
  const mutation = { totals: goal.derived.financial, transaction: null };
  return {
    getCapabilities: vi.fn(),
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    listGoals: vi.fn(),
    getGoal: vi.fn().mockResolvedValue(goal),
    createGoal: vi.fn(),
    updateGoal: vi.fn(),
    previewPlanning: vi.fn(),
    archiveGoal: vi.fn(),
    restoreGoal: vi.fn(),
    deleteGoal: vi.fn(),
    createItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
    reorderItems: vi.fn(),
    convertPercent: vi.fn(),
    getFinancialHistory: vi
      .fn()
      .mockResolvedValue({ totals: goal.derived.financial, transactions: [] }),
    createFinancialTransaction: vi.fn().mockResolvedValue(mutation),
    updateFinancialTransaction: vi.fn(),
    deleteFinancialTransaction: vi.fn(),
    purchaseItem: vi.fn(),
    undoPurchase: vi.fn(),
    simulate: vi.fn().mockResolvedValue(simulationReportFixture()),
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function useDesktopViewport() {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: query === '(min-width: 1024px)',
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
}

describe('M3 contribution sheet', () => {
  it('uses the shadcn dialog at desktop without changing the financial form', () => {
    useDesktopViewport();
    render(
      <ContributionDrawer
        open
        onOpenChange={vi.fn()}
        api={api()}
        session={session}
        goal={goal}
        onReconciled={vi.fn()}
      />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Add contribution' })).toBeInTheDocument();
    expect(screen.getByLabelText('Amount')).toBeInTheDocument();
  });

  it('submits exactly once and disables the financial controls while pending', async () => {
    let finish!: (value: unknown) => void;
    const create = vi.fn().mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const gateway = api({ createFinancialTransaction: create });
    render(
      <ContributionDrawer
        open
        onOpenChange={vi.fn()}
        api={gateway}
        session={session}
        goal={goal}
        onReconciled={vi.fn()}
      />,
    );
    const datePicker = screen.getByLabelText('Date');
    expect(datePicker).toHaveAttribute('type', 'button');
    fireEvent.click(datePicker);
    expect(screen.getByRole('grid')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '120' } });
    const submit = screen.getByRole('button', { name: /Add \$120/ });
    fireEvent.click(submit);
    fireEvent.click(submit);
    expect(create).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('Amount')).toBeDisabled();
    finish({ totals: goal.derived.financial, transaction: null });
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(
        session,
        goal.id,
        expect.objectContaining({ kind: 'contribution', amount: '120.00' }),
      ),
    );
  });

  it('distinguishes a known rejection from an unknown result and reconciles before retry', async () => {
    const known = api({
      createFinancialTransaction: vi
        .fn()
        .mockRejectedValue(
          new ApiRequestError('This change would break your history.', 422, 'NEGATIVE_AVAILABLE'),
        ),
    });
    const first = render(
      <ContributionDrawer
        open
        onOpenChange={vi.fn()}
        api={known}
        session={session}
        goal={goal}
        onReconciled={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Withdraw' }));
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '500' } });
    fireEvent.click(screen.getByRole('button', { name: /Withdraw \$500/ }));
    expect(await screen.findByText('Not saved')).toBeInTheDocument();
    expect(screen.getByLabelText('Amount')).toHaveValue('500');
    first.unmount();

    const unknown = api({
      createFinancialTransaction: vi.fn().mockRejectedValue(new TypeError('Failed to fetch')),
    });
    render(
      <ContributionDrawer
        open
        onOpenChange={vi.fn()}
        api={unknown}
        session={session}
        goal={goal}
        onReconciled={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '120' } });
    fireEvent.click(screen.getByRole('button', { name: /Add \$120/ }));
    expect(await screen.findByText('Result unknown')).toBeInTheDocument();
    await waitFor(() => expect(unknown.getFinancialHistory).toHaveBeenCalledTimes(1));
    expect(unknown.getGoal).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('Amount')).toHaveValue('120');
  });
});

describe('M3 purchase sheet', () => {
  it('handles a formatted four-digit price when checking available money', async () => {
    const item = {
      id: '11111111-1111-4111-8111-111111111111',
      goalId: goal.id,
      name: 'Flights',
      expectedPrice: '1500.00',
      dueMonth: '2027-03',
      position: 0,
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-01T00:00:00.000Z',
      purchase: null,
    };
    const purchase = vi.fn().mockResolvedValue({
      totals: goal.derived.financial,
      transaction: null,
    });
    render(
      <PurchaseDrawer
        item={item}
        goal={{
          ...goal,
          derived: {
            ...goal.derived,
            financial: {
              funded: '2000.00',
              spent: '0.00',
              available: '2000.00',
              remaining: '2000.00',
            },
          },
          items: [item],
        }}
        api={api({ purchaseItem: purchase })}
        session={session}
        onClose={vi.fn()}
        onChanged={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('What you paid')).toHaveValue('1,500');
    expect(screen.getByText('Available').parentElement).toHaveTextContent('$2,000 → $500');
    expect(screen.queryByText('Not enough available')).not.toBeInTheDocument();
    const submit = screen.getByRole('button', { name: 'Record purchase' });
    expect(submit).toBeEnabled();
    fireEvent.click(submit);
    await waitFor(() =>
      expect(purchase).toHaveBeenCalledWith(
        session,
        goal.id,
        item.id,
        expect.objectContaining({ amount: '1500.00' }),
      ),
    );
  });

  it('asks how to handle a fixed-target overage and resubmits the chosen decision', async () => {
    const item = {
      id: '11111111-1111-4111-8111-111111111111',
      goalId: goal.id,
      name: 'Flights',
      expectedPrice: '100.00',
      dueMonth: null,
      position: 0,
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-01T00:00:00.000Z',
      purchase: null,
    };
    const purchase = vi
      .fn()
      .mockRejectedValueOnce(
        new ApiRequestError(
          'This price exceeds the fixed target. Choose whether to keep or increase the target.',
          409,
          'OVERAGE_DECISION_REQUIRED',
        ),
      )
      .mockResolvedValueOnce({ totals: goal.derived.financial, transaction: null });
    const close = vi.fn();
    render(
      <PurchaseDrawer
        item={item}
        goal={{ ...goal, items: [item] }}
        api={api({ purchaseItem: purchase })}
        session={session}
        onClose={close}
        onChanged={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Record purchase' }));
    expect(await screen.findByRole('button', { name: 'Increase target' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Increase target' }));

    await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
    expect(purchase).toHaveBeenLastCalledWith(
      session,
      goal.id,
      item.id,
      expect.objectContaining({ overageDecision: 'increase_target' }),
    );
  });

  it('reconciles an unknown purchase result before the preserved form can be retried', async () => {
    const item = {
      id: '11111111-1111-4111-8111-111111111111',
      goalId: goal.id,
      name: 'Flights',
      expectedPrice: '100.00',
      dueMonth: null,
      position: 0,
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-01T00:00:00.000Z',
      purchase: null,
    };
    const gateway = api({ purchaseItem: vi.fn().mockRejectedValue(new TypeError('offline')) });
    render(
      <PurchaseDrawer
        item={item}
        goal={{ ...goal, items: [item] }}
        api={gateway}
        session={session}
        onClose={vi.fn()}
        onChanged={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Record purchase' }));
    expect(await screen.findByText('Result unknown')).toBeInTheDocument();
    await waitFor(() => expect(gateway.getFinancialHistory).toHaveBeenCalledTimes(1));
    expect(gateway.getGoal).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('What you paid')).toHaveValue('100');
  });
});
