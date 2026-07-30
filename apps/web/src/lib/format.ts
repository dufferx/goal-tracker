const monthFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatMoney(amount: string, currency: string): string {
  const parts = amount.split('.');
  const whole = parts[0] ?? '0';
  const fraction = parts[1] ?? '00';
  const negative = whole.startsWith('-');
  const digits = (negative ? whole.slice(1) : whole).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const compact = fraction === '00' ? digits : `${digits}.${fraction.padEnd(2, '0').slice(0, 2)}`;
  try {
    const symbol =
      new Intl.NumberFormat('en', { style: 'currency', currency, currencyDisplay: 'narrowSymbol' })
        .formatToParts(0)
        .find((part) => part.type === 'currency')?.value ?? currency;
    return `${negative ? '-' : ''}${symbol}${compact}`;
  } catch {
    return `${negative ? '-' : ''}${currency} ${compact}`;
  }
}

export function formatBusinessMonthLabel(month: string): string {
  const value = month.length === 7 ? `${month}-01` : month;
  return monthFormatter.format(new Date(`${value}T00:00:00.000Z`));
}

export function currencyDisplayName(code: string): string {
  try {
    return new Intl.DisplayNames(['en'], { type: 'currency' }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** Convert a user decimal input into a contract money string. */
export function normalizeMoneyInput(value: string): string {
  const trimmed = value.trim().replace(/,/g, '');
  if (!trimmed) return '';
  if (!/^\d+(\.\d{0,2})?$/.test(trimmed)) return trimmed;
  const [whole, fraction = ''] = trimmed.split('.');
  return `${whole}.${fraction.padEnd(2, '0').slice(0, 2)}`;
}

export function formatMoneyInput(value: string): string {
  const normalized = value.replace(/,/g, '');
  const [whole = '', fraction] = normalized.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (!fraction || /^0+$/.test(fraction)) return grouped;
  return `${grouped}.${fraction.slice(0, 2)}`;
}

export function monthOptions(fromYear = 2024, years = 8): Array<{ value: string; label: string }> {
  const options: Array<{ value: string; label: string }> = [];
  for (let year = fromYear; year < fromYear + years; year += 1) {
    for (let month = 1; month <= 12; month += 1) {
      const value = `${year}-${String(month).padStart(2, '0')}`;
      options.push({ value, label: formatBusinessMonthLabel(value) });
    }
  }
  return options;
}
