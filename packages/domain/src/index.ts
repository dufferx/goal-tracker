export {
  BusinessMonthError,
  addBusinessMonths,
  assertDueMonthAllowed,
  assertMonthRange,
  compareBusinessMonths,
  diffBusinessMonths,
  formatBusinessMonth,
  isBusinessMonthWithinRange,
  parseBusinessMonth,
  toDisplayMonth,
  type BusinessMonth,
} from './business-month.js';

export {
  MAX_MONEY_MINOR,
  MoneyError,
  addMinor,
  assertNonNegativeMinor,
  assertPositiveMinor,
  parseMoneyString,
  percentageOfFixedTarget,
  serializeMoney,
} from './money.js';

export {
  LedgerError,
  compareLedgerTransactions,
  replayLedger,
  type FinancialKind,
  type LedgerBalance,
  type LedgerErrorCode,
  type LedgerReplay,
  type LedgerTransaction,
  type ReplayedTransaction,
} from './ledger.js';

export {
  groupDueMonths,
  previewPlanningChange,
  reorderPositions,
  sortItemsByPosition,
  validateGoalPlanning,
  type DueMonthGroup,
  type GoalPlanningState,
  type PlanningImpact,
  type PlanningItem,
  type PlanningValidationResult,
} from './planning.js';

export {
  projectGuidance,
  type PaceStatus,
  type Projection,
  type ProjectionExplanation,
  type ProjectionExplanationCode,
  type ProjectionInput,
  type ProjectionItemInput,
  type ProjectionObligation,
  type ProjectionRecommendation,
} from './projection.js';

export {
  SIMULATION_MAX_MONTHS,
  SimulationError,
  simulatePhases,
  type SimulationErrorCode,
  type SimulationInput,
  type SimulationItemAffordability,
  type SimulationItemInput,
  type SimulationMonthRow,
  type SimulationPhaseInput,
  type SimulationReport,
} from './simulation.js';

export {
  TargetError,
  assertContributionsPerMonth,
  assertPreferredContribution,
  calculateTarget,
  previewTargetModeChange,
  resolveFixedOverage,
  sumExpectedPrices,
  type AllocationState,
  type FixedOverageDecision,
  type OverageResolution,
  type TargetCalculation,
  type TargetCalculationInput,
  type TargetItemInput,
  type TargetMode,
  type TargetModeChangePreview,
} from './targets.js';
