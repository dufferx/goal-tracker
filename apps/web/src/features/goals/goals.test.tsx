import type { GoalDetail, GoalList, Profile } from '@goal-tracker/contracts';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from '../../app';
import { ApiRequestError, type GoalTrackerApi } from '../../lib/api';
import type { AuthGateway, AuthSession } from '../../lib/auth';
import { guidanceFixture, simulationReportFixture } from '../../test/fixtures';

const session: AuthSession = { accessToken: 'access-token', email: 'alex@example.com' };
const profile = {
  id: '7b5f9f92-aa08-4c32-b66e-90006fae47b0',
  displayName: 'Alex',
  defaultCurrency: 'USD',
  createdAt: '2026-07-30T12:00:00.000Z',
  updatedAt: '2026-07-30T12:00:00.000Z',
} as Profile;

const incompleteGoal = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  name: 'Home Gym',
  description: null,
  currency: 'USD',
  targetMode: 'items',
  fixedTarget: null,
  startMonth: '2026-07',
  finalMonth: null,
  contributionsPerMonth: 1,
  preferredContribution: null,
  status: 'active',
  createdAt: '2026-07-30T12:00:00.000Z',
  updatedAt: '2026-07-30T12:00:00.000Z',
  derived: {
    currentTarget: null,
    setupIncomplete: true,
    itemsTotal: '0.00',
    allocated: null,
    unallocated: null,
    overallocated: null,
    allocationState: null,
    itemCount: 0,
    financial: { funded: '0.00', spent: '0.00', available: '0.00', remaining: null },
    currencyLocked: false,
  },
  items: [],
  guidance: guidanceFixture({
    target: null,
    remaining: null,
    setupIncomplete: true,
    explanation: { code: 'setup_incomplete' },
  }),
} as GoalDetail;

function authMock(): AuthGateway {
  return {
    restoreSession: vi.fn().mockResolvedValue(session),
    onChange: vi.fn().mockReturnValue(() => undefined),
    signIn: vi.fn().mockResolvedValue({}),
    signUp: vi.fn().mockResolvedValue({}),
    signOut: vi.fn().mockResolvedValue({}),
    requestPasswordReset: vi.fn().mockResolvedValue({}),
    updatePassword: vi.fn().mockResolvedValue({}),
  };
}

function apiMock(overrides: Partial<GoalTrackerApi> = {}): GoalTrackerApi {
  return {
    getCapabilities: vi.fn().mockResolvedValue({
      registrationEnabled: true,
      passwordRecoveryEmailEnabled: true,
      version: '1.0.0',
    }),
    getProfile: vi.fn().mockResolvedValue(profile),
    updateProfile: vi.fn().mockResolvedValue(profile),
    listGoals: vi.fn().mockResolvedValue({ active: [], archived: [] } satisfies GoalList),
    getGoal: vi.fn().mockResolvedValue(incompleteGoal),
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
    getFinancialHistory: vi.fn().mockResolvedValue({
      totals: { funded: '0.00', spent: '0.00', available: '0.00', remaining: null },
      transactions: [],
    }),
    createFinancialTransaction: vi.fn(),
    updateFinancialTransaction: vi.fn(),
    deleteFinancialTransaction: vi.fn(),
    purchaseItem: vi.fn(),
    undoPurchase: vi.fn(),
    simulate: vi.fn().mockResolvedValue(simulationReportFixture()),
    ...overrides,
  };
}

beforeEach(() => {
  window.history.replaceState({}, '', '/goals');
});

afterEach(cleanup);

describe('M2 goals web flows', () => {
  it('shows onboarding for first use', async () => {
    render(<App auth={authMock()} api={apiMock()} />);
    expect(
      await screen.findByRole('heading', { name: 'Know where you stand, monthly.' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create my first goal' })).toBeInTheDocument();
  });

  it('shows empty dashboard after browsing from onboarding', async () => {
    render(<App auth={authMock()} api={apiMock()} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Look around first' }));
    expect(await screen.findByRole('heading', { name: 'No goals yet' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create a goal' })).toBeInTheDocument();
  });

  it('shows loading then error with retry', async () => {
    const listGoals = vi
      .fn()
      .mockRejectedValueOnce(new Error('The server did not answer'))
      .mockResolvedValueOnce({ active: [], archived: [] });
    render(<App auth={authMock()} api={apiMock({ listGoals })} />);

    expect(
      await screen.findByRole('heading', { name: 'Could not load your goals' }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(listGoals).toHaveBeenCalledTimes(2));
    expect(
      await screen.findByRole('heading', { name: 'Know where you stand, monthly.' }),
    ).toBeInTheDocument();
  });

  it('groups goals by currency and never sums them', async () => {
    const list: GoalList = {
      active: [
        {
          ...incompleteGoal,
          id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          name: 'Japan Trip',
          targetMode: 'fixed',
          fixedTarget: '3000.00',
          derived: {
            ...incompleteGoal.derived,
            currentTarget: '3000.00',
            setupIncomplete: false,
            itemsTotal: '1600.00',
            allocated: '1600.00',
            unallocated: '1400.00',
            overallocated: '0.00',
            allocationState: 'unallocated',
            itemCount: 2,
          },
        },
        {
          ...incompleteGoal,
          id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
          name: 'Camera',
          currency: 'EUR',
          derived: {
            ...incompleteGoal.derived,
            setupIncomplete: false,
            currentTarget: '1800.00',
            itemsTotal: '1800.00',
            itemCount: 1,
          },
        },
      ],
      archived: [],
    };
    render(<App auth={authMock()} api={apiMock({ listGoals: vi.fn().mockResolvedValue(list) })} />);

    expect(await screen.findByText('US Dollar')).toBeInTheDocument();
    expect(screen.getByText('Euro')).toBeInTheDocument();
    expect(screen.getByText('Japan Trip')).toBeInTheDocument();
    expect(screen.getByText('Camera')).toBeInTheDocument();
    expect(screen.queryByText(/\$4,800|4800/)).not.toBeInTheDocument();
  });

  it('keeps the contribution fast path in the center of mobile navigation', async () => {
    const list = { active: [incompleteGoal], archived: [] } satisfies GoalList;
    const api = apiMock({ listGoals: vi.fn().mockResolvedValue(list) });
    render(<App auth={authMock()} api={api} />);

    const navigation = await screen.findByRole('navigation', { name: 'Mobile' });
    const add = await within(navigation).findByRole('button', { name: 'Add contribution' });
    expect(add).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '+ Add' })).not.toBeInTheDocument();

    fireEvent.click(add);
    await waitFor(() => expect(api.getGoal).toHaveBeenCalledWith(session, incompleteGoal.id));
    expect(
      await screen.findByRole('heading', { name: 'Add contribution' }, { timeout: 10_000 }),
    ).toBeInTheDocument();
  });

  it('opens the single financial overview route from the whole goal card', async () => {
    const detail = {
      ...incompleteGoal,
      name: 'Japan Trip',
      targetMode: 'fixed',
      fixedTarget: '3000.00',
      derived: {
        ...incompleteGoal.derived,
        currentTarget: '3000.00',
        setupIncomplete: false,
        allocated: '0.00',
        unallocated: '3000.00',
        overallocated: '0.00',
        allocationState: 'unallocated',
        financial: {
          funded: '180.00',
          spent: '0.00',
          available: '180.00',
          remaining: '2820.00',
        },
      },
    } as GoalDetail;
    const api = apiMock({
      listGoals: vi.fn().mockResolvedValue({ active: [detail], archived: [] } satisfies GoalList),
      getGoal: vi.fn().mockResolvedValue(detail),
    });
    render(<App auth={authMock()} api={api} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Open Japan Trip' }));

    await waitFor(() => expect(window.location.pathname).toBe(`/goals/${detail.id}`));
    expect(await screen.findByRole('heading', { name: 'Japan Trip' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Japan Trip · items' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Manage items' }));
    expect(await screen.findByRole('heading', { name: 'Japan Trip · items' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add an item' })).toBeInTheDocument();
    expect(window.location.pathname).toBe(`/goals/${detail.id}/items`);

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(await screen.findByRole('heading', { name: 'Japan Trip' })).toBeInTheDocument();
    expect(window.location.pathname).toBe(`/goals/${detail.id}`);
  });

  it('opens the contribution drawer from an item route and canonicalizes the detail URL', async () => {
    window.history.replaceState({}, '', `/goals/${incompleteGoal.id}/items`);
    render(<App auth={authMock()} api={apiMock()} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Add contribution' }));

    expect(await screen.findByRole('heading', { name: 'Add contribution' })).toBeInTheDocument();
    expect(window.location.pathname).toBe(`/goals/${incompleteGoal.id}`);
  });

  it('creates a fixed goal and preserves form input after validation errors', async () => {
    const createGoal = vi
      .fn()
      .mockRejectedValueOnce(
        new ApiRequestError('Check the highlighted fields.', 400, 'VALIDATION_ERROR', {
          fixedTarget: ['Amount must be a positive decimal value.'],
        }),
      )
      .mockResolvedValueOnce({
        ...incompleteGoal,
        id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
        name: 'Japan Trip',
        targetMode: 'fixed',
        fixedTarget: '3000.00',
        derived: {
          ...incompleteGoal.derived,
          setupIncomplete: false,
          currentTarget: '3000.00',
          itemCount: 0,
        },
      });

    render(<App auth={authMock()} api={apiMock({ createGoal })} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Create my first goal' }));
    expect(await screen.findByRole('radio', { name: /An amount/ })).toHaveAttribute(
      'data-state',
      'checked',
    );
    expect(screen.getByRole('radio', { name: 'Twice' })).toHaveAttribute('data-state', 'checked');

    fireEvent.click(screen.getByRole('radio', { name: 'Once' }));
    expect(screen.getByRole('radio', { name: 'Once' })).toHaveAttribute('data-state', 'checked');

    fireEvent.change(await screen.findByLabelText('Name'), { target: { value: 'Japan Trip' } });
    fireEvent.change(screen.getByLabelText('Target'), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create goal' }));

    expect(await screen.findByText('Check the highlighted fields.')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('Japan Trip');
    expect(screen.getByLabelText('Target')).toHaveValue('0');

    fireEvent.change(screen.getByLabelText('Target'), { target: { value: '3000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create goal' }));
    await waitFor(() => expect(createGoal).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(window.location.pathname).toBe('/goals'));
    expect(screen.queryByRole('heading', { name: 'Edit Japan Trip' })).not.toBeInTheDocument();
  });

  it('shows incomplete setup and navigates to add an item', async () => {
    const list: GoalList = {
      active: [incompleteGoal],
      archived: [],
    };
    render(
      <App
        auth={authMock()}
        api={apiMock({
          listGoals: vi.fn().mockResolvedValue(list),
          getGoal: vi.fn().mockResolvedValue(incompleteGoal),
        })}
      />,
    );

    expect(await screen.findByText('Setup incomplete')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Add an item' }));
    expect(await screen.findByRole('heading', { name: 'Home Gym · items' })).toBeInTheDocument();
  });

  it('edits an item through the accessible mobile drawer', async () => {
    const itemGoal = {
      ...incompleteGoal,
      name: 'Japan Trip',
      targetMode: 'fixed',
      fixedTarget: '3000.00',
      finalMonth: '2027-02',
      contributionsPerMonth: 2,
      derived: {
        ...incompleteGoal.derived,
        currentTarget: '3000.00',
        setupIncomplete: false,
        itemsTotal: '900.00',
        allocated: '900.00',
        unallocated: '2100.00',
        overallocated: '0.00',
        allocationState: 'unallocated',
        itemCount: 1,
      },
      items: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          goalId: incompleteGoal.id,
          name: 'Flights',
          expectedPrice: '900.00',
          dueMonth: '2026-10',
          position: 0,
          createdAt: '2026-07-30T12:00:00.000Z',
          updatedAt: '2026-07-30T12:00:00.000Z',
        },
      ],
    } as GoalDetail;
    const updateItem = vi.fn().mockResolvedValue(itemGoal);
    window.history.replaceState({}, '', `/goals/${itemGoal.id}/items`);

    render(
      <App
        auth={authMock()}
        api={apiMock({
          getGoal: vi.fn().mockResolvedValue(itemGoal),
          updateItem,
        })}
      />,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Edit Flights' }));
    expect(await screen.findByRole('heading', { name: 'Edit item' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Expected price'), { target: { value: '850' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save item' }));

    await waitFor(() =>
      expect(updateItem).toHaveBeenCalledWith(session, itemGoal.id, itemGoal.items[0]!.id, {
        name: 'Flights',
        expectedPrice: '850.00',
        dueMonth: '2026-10',
      }),
    );
  });

  it('requires typed confirmation for permanent delete', async () => {
    const deleteGoal = vi.fn().mockResolvedValue(undefined);
    const detail = {
      ...incompleteGoal,
      name: 'Old PC build',
      derived: {
        ...incompleteGoal.derived,
        setupIncomplete: false,
        currentTarget: '100.00',
        itemCount: 1,
      },
    } as GoalDetail;
    window.history.replaceState({}, '', `/goals/${detail.id}`);
    render(
      <App
        auth={authMock()}
        api={apiMock({
          getGoal: vi.fn().mockResolvedValue(detail),
          deleteGoal,
        })}
      />,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Edit' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Delete goal' }));
    const confirm = await screen.findByLabelText('Type the goal name to confirm');
    expect(screen.getByRole('button', { name: 'Delete Old PC build' })).toBeDisabled();
    fireEvent.change(confirm, { target: { value: 'Old PC build' } });
    fireEvent.click(screen.getByRole('button', { name: 'Delete Old PC build' }));
    await waitFor(() =>
      expect(deleteGoal).toHaveBeenCalledWith(session, detail.id, {
        confirmationName: 'Old PC build',
      }),
    );
  });

  it('navigates authenticated users to settings from the shell', async () => {
    render(<App auth={authMock()} api={apiMock()} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Look around first' }));
    const settingsButtons = await screen.findAllByRole('button', { name: 'Settings' });
    fireEvent.click(settingsButtons[0]!);
    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument();
  });
});
