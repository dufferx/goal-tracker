import type { GoalDetail, GoalList, Profile } from '@goal-tracker/contracts';

import type { GoalTrackerApi } from './lib/api';
import type { AuthGateway, AuthSession } from './lib/auth';

const session: AuthSession = {
  accessToken: 'design-preview-token',
  email: 'alex@example.com',
};

const profile: Profile = {
  id: '7b5f9f92-aa08-4c32-b66e-90006fae47b0',
  displayName: 'Alex',
  defaultCurrency: 'USD',
  createdAt: '2026-07-30T12:00:00.000Z',
  updatedAt: '2026-07-30T12:00:00.000Z',
};

const japan: GoalDetail = {
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
    itemsTotal: '1600.00',
    allocated: '1600.00',
    unallocated: '1400.00',
    overallocated: '0.00',
    allocationState: 'unallocated',
    itemCount: 2,
    financial: { funded: '180.00', spent: '0.00', available: '180.00', remaining: '2820.00' },
    currencyLocked: true,
  },
  items: [
    {
      id: '11111111-1111-4111-8111-111111111111',
      goalId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      name: 'Flights',
      expectedPrice: '900.00',
      dueMonth: '2026-10',
      position: 0,
      createdAt: '2026-07-30T12:00:00.000Z',
      updatedAt: '2026-07-30T12:00:00.000Z',
      purchase: null,
    },
    {
      id: '22222222-2222-4222-8222-222222222222',
      goalId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      name: 'Hotel',
      expectedPrice: '700.00',
      dueMonth: null,
      position: 1,
      createdAt: '2026-07-30T12:00:00.000Z',
      updatedAt: '2026-07-30T12:00:00.000Z',
      purchase: null,
    },
  ],
};

const homeGym: GoalDetail = {
  ...japan,
  id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  name: 'Home Gym',
  targetMode: 'items',
  fixedTarget: null,
  finalMonth: null,
  contributionsPerMonth: 1,
  preferredContribution: '100.00',
  derived: {
    currentTarget: '810.00',
    setupIncomplete: false,
    itemsTotal: '810.00',
    allocated: null,
    unallocated: null,
    overallocated: null,
    allocationState: null,
    itemCount: 2,
    financial: { funded: '700.00', spent: '560.00', available: '140.00', remaining: '110.00' },
    currencyLocked: true,
  },
  items: [
    {
      ...japan.items[0]!,
      id: '33333333-3333-4333-8333-333333333333',
      goalId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      name: 'Squat rack',
      expectedPrice: '600.00',
      dueMonth: null,
      purchase: {
        transactionId: '55555555-5555-4555-8555-555555555555',
        actualPrice: '560.00',
        effectiveDate: '2026-07-08',
      },
    },
    {
      ...japan.items[1]!,
      id: '44444444-4444-4444-8444-444444444444',
      goalId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      name: 'Bench',
      expectedPrice: '250.00',
    },
  ],
};

const incomplete: GoalDetail = {
  ...homeGym,
  id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  name: 'Garage Gym',
  preferredContribution: null,
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
};

function previewList(state: string): GoalList {
  if (state === 'empty' || state === 'onboarding') return { active: [], archived: [] };
  if (state === 'incomplete') return { active: [incomplete], archived: [] };
  if (state === 'archived') {
    return {
      active: [japan],
      archived: [{ ...homeGym, status: 'archived', name: 'Standing desk' }],
    };
  }
  return { active: [japan, homeGym, incomplete], archived: [] };
}

export function createDesignPreviewDependencies(state: string): {
  auth: AuthGateway;
  api: GoalTrackerApi;
} {
  const auth: AuthGateway = {
    restoreSession: async () => (state.startsWith('public') ? null : session),
    onChange: () => () => undefined,
    signIn: async () => ({}),
    signUp: async () => ({}),
    signOut: async () => ({}),
    requestPasswordReset: async () => ({}),
    updatePassword: async () => ({}),
  };

  const api: GoalTrackerApi = {
    getCapabilities: async () => ({
      registrationEnabled: state !== 'public-disabled',
      passwordRecoveryEmailEnabled: true,
    }),
    getProfile: async () => profile,
    updateProfile: async (_session, input) => ({ ...profile, ...input }),
    listGoals: async () => {
      if (state === 'loading') return new Promise<GoalList>(() => undefined);
      if (state === 'error') throw new Error('The server did not answer');
      return previewList(state);
    },
    getGoal: async (_session, goalId) =>
      [japan, homeGym, incomplete].find((goal) => goal.id === goalId) ?? japan,
    createGoal: async () => japan,
    updateGoal: async () => japan,
    previewPlanning: async () => ({
      impacts: [],
      resultingFixedTarget: japan.fixedTarget,
      requiresOverageDecision: false,
      requiresTargetModeConfirmation: false,
    }),
    archiveGoal: async () => ({ ...japan, status: 'archived' }),
    restoreGoal: async () => japan,
    deleteGoal: async () => undefined,
    createItem: async () => japan,
    updateItem: async () => japan,
    deleteItem: async () => japan,
    reorderItems: async () => japan.items,
    convertPercent: async () => ({ expectedPrice: '750.00' }),
    getFinancialHistory: async (_session, goalId) => {
      const selected = goalId === homeGym.id ? homeGym : japan;
      return {
        totals: selected.derived.financial,
        transactions: [
          ...(goalId === homeGym.id
            ? [
                {
                  id: '55555555-5555-4555-8555-555555555555',
                  goalId,
                  kind: 'purchase' as const,
                  amount: '560.00',
                  effectiveDate: '2026-07-08',
                  itemId: homeGym.items[0]!.id,
                  itemName: 'Squat rack',
                  reversesTransactionId: null,
                  edited: false,
                  createdAt: '2026-07-08T12:00:00.000Z',
                  updatedAt: '2026-07-08T12:00:00.000Z',
                  balanceAfter: { funded: '600.00', spent: '560.00', available: '40.00' },
                },
              ]
            : []),
          {
            id: '66666666-6666-4666-8666-666666666666',
            goalId,
            kind: 'contribution' as const,
            amount: '100.00',
            effectiveDate: '2026-07-14',
            itemId: null,
            itemName: null,
            reversesTransactionId: null,
            edited: false,
            createdAt: '2026-07-14T12:00:00.000Z',
            updatedAt: '2026-07-14T12:00:00.000Z',
            balanceAfter: {
              funded: selected.derived.financial.funded,
              spent: selected.derived.financial.spent,
              available: selected.derived.financial.available,
            },
          },
          {
            id: '77777777-7777-4777-8777-777777777777',
            goalId,
            kind: 'contribution' as const,
            amount: '80.00',
            effectiveDate: '2026-07-02',
            itemId: null,
            itemName: null,
            reversesTransactionId: null,
            edited: true,
            createdAt: '2026-07-02T12:00:00.000Z',
            updatedAt: '2026-07-03T12:00:00.000Z',
            balanceAfter: { funded: '80.00', spent: '0.00', available: '80.00' },
          },
        ],
      };
    },
    createFinancialTransaction: async () => ({
      totals: japan.derived.financial,
      transaction: null,
    }),
    updateFinancialTransaction: async () => ({
      totals: japan.derived.financial,
      transaction: null,
    }),
    deleteFinancialTransaction: async () => ({
      totals: japan.derived.financial,
      transaction: null,
    }),
    purchaseItem: async () => ({ totals: japan.derived.financial, transaction: null }),
    undoPurchase: async () => ({ totals: japan.derived.financial, transaction: null }),
  };

  return { auth, api };
}
