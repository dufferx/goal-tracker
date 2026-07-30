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
    currentTarget: '850.00',
    setupIncomplete: false,
    itemsTotal: '850.00',
    allocated: null,
    unallocated: null,
    overallocated: null,
    allocationState: null,
    itemCount: 2,
  },
  items: [
    {
      ...japan.items[0]!,
      id: '33333333-3333-4333-8333-333333333333',
      goalId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      name: 'Squat rack',
      expectedPrice: '600.00',
      dueMonth: null,
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
  };

  return { auth, api };
}
