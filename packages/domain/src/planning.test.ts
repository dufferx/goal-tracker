import { describe, expect, it } from 'vitest';

import {
  groupDueMonths,
  previewPlanningChange,
  reorderPositions,
  sortItemsByPosition,
  validateGoalPlanning,
  type GoalPlanningState,
} from './planning.js';

const baseGoal: GoalPlanningState = {
  name: 'Japan',
  description: null,
  currency: 'USD',
  targetMode: 'fixed',
  fixedTargetMinor: 10_000n,
  startMonth: '2026-01',
  finalMonth: '2026-12',
  contributionsPerMonth: 1,
  preferredContributionMinor: null,
  items: [],
};

describe('validateGoalPlanning', () => {
  it.each([
    {
      label: 'fixed target',
      input: {
        ...baseGoal,
        items: [{ expectedPriceMinor: 4_000n, dueMonth: '2026-06' }],
      },
      expectedTarget: 10_000n,
      setupIncomplete: false,
    },
    {
      label: 'item-derived target',
      input: {
        ...baseGoal,
        targetMode: 'items' as const,
        fixedTargetMinor: 99_999n,
        items: [
          { expectedPriceMinor: 4_000n, dueMonth: '2026-06' },
          { expectedPriceMinor: 6_000n, dueMonth: null },
        ],
      },
      expectedTarget: 10_000n,
      setupIncomplete: false,
    },
    {
      label: 'empty item-derived setup',
      input: {
        ...baseGoal,
        targetMode: 'items' as const,
        fixedTargetMinor: null,
        items: [],
      },
      expectedTarget: null,
      setupIncomplete: true,
    },
  ])('validates a $label', ({ input, expectedTarget, setupIncomplete }) => {
    const result = validateGoalPlanning(input);

    expect(result.startMonth).toBe('2026-01-01');
    expect(result.finalMonth).toBe('2026-12-01');
    expect(result.fixedTargetMinor).toBe(input.targetMode === 'items' ? null : 10_000n);
    expect(result.target.currentTargetMinor).toBe(expectedTarget);
    expect(result.target.setupIncomplete).toBe(setupIncomplete);
  });

  it.each([
    {
      label: 'final before start',
      changes: { startMonth: '2026-06', finalMonth: '2026-05' },
    },
    {
      label: 'due before start',
      changes: {
        items: [{ expectedPriceMinor: 1_000n, dueMonth: '2025-12' }],
      },
    },
    {
      label: 'due after final',
      changes: {
        items: [{ expectedPriceMinor: 1_000n, dueMonth: '2027-01' }],
      },
    },
  ])('rejects $label', ({ changes }) => {
    expect(() => validateGoalPlanning({ ...baseGoal, ...changes })).toThrow();
  });

  it.each([
    [1, null],
    [2, 5_000n],
  ] as const)('accepts frequency %s and preferred amount %s', (frequency, preferred) => {
    const result = validateGoalPlanning({
      ...baseGoal,
      contributionsPerMonth: frequency,
      preferredContributionMinor: preferred,
    });

    expect(result.contributionsPerMonth).toBe(frequency);
    expect(result.preferredContributionMinor).toBe(preferred);
  });

  it.each([
    { contributionsPerMonth: 0 },
    { contributionsPerMonth: 3 },
    { preferredContributionMinor: 0n },
    { preferredContributionMinor: -1n },
  ])('rejects invalid contribution settings %#', (changes) => {
    expect(() => validateGoalPlanning({ ...baseGoal, ...changes })).toThrow();
  });
});

describe('groupDueMonths', () => {
  it.each([
    {
      label: 'unsorted due items with shared months',
      items: [
        { id: 'z', expectedPriceMinor: 3_000n, dueMonth: '2026-06' },
        { id: 'ignored', expectedPriceMinor: 9_000n, dueMonth: null },
        { id: 'b', expectedPriceMinor: 2_000n, dueMonth: '2026-03-01' },
        { id: 'a', expectedPriceMinor: 1_000n, dueMonth: '2026-03' },
        { id: 'c', expectedPriceMinor: 4_000n, dueMonth: '2026-12' },
      ],
      expected: [
        {
          dueMonth: '2026-03-01',
          itemIds: ['a', 'b'],
          cumulativeRequiredMinor: 3_000n,
        },
        {
          dueMonth: '2026-06-01',
          itemIds: ['z'],
          cumulativeRequiredMinor: 6_000n,
        },
        {
          dueMonth: '2026-12-01',
          itemIds: ['c'],
          cumulativeRequiredMinor: 10_000n,
        },
      ],
    },
    {
      label: 'no due items',
      items: [
        { id: 'a', expectedPriceMinor: 1_000n, dueMonth: null },
        { id: 'b', expectedPriceMinor: 2_000n, dueMonth: null },
      ],
      expected: [],
    },
  ])('groups $label in cumulative month order', ({ items, expected }) => {
    expect(groupDueMonths(items)).toEqual(expected);
  });
});

describe('previewPlanningChange', () => {
  it.each([
    {
      decision: 'keep_target' as const,
      expectedTarget: 10_000n,
      expectedTargetImpact: null,
    },
    {
      decision: 'increase_target' as const,
      expectedTarget: 12_000n,
      expectedTargetImpact: {
        kind: 'target_changed' as const,
        label: 'Target',
        before: '100.00',
        after: '120.00',
      },
    },
  ])(
    'applies fixed overage decision $decision',
    ({ decision, expectedTarget, expectedTargetImpact }) => {
      const result = previewPlanningChange({
        before: baseGoal,
        after: {
          ...baseGoal,
          items: [{ name: 'Flights', expectedPriceMinor: 12_000n, dueMonth: null, position: 0 }],
        },
        overageDecision: decision,
      });

      expect(result.resultingFixedTargetMinor).toBe(expectedTarget);
      expect(result.impacts.find((impact) => impact.kind === 'target_changed') ?? null).toEqual(
        expectedTargetImpact,
      );
    },
  );

  it('keeps the target unchanged for an undecided fixed overage', () => {
    const result = previewPlanningChange({
      before: baseGoal,
      after: {
        ...baseGoal,
        items: [{ name: 'Flights', expectedPriceMinor: 12_000n, dueMonth: null, position: 0 }],
      },
    });

    expect(result.resultingFixedTargetMinor).toBe(baseGoal.fixedTargetMinor);
  });

  it.each([
    {
      label: 'target mode and target',
      after: {
        ...baseGoal,
        targetMode: 'items' as const,
        fixedTargetMinor: null,
        items: [{ name: 'Flights', expectedPriceMinor: 8_000n, dueMonth: null, position: 0 }],
      },
      kinds: ['target_mode_changed', 'target_changed'],
    },
    {
      label: 'deadline frequency and preferred contribution',
      after: {
        ...baseGoal,
        finalMonth: '2027-01',
        contributionsPerMonth: 2 as const,
        preferredContributionMinor: 2_500n,
      },
      kinds: ['deadline_changed', 'frequency_changed', 'preferred_contribution_changed'],
    },
  ])('reports impacts for $label', ({ after, kinds }) => {
    const result = previewPlanningChange({ before: baseGoal, after });

    expect(result.impacts.map((impact) => impact.kind)).toEqual(kinds);
  });
});

describe('item ordering', () => {
  it.each([
    {
      items: [
        { id: 'b', position: 1 },
        { id: 'c', position: 0 },
        { id: 'a', position: 1 },
      ],
      expectedIds: ['c', 'a', 'b'],
    },
    {
      items: [],
      expectedIds: [],
    },
  ])('sorts by position then id %#', ({ items, expectedIds }) => {
    expect(sortItemsByPosition(items).map((item) => item.id)).toEqual(expectedIds);
  });

  it.each([
    [[], []],
    [
      ['c', 'a', 'b'],
      [
        ['c', 0],
        ['a', 1],
        ['b', 2],
      ],
    ],
  ] as const)('assigns contiguous positions for %#', (ids, expectedEntries) => {
    expect([...reorderPositions(ids).entries()]).toEqual(expectedEntries);
  });

  it('rejects duplicate reorder ids', () => {
    expect(() => reorderPositions(['a', 'b', 'a'])).toThrow(/duplicate ids/);
  });
});
