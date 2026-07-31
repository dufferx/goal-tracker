import { describe, expect, it } from 'vitest';

import {
  BusinessMonthError,
  addBusinessMonths,
  assertDueMonthAllowed,
  assertMonthRange,
  compareBusinessMonths,
  diffBusinessMonths,
  parseBusinessMonth,
  toDisplayMonth,
} from './business-month.js';

describe('parseBusinessMonth', () => {
  it.each([
    ['2026-01', '2026-01-01'],
    ['2026-12-01', '2026-12-01'],
    [' 2027-03 ', '2027-03-01'],
    ['0001-01', '0001-01-01'],
    ['9999-12-01', '9999-12-01'],
  ])('canonicalizes %j to %j', (input, expected) => {
    expect(parseBusinessMonth(input)).toBe(expected);
  });

  it.each([
    '2026-01-02',
    '2026-01-31',
    '2026-00',
    '2026-13',
    '0000-01',
    '10000-01',
    '2026-1',
    '26-01',
    '2026/01',
    '',
  ])('rejects invalid business month %j', (input) => {
    expect(() => parseBusinessMonth(input)).toThrow(BusinessMonthError);
  });

  it.each([
    ['2026-01-01', '2026-01'],
    ['2026-12-01', '2026-12'],
  ])('formats %j for display', (input, expected) => {
    expect(toDisplayMonth(input)).toBe(expected);
  });
});

describe('business month comparison', () => {
  it.each([
    ['2026-01-01', '2026-02-01', -1],
    ['2026-02-01', '2026-02-01', 0],
    ['2027-01-01', '2026-12-01', 1],
  ])('compares %s with %s', (left, right, expectedSign) => {
    expect(Math.sign(compareBusinessMonths(left, right))).toBe(expectedSign);
  });
});

describe('planning month ranges', () => {
  it.each([
    ['2026-01', null, { startMonth: '2026-01-01', finalMonth: null }],
    ['2026-01-01', '', { startMonth: '2026-01-01', finalMonth: null }],
    ['2026-01', '2026-12', { startMonth: '2026-01-01', finalMonth: '2026-12-01' }],
    ['2026-06', '2026-06-01', { startMonth: '2026-06-01', finalMonth: '2026-06-01' }],
  ])('accepts start %s and final %s', (start, final, expected) => {
    expect(assertMonthRange(start, final)).toEqual(expected);
  });

  it.each([
    ['2026-02', '2026-01'],
    ['2027-01', '2026-12'],
  ])('rejects final %s before start %s', (start, final) => {
    expect(() => assertMonthRange(start, final)).toThrow('finalMonth cannot precede startMonth.');
  });

  it.each([
    ['2026-01', '2026-01', '2026-12', '2026-01-01'],
    ['2026-12-01', '2026-01-01', '2026-12-01', '2026-12-01'],
    [null, '2026-01', '2026-12', null],
    ['', '2026-01', null, null],
  ])('accepts due month %s inside the range', (due, start, final, expected) => {
    expect(assertDueMonthAllowed(due, start, final)).toBe(expected);
  });

  it.each([
    ['2025-12', '2026-01', '2026-12'],
    ['2027-01', '2026-01', '2026-12'],
    ['2025-12', '2026-01', null],
  ])('rejects due month %s outside %s through %s', (due, start, final) => {
    expect(() => assertDueMonthAllowed(due, start, final)).toThrow(BusinessMonthError);
  });
});

describe('addBusinessMonths', () => {
  it.each([
    ['2026-01-01', 0, '2026-01-01'],
    ['2026-01-01', 1, '2026-02-01'],
    ['2026-11-01', 2, '2027-01-01'],
    ['2026-12-01', 1, '2027-01-01'],
    ['2027-01-01', -1, '2026-12-01'],
    ['2026-06-01', -6, '2025-12-01'],
    ['2026-07-01', 14, '2027-09-01'],
  ])('shifts %s by %i months to %s', (month, count, expected) => {
    expect(addBusinessMonths(month, count)).toBe(expected);
  });

  it('rejects fractional shifts', () => {
    expect(() => addBusinessMonths('2026-01-01', 1.5)).toThrow(BusinessMonthError);
  });
});

describe('diffBusinessMonths', () => {
  it.each([
    ['2026-01-01', '2026-01-01', 0],
    ['2026-01-01', '2026-03-01', 2],
    ['2026-11-01', '2027-02-01', 3],
    ['2027-02-01', '2026-11-01', -3],
    ['2026-07-01', '2026-08-01', 1],
  ])('counts %i months from %s to %s', (from, to, expected) => {
    expect(diffBusinessMonths(from, to)).toBe(expected);
  });
});
