import { describe, expect, it } from 'vitest';

import {
  SIMULATION_MAX_MONTHS,
  SimulationError,
  simulatePhases,
  type SimulationInput,
} from './simulation.js';

/** Mirrors the simulator design reference (Home Gym, Sep 2026). */
const reference: SimulationInput = {
  fundedMinor: 70000n,
  availableMinor: 14000n,
  targetMinor: 130000n,
  contributionsPerMonth: 2,
  currentMonth: '2026-09-01',
  items: [
    { id: 'bench', name: 'Bench', priceMinor: 25000n, dueMonth: null },
    { id: 'plates', name: 'Plates', priceMinor: 34000n, dueMonth: null },
  ],
  phases: [
    { months: 3, amountPerContributionMinor: 15000n },
    { months: 3, amountPerContributionMinor: 8000n, continueUntilTarget: true },
  ],
};

describe('simulatePhases reporting', () => {
  it('matches the reference month-by-month report exactly', () => {
    const report = simulatePhases(reference);
    expect(report.months.map((row) => [row.month, row.fundedMinor, row.availableMinor])).toEqual([
      ['2026-09-01', 100000n, 44000n],
      ['2026-10-01', 130000n, 74000n],
      ['2026-11-01', 160000n, 104000n],
      ['2026-12-01', 176000n, 120000n],
      ['2027-01-01', 192000n, 136000n],
      ['2027-02-01', 208000n, 152000n],
    ]);
    expect(report.targetReachedMonth).toBe('2026-10-01');
    expect(report.fundedAtTargetMinor).toBe(130000n);
  });

  it('reports the month each item becomes affordable without applying purchases', () => {
    const report = simulatePhases(reference);
    expect(report.itemAffordability).toEqual([
      { itemId: 'bench', affordableMonth: '2026-09-01' },
      { itemId: 'plates', affordableMonth: '2026-09-01' },
    ]);
    // Available money is never reduced for affordable items.
    expect(report.months[0]!.availableMinor).toBe(44000n);
  });

  it('applies the amount once per month with a frequency of one', () => {
    const report = simulatePhases({
      ...reference,
      contributionsPerMonth: 1,
      phases: [{ months: 2, amountPerContributionMinor: 15000n }],
    });
    expect(report.months.map((row) => row.fundedMinor)).toEqual([85000n, 100000n]);
  });

  it('allows zero-contribution months without changing funded or available money', () => {
    const report = simulatePhases({
      ...reference,
      phases: [
        { months: 2, amountPerContributionMinor: 0n },
        { months: 1, amountPerContributionMinor: 15000n },
      ],
    });
    expect(report.months).toEqual([
      { month: '2026-09-01', fundedMinor: 70000n, availableMinor: 14000n },
      { month: '2026-10-01', fundedMinor: 70000n, availableMinor: 14000n },
      { month: '2026-11-01', fundedMinor: 100000n, availableMinor: 44000n },
    ]);
  });

  it('marks items affordable immediately when current available money suffices', () => {
    const report = simulatePhases({
      ...reference,
      availableMinor: 50000n,
      phases: [{ months: 1, amountPerContributionMinor: 15000n }],
    });
    expect(report.itemAffordability).toEqual([
      { itemId: 'bench', affordableMonth: '2026-09-01' },
      { itemId: 'plates', affordableMonth: '2026-09-01' },
    ]);
  });

  it('reports a later affordable month and null when never affordable', () => {
    const report = simulatePhases({
      ...reference,
      items: [
        { id: 'rack', name: 'Rack', priceMinor: 100000n, dueMonth: null },
        { id: 'sauna', name: 'Sauna', priceMinor: 99999900n, dueMonth: null },
      ],
      phases: [{ months: 3, amountPerContributionMinor: 15000n }],
    });
    expect(report.itemAffordability).toEqual([
      { itemId: 'rack', affordableMonth: '2026-11-01' },
      { itemId: 'sauna', affordableMonth: null },
    ]);
  });

  it('reports the current month when the target is already reached', () => {
    const report = simulatePhases({
      ...reference,
      fundedMinor: 200000n,
      phases: [{ months: 1, amountPerContributionMinor: 15000n }],
    });
    expect(report.targetReachedMonth).toBe('2026-09-01');
    expect(report.fundedAtTargetMinor).toBe(200000n);
  });

  it('reports no completion when the target is not reached within the phases', () => {
    const report = simulatePhases({
      ...reference,
      targetMinor: 99999900n,
      phases: [{ months: 3, amountPerContributionMinor: 15000n }],
    });
    expect(report.targetReachedMonth).toBeNull();
    expect(report.fundedAtTargetMinor).toBeNull();
  });

  it('extends the final phase until the target is reached', () => {
    const report = simulatePhases({
      ...reference,
      targetMinor: 250000n,
    });
    // Declared phases end at 208000; continuation adds 16000 a month.
    expect(report.months).toHaveLength(9);
    expect(report.months.at(-1)).toEqual({
      month: '2027-05-01',
      fundedMinor: 256000n,
      availableMinor: 200000n,
    });
    expect(report.targetReachedMonth).toBe('2027-05-01');
  });

  it('extends the final phase until the next item deadline when there is no target', () => {
    const report = simulatePhases({
      ...reference,
      targetMinor: null,
      items: [{ id: 'bench', name: 'Bench', priceMinor: 25000n, dueMonth: '2026-12-01' }],
      phases: [{ months: 2, amountPerContributionMinor: 15000n, continueUntilTarget: true }],
    });
    expect(report.months.map((row) => row.month)).toEqual([
      '2026-09-01',
      '2026-10-01',
      '2026-11-01',
      '2026-12-01',
    ]);
    expect(report.targetReachedMonth).toBeNull();
  });

  it('does not extend when the condition is already met within the declared phases', () => {
    const report = simulatePhases(reference);
    expect(report.months).toHaveLength(6);
  });
});

describe('simulatePhases validation', () => {
  it.each([
    { label: 'no phases', phases: [], code: 'NO_PHASES' },
    {
      label: 'more than three phases',
      phases: [
        { months: 1, amountPerContributionMinor: 100n },
        { months: 1, amountPerContributionMinor: 100n },
        { months: 1, amountPerContributionMinor: 100n },
        { months: 1, amountPerContributionMinor: 100n },
      ],
      code: 'TOO_MANY_PHASES',
    },
    {
      label: 'zero months',
      phases: [{ months: 0, amountPerContributionMinor: 100n }],
      code: 'INVALID_DURATION',
    },
    {
      label: 'fractional months',
      phases: [{ months: 1.5, amountPerContributionMinor: 100n }],
      code: 'INVALID_DURATION',
    },
    {
      label: 'negative months',
      phases: [{ months: -2, amountPerContributionMinor: 100n }],
      code: 'INVALID_DURATION',
    },
    {
      label: 'negative amount',
      phases: [{ months: 1, amountPerContributionMinor: -500n }],
      code: 'INVALID_AMOUNT',
    },
    {
      label: 'continuation on a non-final phase',
      phases: [
        { months: 1, amountPerContributionMinor: 100n, continueUntilTarget: true },
        { months: 1, amountPerContributionMinor: 100n },
      ],
      code: 'CONTINUATION_NOT_LAST',
    },
    {
      label: 'automatic continuation with zero contribution',
      phases: [{ months: 1, amountPerContributionMinor: 0n, continueUntilTarget: true }],
      code: 'CONTINUATION_WITHOUT_CONTRIBUTION',
    },
    {
      label: 'continuation without target or deadline',
      phases: [{ months: 1, amountPerContributionMinor: 100n, continueUntilTarget: true }],
      code: 'CONTINUATION_WITHOUT_TARGET',
      targetMinor: null,
      items: [],
    },
  ])('rejects $label', ({ phases, code, targetMinor, items }) => {
    const attempt = () =>
      simulatePhases({
        ...reference,
        ...(targetMinor !== undefined ? { targetMinor } : {}),
        ...(items !== undefined ? { items } : {}),
        phases,
      });
    expect(attempt).toThrowError(SimulationError);
    expect(attempt).toThrowError(expect.objectContaining({ code }));
  });
});

describe('simulatePhases determinism and purity', () => {
  it('produces identical reports for identical input', () => {
    expect(simulatePhases(reference)).toEqual(simulatePhases(reference));
  });

  it('does not mutate its input', () => {
    const frozen: SimulationInput = Object.freeze({
      ...reference,
      items: Object.freeze(reference.items.map((item) => Object.freeze({ ...item }))),
      phases: Object.freeze(reference.phases.map((phase) => Object.freeze({ ...phase }))),
    });
    expect(() => simulatePhases(frozen)).not.toThrow();
    expect(frozen.phases[0]).toEqual({ months: 3, amountPerContributionMinor: 15000n });
  });

  it('caps continuation at the maximum simulated horizon', () => {
    const report = simulatePhases({
      ...reference,
      targetMinor: 999999999999n,
      phases: [{ months: 1, amountPerContributionMinor: 100n, continueUntilTarget: true }],
    });
    expect(report.months.length).toBeLessThanOrEqual(SIMULATION_MAX_MONTHS);
    expect(report.targetReachedMonth).toBeNull();
  });
});
