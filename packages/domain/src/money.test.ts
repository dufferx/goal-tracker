import { describe, expect, it } from 'vitest';

import {
  MAX_MONEY_MINOR,
  MoneyError,
  addMinor,
  assertPositiveMinor,
  parseMoneyString,
  percentageOfFixedTarget,
  serializeMoney,
} from './money.js';

describe('parseMoneyString', () => {
  it.each([
    ['0', 0n],
    ['12', 1_200n],
    ['12.3', 1_230n],
    ['12.34', 1_234n],
    [' 3000.01 ', 300_001n],
    ['-0.01', -1n],
    ['-42.50', -4_250n],
    ['90071992547409.91', MAX_MONEY_MINOR],
  ])('parses %j into integer minor units', (value, expected) => {
    expect(parseMoneyString(value)).toBe(expected);
  });

  it.each([
    '',
    '1.',
    '.50',
    '1.234',
    '1,00',
    '+1.00',
    'NaN',
    'Infinity',
    '90071992547409.92',
    '-90071992547409.92',
  ])('rejects invalid or out-of-range value %j', (value) => {
    expect(() => parseMoneyString(value)).toThrow(MoneyError);
  });
});

describe('serializeMoney', () => {
  it.each([
    [0n, '0.00'],
    [1n, '0.01'],
    [1_230n, '12.30'],
    [-1n, '-0.01'],
    [MAX_MONEY_MINOR, '90071992547409.91'],
    [-MAX_MONEY_MINOR, '-90071992547409.91'],
  ])('serializes %s without precision loss', (amount, expected) => {
    const serialized = serializeMoney(amount);

    expect(serialized).toBe(expected);
    expect(typeof serialized).toBe('string');
    expect(parseMoneyString(serialized)).toBe(amount);
  });

  it.each([MAX_MONEY_MINOR + 1n, -MAX_MONEY_MINOR - 1n])(
    'rejects out-of-range amount %s',
    (amount) => {
      expect(() => serializeMoney(amount)).toThrow(MoneyError);
    },
  );
});

describe('minor-unit validation and arithmetic', () => {
  it.each([1n, 100n, MAX_MONEY_MINOR])('accepts positive amount %s', (amount) => {
    expect(assertPositiveMinor(amount)).toBe(amount);
  });

  it.each([0n, -1n, MAX_MONEY_MINOR + 1n])(
    'rejects non-positive or excessive amount %s',
    (amount) => {
      expect(() => assertPositiveMinor(amount, 'deposit')).toThrow(MoneyError);
    },
  );

  it.each([
    [[], 0n],
    [[1n, 2n, 3n], 6n],
    [[MAX_MONEY_MINOR, -1n], MAX_MONEY_MINOR - 1n],
    [[-10n, 3n], -7n],
  ] as const)('adds minor-unit values safely %#', (amounts, expected) => {
    expect(addMinor(...amounts)).toBe(expected);
  });

  it.each([[[MAX_MONEY_MINOR, 1n]], [[-MAX_MONEY_MINOR, -1n]]] as const)(
    'rejects an overflowing sum %#',
    (amounts) => {
      expect(() => addMinor(...amounts)).toThrow(MoneyError);
    },
  );
});

describe('percentageOfFixedTarget', () => {
  it.each([
    [10_000n, 25, 2_500n],
    [10_000n, 12.5, 1_250n],
    [9_999n, 100, 9_999n],
  ])('converts %s at %s%% to %s', (target, percent, expected) => {
    expect(percentageOfFixedTarget(target, percent)).toBe(expected);
  });

  it.each([0, -1, 100.01, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid percentage %s',
    (percent) => {
      expect(() => percentageOfFixedTarget(10_000n, percent)).toThrow(MoneyError);
    },
  );
});
