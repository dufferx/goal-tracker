import type { Guidance, SimulationReport } from '@goal-tracker/contracts';

/** Shared guidance fixture for web tests and design previews. */
export function guidanceFixture(overrides: Partial<Guidance> = {}): Guidance {
  return {
    asOfMonth: '2026-08',
    target: '3000.00',
    remaining: '2820.00',
    fullyFunded: false,
    setupIncomplete: false,
    status: null,
    obligation: null,
    recommendation: null,
    progress: null,
    expectedProgress: null,
    paceDelta: null,
    forecastMonth: null,
    explanation: { code: 'no_pace' },
    ...overrides,
  };
}

/** Reference P-01 "on track" guidance (Japan Trip, Oct 2026 flights). */
export function onTrackGuidanceFixture(overrides: Partial<Guidance> = {}): Guidance {
  return guidanceFixture({
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
    ...overrides,
  });
}

export function simulationReportFixture(
  overrides: Partial<SimulationReport> = {},
): SimulationReport {
  return {
    months: [],
    targetReachedMonth: null,
    fundedAtTarget: null,
    itemAffordability: [],
    ...overrides,
  };
}
