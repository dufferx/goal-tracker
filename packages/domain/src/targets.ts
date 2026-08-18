import { addMinor, assertPositiveMinor } from './money.js';

export type TargetMode = 'fixed' | 'items';
export type FixedOverageDecision = 'keep_target' | 'increase_target';
export type AllocationState = 'allocated' | 'unallocated' | 'overallocated';

export interface TargetItemInput {
  expectedPriceMinor: bigint;
  actualPriceMinor?: bigint | null;
}

export interface TargetCalculationInput {
  targetMode: TargetMode;
  fixedTargetMinor: bigint | null;
  items: readonly TargetItemInput[];
}

export interface TargetCalculation {
  currentTargetMinor: bigint | null;
  setupIncomplete: boolean;
  itemsTotalMinor: bigint;
  allocatedMinor: bigint | null;
  unallocatedMinor: bigint | null;
  overallocatedMinor: bigint | null;
  allocationState: AllocationState | null;
}

export class TargetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TargetError';
  }
}

export function sumExpectedPrices(items: readonly TargetItemInput[]): bigint {
  return addMinor(
    ...items.map((item) =>
      assertPositiveMinor(item.actualPriceMinor ?? item.expectedPriceMinor, 'itemPrice'),
    ),
  );
}

export function calculateTarget(input: TargetCalculationInput): TargetCalculation {
  const itemsTotalMinor = itemsLengthSum(input.items);

  if (input.targetMode === 'fixed') {
    if (input.fixedTargetMinor == null) {
      throw new TargetError('fixedTargetMinor is required when targetMode is fixed.');
    }
    const fixedTargetMinor = assertPositiveMinor(input.fixedTargetMinor, 'fixedTargetMinor');
    const delta = fixedTargetMinor - itemsTotalMinor;
    const overallocatedMinor = delta < 0n ? -delta : 0n;
    const unallocatedMinor = delta > 0n ? delta : 0n;
    let allocationState: AllocationState = 'allocated';
    if (overallocatedMinor > 0n) allocationState = 'overallocated';
    else if (unallocatedMinor > 0n) allocationState = 'unallocated';

    return {
      currentTargetMinor: fixedTargetMinor,
      setupIncomplete: false,
      itemsTotalMinor,
      allocatedMinor: itemsTotalMinor,
      unallocatedMinor,
      overallocatedMinor,
      allocationState,
    };
  }

  // item-derived
  if (input.fixedTargetMinor != null) {
    throw new TargetError('fixedTargetMinor must be null when targetMode is items.');
  }

  if (input.items.length === 0) {
    return {
      currentTargetMinor: null,
      setupIncomplete: true,
      itemsTotalMinor: 0n,
      allocatedMinor: null,
      unallocatedMinor: null,
      overallocatedMinor: null,
      allocationState: null,
    };
  }

  return {
    currentTargetMinor: itemsTotalMinor,
    setupIncomplete: false,
    itemsTotalMinor,
    allocatedMinor: null,
    unallocatedMinor: null,
    overallocatedMinor: null,
    allocationState: null,
  };
}

function itemsLengthSum(items: readonly TargetItemInput[]): bigint {
  if (items.length === 0) {
    return 0n;
  }
  return sumExpectedPrices(items);
}

export interface OverageResolutionInput {
  fixedTargetMinor: bigint;
  itemsTotalMinor: bigint;
  decision: FixedOverageDecision | null | undefined;
}

export interface OverageResolution {
  requiresDecision: boolean;
  resultingFixedTargetMinor: bigint;
  overageMinor: bigint;
}

export function resolveFixedOverage(input: OverageResolutionInput): OverageResolution {
  const fixedTargetMinor = assertPositiveMinor(input.fixedTargetMinor, 'fixedTargetMinor');
  const itemsTotalMinor = input.itemsTotalMinor;
  if (itemsTotalMinor < 0n) {
    throw new TargetError('itemsTotalMinor cannot be negative.');
  }

  if (itemsTotalMinor <= fixedTargetMinor) {
    return {
      requiresDecision: false,
      resultingFixedTargetMinor: fixedTargetMinor,
      overageMinor: 0n,
    };
  }

  const overageMinor = itemsTotalMinor - fixedTargetMinor;
  if (input.decision !== 'keep_target' && input.decision !== 'increase_target') {
    throw new TargetError(
      'Items exceed the fixed target. Choose keep_target or increase_target explicitly.',
    );
  }

  return {
    requiresDecision: true,
    resultingFixedTargetMinor:
      input.decision === 'increase_target' ? itemsTotalMinor : fixedTargetMinor,
    overageMinor,
  };
}

export interface TargetModeChangePreviewInput {
  currentMode: TargetMode;
  nextMode: TargetMode;
  fixedTargetMinor: bigint | null;
  items: readonly TargetItemInput[];
}

export interface TargetModeChangePreview {
  modeChanges: boolean;
  beforeTargetMinor: bigint | null;
  afterTargetMinor: bigint | null;
  beforeSetupIncomplete: boolean;
  afterSetupIncomplete: boolean;
  itemsTotalMinor: bigint;
}

export function previewTargetModeChange(
  input: TargetModeChangePreviewInput,
): TargetModeChangePreview {
  const before = calculateTarget({
    targetMode: input.currentMode,
    fixedTargetMinor: input.fixedTargetMinor,
    items: input.items,
  });
  const afterFixed =
    input.nextMode === 'fixed'
      ? (input.fixedTargetMinor ?? (before.itemsTotalMinor > 0n ? before.itemsTotalMinor : null))
      : null;

  if (input.nextMode === 'fixed' && afterFixed == null) {
    throw new TargetError(
      'Switching to fixed mode requires a positive fixed target when there are no items.',
    );
  }

  const after = calculateTarget({
    targetMode: input.nextMode,
    fixedTargetMinor: afterFixed,
    items: input.items,
  });

  return {
    modeChanges: input.currentMode !== input.nextMode,
    beforeTargetMinor: before.currentTargetMinor,
    afterTargetMinor: after.currentTargetMinor,
    beforeSetupIncomplete: before.setupIncomplete,
    afterSetupIncomplete: after.setupIncomplete,
    itemsTotalMinor: before.itemsTotalMinor,
  };
}

export function assertContributionsPerMonth(value: number): 1 | 2 {
  if (value !== 1 && value !== 2) {
    throw new TargetError('contributionsPerMonth must be 1 or 2.');
  }
  return value;
}

export function assertPreferredContribution(preferred: bigint | null | undefined): bigint | null {
  if (preferred == null) {
    return null;
  }
  return assertPositiveMinor(preferred, 'preferredContributionMinor');
}
