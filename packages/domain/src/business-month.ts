/** Canonical business months as first-of-month YYYY-MM-DD dates. */

const MONTH_PATTERN = /^(\d{4})-(\d{2})$/;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export class BusinessMonthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BusinessMonthError';
  }
}

export type BusinessMonth = string; // YYYY-MM-DD, always day 01

export function parseBusinessMonth(value: string, field = 'month'): BusinessMonth {
  const trimmed = value.trim();

  const monthMatch = MONTH_PATTERN.exec(trimmed);
  if (monthMatch) {
    const year = Number(monthMatch[1]);
    const month = Number(monthMatch[2]);
    assertValidCalendarMonth(year, month, field);
    return formatBusinessMonth(year, month);
  }

  const dateMatch = DATE_PATTERN.exec(trimmed);
  if (dateMatch) {
    const year = Number(dateMatch[1]);
    const month = Number(dateMatch[2]);
    const day = Number(dateMatch[3]);
    assertValidCalendarMonth(year, month, field);
    if (day !== 1) {
      throw new BusinessMonthError(`${field} must use the first day of the month.`);
    }
    return formatBusinessMonth(year, month);
  }

  throw new BusinessMonthError(`${field} must be YYYY-MM or YYYY-MM-01.`);
}

export function formatBusinessMonth(year: number, month: number): BusinessMonth {
  assertValidCalendarMonth(year, month, 'month');
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-01`;
}

export function toDisplayMonth(month: BusinessMonth): string {
  const parsed = parseBusinessMonth(month);
  return parsed.slice(0, 7);
}

export function compareBusinessMonths(a: BusinessMonth, b: BusinessMonth): number {
  const left = parseBusinessMonth(a);
  const right = parseBusinessMonth(b);
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

export function isBusinessMonthWithinRange(
  month: BusinessMonth,
  startMonth: BusinessMonth,
  finalMonth: BusinessMonth | null,
): boolean {
  const value = parseBusinessMonth(month);
  const start = parseBusinessMonth(startMonth);
  if (value < start) {
    return false;
  }
  if (finalMonth !== null && value > parseBusinessMonth(finalMonth)) {
    return false;
  }
  return true;
}

export function assertMonthRange(
  startMonth: string,
  finalMonth: string | null | undefined,
): { startMonth: BusinessMonth; finalMonth: BusinessMonth | null } {
  const start = parseBusinessMonth(startMonth, 'startMonth');
  if (finalMonth == null || finalMonth === '') {
    return { startMonth: start, finalMonth: null };
  }
  const final = parseBusinessMonth(finalMonth, 'finalMonth');
  if (final < start) {
    throw new BusinessMonthError('finalMonth cannot precede startMonth.');
  }
  return { startMonth: start, finalMonth: final };
}

export function assertDueMonthAllowed(
  dueMonth: string | null | undefined,
  startMonth: string,
  finalMonth: string | null | undefined,
): BusinessMonth | null {
  if (dueMonth == null || dueMonth === '') {
    return null;
  }
  const due = parseBusinessMonth(dueMonth, 'dueMonth');
  const range = assertMonthRange(startMonth, finalMonth);
  if (!isBusinessMonthWithinRange(due, range.startMonth, range.finalMonth)) {
    throw new BusinessMonthError(
      range.finalMonth
        ? 'dueMonth must fall between startMonth and finalMonth inclusive.'
        : 'dueMonth cannot precede startMonth.',
    );
  }
  return due;
}

function assertValidCalendarMonth(year: number, month: number, field: string): void {
  if (!Number.isInteger(year) || year < 1 || year > 9999) {
    throw new BusinessMonthError(`${field} year is out of range.`);
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new BusinessMonthError(`${field} month must be between 01 and 12.`);
  }
}
