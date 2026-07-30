import { describe, expect, it } from 'vitest';

import {
  TargetError,
  assertContributionsPerMonth,
  assertPreferredContribution,
  calculateTarget,
  previewTargetModeChange,
  resolveFixedOverage,
} from './targets.js';

describe('calculateTarget', () => {
  it.each([
    {
      label: 'unallocated fixed target',
      fixedTargetMinor: 10_000n,
      prices: [3_000n, 2_000n],
      expected: {
        currentTargetMinor: 10_000n,
        setupIncomplete: false,
        itemsTotalMinor: 5_000n,
        allocatedMinor: 5_000n,
        unallocatedMinor: 5_000n,
        overallocatedMinor: 0n,
        allocationState: 'unallocated',
      },
    },
    {
      label: 'fully allocated fixed target',
      fixedTargetMinor: 10_000n,
      prices: [4_000n, 6_000n],
      expected: {
        currentTargetMinor: 10_000n,
        setupIncomplete: false,
        itemsTotalMinor: 10_000n,
        allocatedMinor: 10_000n,
        unallocatedMinor: 0n,
        overallocatedMinor: 0n,
        allocationState: 'allocated',
      },
    },
    {
      label: 'overallocated fixed target',
      fixedTargetMinor: 10_000n,
      prices: [7_000n, 5_000n],
      expected: {
        currentTargetMinor: 10_000n,
        setupIncomplete: false,
        itemsTotalMinor: 12_000n,
        allocatedMinor: 12_000n,
        unallocatedMinor: 0n,
        overallocatedMinor: 2_000n,
        allocationState: 'overallocated',
      },
    },
  ])('calculates $label', ({ fixedTargetMinor, prices, expected }) => {
    expect(
      calculateTarget({
        targetMode: 'fixed',
        fixedTargetMinor,
        items: prices.map((expectedPriceMinor) => ({ expectedPriceMinor })),
      }),
    ).toEqual(expected);
  });

  it.each([
    {
      label: 'one item',
      prices: [4_500n],
      target: 4_500n,
    },
    {
      label: 'multiple items',
      prices: [4_500n, 5_500n, 250n],
      target: 10_250n,
    },
  ])('derives the target from $label', ({ prices, target }) => {
    expect(
      calculateTarget({
        targetMode: 'items',
        fixedTargetMinor: null,
        items: prices.map((expectedPriceMinor) => ({ expectedPriceMinor })),
      }),
    ).toEqual({
      currentTargetMinor: target,
      setupIncomplete: false,
      itemsTotalMinor: target,
      allocatedMinor: null,
      unallocatedMinor: null,
      overallocatedMinor: null,
      allocationState: null,
    });
  });

  it('represents an empty item-derived target as incomplete and never as zero', () => {
    const result = calculateTarget({
      targetMode: 'items',
      fixedTargetMinor: null,
      items: [],
    });

    expect(result.currentTargetMinor).toBeNull();
    expect(result.setupIncomplete).toBe(true);
    expect(result.itemsTotalMinor).toBe(0n);
  });

  it.each([
    {
      targetMode: 'fixed' as const,
      fixedTargetMinor: null,
      items: [],
    },
    {
      targetMode: 'items' as const,
      fixedTargetMinor: 1_000n,
      items: [{ expectedPriceMinor: 1_000n }],
    },
    {
      targetMode: 'items' as const,
      fixedTargetMinor: null,
      items: [{ expectedPriceMinor: 0n }],
    },
  ])('rejects invalid target input %#', (input) => {
    expect(() => calculateTarget(input)).toThrow();
  });
});

describe('resolveFixedOverage', () => {
  it.each([
    ['keep_target', 10_000n],
    ['increase_target', 12_000n],
  ] as const)('applies %s explicitly', (decision, resultingFixedTargetMinor) => {
    expect(
      resolveFixedOverage({
        fixedTargetMinor: 10_000n,
        itemsTotalMinor: 12_000n,
        decision,
      }),
    ).toEqual({
      requiresDecision: true,
      resultingFixedTargetMinor,
      overageMinor: 2_000n,
    });
  });

  it.each([null, undefined] as const)('rejects overage without decision %s', (decision) => {
    expect(() =>
      resolveFixedOverage({
        fixedTargetMinor: 10_000n,
        itemsTotalMinor: 12_000n,
        decision,
      }),
    ).toThrow(TargetError);
  });

  it.each([
    [9_000n, null],
    [10_000n, undefined],
  ] as const)('does not require a decision for items total %s', (itemsTotalMinor, decision) => {
    expect(
      resolveFixedOverage({
        fixedTargetMinor: 10_000n,
        itemsTotalMinor,
        decision,
      }),
    ).toEqual({
      requiresDecision: false,
      resultingFixedTargetMinor: 10_000n,
      overageMinor: 0n,
    });
  });
});

describe('previewTargetModeChange', () => {
  it.each([
    {
      label: 'fixed to item-derived',
      input: {
        currentMode: 'fixed' as const,
        nextMode: 'items' as const,
        fixedTargetMinor: 20_000n,
        items: [{ expectedPriceMinor: 12_000n }],
      },
      expected: {
        modeChanges: true,
        beforeTargetMinor: 20_000n,
        afterTargetMinor: 12_000n,
        beforeSetupIncomplete: false,
        afterSetupIncomplete: false,
        itemsTotalMinor: 12_000n,
      },
    },
    {
      label: 'item-derived to fixed using item total',
      input: {
        currentMode: 'items' as const,
        nextMode: 'fixed' as const,
        fixedTargetMinor: null,
        items: [{ expectedPriceMinor: 12_000n }],
      },
      expected: {
        modeChanges: true,
        beforeTargetMinor: 12_000n,
        afterTargetMinor: 12_000n,
        beforeSetupIncomplete: false,
        afterSetupIncomplete: false,
        itemsTotalMinor: 12_000n,
      },
    },
    {
      label: 'unchanged fixed mode',
      input: {
        currentMode: 'fixed' as const,
        nextMode: 'fixed' as const,
        fixedTargetMinor: 20_000n,
        items: [{ expectedPriceMinor: 12_000n }],
      },
      expected: {
        modeChanges: false,
        beforeTargetMinor: 20_000n,
        afterTargetMinor: 20_000n,
        beforeSetupIncomplete: false,
        afterSetupIncomplete: false,
        itemsTotalMinor: 12_000n,
      },
    },
  ])('previews $label', ({ input, expected }) => {
    expect(previewTargetModeChange(input)).toEqual(expected);
  });

  it('rejects switching an empty item-derived target to fixed without an amount', () => {
    expect(() =>
      previewTargetModeChange({
        currentMode: 'items',
        nextMode: 'fixed',
        fixedTargetMinor: null,
        items: [],
      }),
    ).toThrow(TargetError);
  });
});

describe('contribution preferences', () => {
  it.each([1, 2] as const)('accepts %s contributions per month', (value) => {
    expect(assertContributionsPerMonth(value)).toBe(value);
  });

  it.each([0, 1.5, 3, Number.NaN])('rejects %s contributions per month', (value) => {
    expect(() => assertContributionsPerMonth(value)).toThrow(TargetError);
  });

  it.each([
    [null, null],
    [undefined, null],
    [1n, 1n],
    [25_000n, 25_000n],
  ] as const)('normalizes preferred contribution %s to %s', (preferred, expected) => {
    expect(assertPreferredContribution(preferred)).toBe(expected);
  });

  it.each([0n, -1n])('rejects invalid preferred contribution %s', (preferred) => {
    expect(() => assertPreferredContribution(preferred)).toThrow();
  });
});
