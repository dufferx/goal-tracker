/** Integer minor-unit money helpers. Domain uses bigint; JSON uses decimal strings. */

export const MAX_MONEY_MINOR = 9_007_199_254_740_991n; // Number.MAX_SAFE_INTEGER

export class MoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MoneyError';
  }
}

export function assertPositiveMinor(amount: bigint, field = 'amount'): bigint {
  if (amount <= 0n) {
    throw new MoneyError(`${field} must be a positive integer minor amount.`);
  }
  if (amount > MAX_MONEY_MINOR) {
    throw new MoneyError(`${field} exceeds the supported integer minor-unit range.`);
  }
  return amount;
}

export function assertNonNegativeMinor(amount: bigint, field = 'amount'): bigint {
  if (amount < 0n) {
    throw new MoneyError(`${field} cannot be negative.`);
  }
  if (amount > MAX_MONEY_MINOR) {
    throw new MoneyError(`${field} exceeds the supported integer minor-unit range.`);
  }
  return amount;
}

/** Parse a decimal money string (e.g. "12.34", "3000") into integer minor units. */
export function parseMoneyString(value: string, field = 'amount'): bigint {
  const trimmed = value.trim();
  if (!/^-?\d+(\.\d{1,2})?$/.test(trimmed)) {
    throw new MoneyError(`${field} must be a decimal amount with up to two fractional digits.`);
  }

  const negative = trimmed.startsWith('-');
  const unsigned = negative ? trimmed.slice(1) : trimmed;
  const [wholePart = '', fractionPart = ''] = unsigned.split('.');
  const minor = BigInt(wholePart) * 100n + BigInt(fractionPart.padEnd(2, '0'));
  const signed = negative ? -minor : minor;

  if (signed > MAX_MONEY_MINOR || signed < -MAX_MONEY_MINOR) {
    throw new MoneyError(`${field} exceeds the supported integer minor-unit range.`);
  }

  return signed;
}

/** Serialize integer minor units to a decimal string without scientific notation. */
export function serializeMoney(amount: bigint): string {
  if (amount > MAX_MONEY_MINOR || amount < -MAX_MONEY_MINOR) {
    throw new MoneyError('amount exceeds the supported integer minor-unit range.');
  }

  const negative = amount < 0n;
  const absolute = negative ? -amount : amount;
  const whole = absolute / 100n;
  const fraction = (absolute % 100n).toString().padStart(2, '0');
  return `${negative ? '-' : ''}${whole.toString()}.${fraction}`;
}

export function addMinor(...amounts: bigint[]): bigint {
  let total = 0n;
  for (const amount of amounts) {
    total += amount;
    if (total > MAX_MONEY_MINOR || total < -MAX_MONEY_MINOR) {
      throw new MoneyError('Sum exceeds the supported integer minor-unit range.');
    }
  }
  return total;
}

export function percentageOfFixedTarget(fixedTargetMinor: bigint, percent: number): bigint {
  assertPositiveMinor(fixedTargetMinor, 'fixedTargetMinor');
  if (!Number.isFinite(percent) || percent <= 0 || percent > 100) {
    throw new MoneyError('percent must be greater than 0 and at most 100.');
  }

  // Convert immediately; never persist the percentage itself.
  const scaled = (fixedTargetMinor * BigInt(Math.round(percent * 100))) / 10_000n;
  return assertPositiveMinor(scaled, 'convertedAmount');
}
