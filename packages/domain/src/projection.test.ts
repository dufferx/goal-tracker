import { describe, expect, it } from 'vitest';

import { projectGuidance, type ProjectionInput, type ProjectionItemInput } from './projection.js';

const flights: ProjectionItemInput = {
  id: 'flights',
  name: 'Flights',
  expectedPriceMinor: 90000n,
  dueMonth: '2026-10-01',
};

const japan: ProjectionInput = {
  targetMode: 'fixed',
  fixedTargetMinor: 300000n,
  startMonth: '2026-07-01',
  finalMonth: '2027-02-01',
  contributionsPerMonth: 2,
  preferredContributionMinor: null,
  items: [flights],
  fundedMinor: 18000n,
  currentMonth: '2026-08-01',
};

describe('projectGuidance dated plan', () => {
  it('matches the reference guidance scenario exactly', () => {
    const result = projectGuidance(japan);
    expect(result.obligation).toEqual({
      kind: 'dated_items',
      dueMonth: '2026-10-01',
      itemNames: ['Flights'],
      requiredMinor: 72000n,
      remainingOpportunities: 6,
    });
    expect(result.recommendation).toEqual({
      perContributionMinor: 12000n,
      monthlyMinor: 24000n,
      contributionsPerMonth: 2,
    });
    expect(result.expectedProgressMinor).toBe(24000n);
    expect(result.progressMinor).toBe(18000n);
    expect(result.paceDeltaMinor).toBe(-6000n);
    expect(result.status).toBe('on_track');
    expect(result.explanation).toEqual({ code: 'pace_delta', deltaMinor: -6000n });
    expect(result.fullyFunded).toBe(false);
    expect(result.targetMinor).toBe(300000n);
    expect(result.remainingMinor).toBe(282000n);
  });

  // The baseline is recomputed from the remaining amount, so each row uses an
  // item price that keeps the per-contribution baseline exact: with price P
  // and funded F, baseline = (P - F) / 6 and expected progress = 2 × baseline
  // (one completed month at frequency 2).
  it.each([
    { price: 84000n, funded: 0n, expected: 'at_risk', label: 'two contributions below' },
    {
      price: 84000n,
      funded: 12000n,
      expected: 'at_risk',
      label: 'exactly one contribution below (inclusive)',
    },
    { price: 84000n, funded: 12001n, expected: 'on_track', label: 'just inside the tolerance' },
    {
      price: 84000n,
      funded: 18000n,
      expected: 'on_track',
      label: 'below expected but within one contribution',
    },
    {
      price: 108000n,
      funded: 35999n,
      expected: 'on_track',
      label: 'just below the ahead threshold',
    },
    {
      price: 108000n,
      funded: 36000n,
      expected: 'ahead',
      label: 'exactly one contribution above (inclusive)',
    },
    { price: 84000n, funded: 60000n, expected: 'ahead', label: 'well above expected' },
  ])('reports $expected when $label', ({ price, funded, expected }) => {
    const result = projectGuidance({
      ...japan,
      items: [{ ...flights, expectedPriceMinor: price }],
      fundedMinor: funded,
    });
    expect(result.status).toBe(expected);
    expect(result.explanation.code).toBe('pace_delta');
  });

  it('reports past unmet obligations as behind without dividing over zero opportunities', () => {
    const result = projectGuidance({ ...japan, currentMonth: '2026-11-01' });
    expect(result.status).toBe('behind');
    expect(result.recommendation).toBeNull();
    expect(result.obligation).toMatchObject({
      kind: 'dated_items',
      dueMonth: '2026-10-01',
      requiredMinor: 72000n,
      remainingOpportunities: 0,
    });
    expect(result.explanation).toEqual({
      code: 'behind_deadline',
      requiredMinor: 72000n,
      dueMonth: '2026-10-01',
    });
  });

  it('counts opportunities inclusively when the deadline is the current month', () => {
    const result = projectGuidance({ ...japan, currentMonth: '2026-10-01' });
    expect(result.obligation?.remainingOpportunities).toBe(2);
    expect(result.recommendation?.perContributionMinor).toBe(36000n);
    expect(result.status).not.toBe('behind');
  });

  it('starts counting opportunities at the start month when it lies in the future', () => {
    const result = projectGuidance({ ...japan, currentMonth: '2026-06-01', fundedMinor: 0n });
    expect(result.obligation?.remainingOpportunities).toBe(8);
    expect(result.recommendation?.perContributionMinor).toBe(11250n);
    expect(result.expectedProgressMinor).toBe(0n);
    expect(result.status).toBe('on_track');
  });

  it('divides by a frequency of one without inflating the monthly amount', () => {
    const result = projectGuidance({ ...japan, contributionsPerMonth: 1 });
    expect(result.obligation?.remainingOpportunities).toBe(3);
    expect(result.recommendation).toEqual({
      perContributionMinor: 24000n,
      monthlyMinor: 24000n,
      contributionsPerMonth: 1,
    });
  });

  it('rounds the per-contribution baseline up so the plan never falls short', () => {
    const result = projectGuidance({ ...japan, fundedMinor: 10000n });
    // remaining = 90000 - 10000 = 80000 over 6 opportunities
    expect(result.obligation?.requiredMinor).toBe(80000n);
    expect(result.recommendation?.perContributionMinor).toBe(13334n);
    expect(result.recommendation?.monthlyMinor).toBe(26668n);
  });

  it('moves to the next obligation once funded covers the earlier one', () => {
    const hotel: ProjectionItemInput = {
      id: 'hotel',
      name: 'Hotel',
      expectedPriceMinor: 70000n,
      dueMonth: '2026-12-01',
    };
    const result = projectGuidance({
      ...japan,
      items: [flights, hotel],
      fundedMinor: 95000n,
    });
    expect(result.obligation).toMatchObject({
      kind: 'dated_items',
      dueMonth: '2026-12-01',
      itemNames: ['Hotel'],
      requiredMinor: 65000n,
      remainingOpportunities: 10,
    });
    expect(result.progressMinor).toBe(5000n);
    expect(result.recommendation?.perContributionMinor).toBe(6500n);
  });

  it('accumulates overlapping obligations that share a month', () => {
    const railPass: ProjectionItemInput = {
      id: 'rail',
      name: 'Rail pass',
      expectedPriceMinor: 40000n,
      dueMonth: '2026-10-01',
    };
    const result = projectGuidance({ ...japan, items: [flights, railPass] });
    expect(result.obligation).toMatchObject({
      dueMonth: '2026-10-01',
      itemNames: ['Flights', 'Rail pass'],
      requiredMinor: 112000n,
    });
  });

  it('satisfies a purchased item by its actual purchase and uses remaining obligations', () => {
    const purchasedFlights: ProjectionItemInput = { ...flights, actualPriceMinor: 95000n };
    const result = projectGuidance({
      ...japan,
      items: [purchasedFlights],
      fundedMinor: 100000n,
    });
    expect(result.obligation).toMatchObject({
      kind: 'final_target',
      dueMonth: '2027-02-01',
      requiredMinor: 200000n,
      remainingOpportunities: 14,
    });
    expect(result.progressMinor).toBe(5000n);
  });

  it('keeps history truthful for an item purchased after its due month', () => {
    const latePurchase: ProjectionItemInput = { ...flights, actualPriceMinor: 90000n };
    const result = projectGuidance({
      ...japan,
      items: [latePurchase],
      fundedMinor: 90000n,
      currentMonth: '2026-11-01',
    });
    // The past-due item is satisfied; guidance evaluates the final target.
    expect(result.obligation?.kind).toBe('final_target');
    expect(result.status).not.toBe('behind');
  });

  it('prices cumulative obligations at the actual purchase price', () => {
    const cheaperPurchase: ProjectionItemInput = { ...flights, actualPriceMinor: 80000n };
    const hotel: ProjectionItemInput = {
      id: 'hotel',
      name: 'Hotel',
      expectedPriceMinor: 70000n,
      dueMonth: '2026-12-01',
    };
    const result = projectGuidance({
      ...japan,
      items: [cheaperPurchase, hotel],
      fundedMinor: 80000n,
    });
    // cumulative(Dec) = 80000 + 70000; remaining = 70000
    expect(result.obligation).toMatchObject({ dueMonth: '2026-12-01', requiredMinor: 70000n });
  });
});

describe('projectGuidance final target and open goals', () => {
  const openFixed: ProjectionInput = {
    ...japan,
    items: [],
    finalMonth: null,
  };

  it('evaluates the final target when no dated items remain', () => {
    const result = projectGuidance({ ...japan, items: [], fundedMinor: 120000n });
    expect(result.obligation).toMatchObject({
      kind: 'final_target',
      dueMonth: '2027-02-01',
      requiredMinor: 180000n,
      remainingOpportunities: 14,
    });
    expect(result.recommendation?.perContributionMinor).toBe(12858n);
    expect(result.progressMinor).toBe(120000n);
    expect(result.status).toBe('ahead');
  });

  it('reports an ended final month without enough funding as behind', () => {
    const result = projectGuidance({
      ...japan,
      items: [],
      fundedMinor: 120000n,
      currentMonth: '2027-03-01',
    });
    expect(result.status).toBe('behind');
    expect(result.recommendation).toBeNull();
    expect(result.explanation).toEqual({
      code: 'behind_deadline',
      requiredMinor: 180000n,
      dueMonth: '2027-02-01',
    });
  });

  it('forecasts an open goal from the preferred amount and frequency', () => {
    const result = projectGuidance({
      ...openFixed,
      fundedMinor: 60000n,
      preferredContributionMinor: 25000n,
    });
    expect(result.recommendation).toEqual({
      perContributionMinor: 25000n,
      monthlyMinor: 50000n,
      contributionsPerMonth: 2,
    });
    // remaining 240000 / 50000 a month → 5 months from Aug 2026 inclusive
    expect(result.forecastMonth).toBe('2026-12-01');
    expect(result.expectedProgressMinor).toBe(50000n);
    expect(result.status).toBe('on_track');
    expect(result.explanation).toEqual({
      code: 'open_goal_forecast',
      forecastMonth: '2026-12-01',
    });
  });

  it('measures open-goal pace against the preferred baseline', () => {
    const result = projectGuidance({
      ...openFixed,
      fundedMinor: 20000n,
      preferredContributionMinor: 25000n,
    });
    expect(result.status).toBe('at_risk');
    expect(result.paceDeltaMinor).toBe(-30000n);
  });

  it('shows totals without pace when there is no deadline and no preferred amount', () => {
    const result = projectGuidance({ ...openFixed, fundedMinor: 60000n });
    expect(result.status).toBeNull();
    expect(result.recommendation).toBeNull();
    expect(result.obligation).toBeNull();
    expect(result.forecastMonth).toBeNull();
    expect(result.targetMinor).toBe(300000n);
    expect(result.remainingMinor).toBe(240000n);
    expect(result.explanation).toEqual({ code: 'no_pace' });
  });

  it('treats full funding as a completion condition, not a pace status', () => {
    const result = projectGuidance({ ...japan, fundedMinor: 320000n });
    expect(result.fullyFunded).toBe(true);
    expect(result.status).toBeNull();
    expect(result.recommendation).toBeNull();
    expect(result.remainingMinor).toBe(0n);
    expect(result.explanation).toEqual({ code: 'fully_funded' });
  });

  it('keeps a goal fully funded after purchases because funded never drops', () => {
    const purchasedFlights: ProjectionItemInput = { ...flights, actualPriceMinor: 95000n };
    const result = projectGuidance({
      ...japan,
      items: [purchasedFlights],
      fundedMinor: 300000n,
    });
    expect(result.fullyFunded).toBe(true);
    expect(result.status).toBeNull();
  });

  it('reports incomplete setup for an item-derived goal without items', () => {
    const result = projectGuidance({
      targetMode: 'items',
      fixedTargetMinor: null,
      startMonth: '2026-07-01',
      finalMonth: null,
      contributionsPerMonth: 1,
      preferredContributionMinor: null,
      items: [],
      fundedMinor: 10000n,
      currentMonth: '2026-08-01',
    });
    expect(result.setupIncomplete).toBe(true);
    expect(result.targetMinor).toBeNull();
    expect(result.remainingMinor).toBeNull();
    expect(result.status).toBeNull();
    expect(result.fullyFunded).toBe(false);
    expect(result.explanation).toEqual({ code: 'setup_incomplete' });
  });

  it('derives the target from items for item-derived goals', () => {
    const result = projectGuidance({
      targetMode: 'items',
      fixedTargetMinor: null,
      startMonth: '2026-07-01',
      finalMonth: null,
      contributionsPerMonth: 1,
      preferredContributionMinor: 20000n,
      items: [
        flights,
        { ...flights, id: 'hotel', name: 'Hotel', expectedPriceMinor: 70000n, dueMonth: null },
      ],
      fundedMinor: 10000n,
      currentMonth: '2026-08-01',
    });
    expect(result.targetMinor).toBe(160000n);
    expect(result.remainingMinor).toBe(150000n);
    expect(result.obligation?.kind).toBe('dated_items');
  });
});

describe('projectGuidance determinism', () => {
  it('produces identical output for identical input', () => {
    expect(projectGuidance(japan)).toEqual(projectGuidance(japan));
  });

  it('does not mutate its input', () => {
    const frozen: ProjectionInput = Object.freeze({
      ...japan,
      items: Object.freeze(japan.items.map((item) => Object.freeze({ ...item }))),
    });
    expect(() => projectGuidance(frozen)).not.toThrow();
  });
});
