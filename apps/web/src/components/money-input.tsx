import { Input } from '@goal-tracker/ui/components/input';
import type { ComponentProps } from 'react';

function currencySymbol(currency: string): string {
  try {
    return (
      new Intl.NumberFormat('en', {
        style: 'currency',
        currency,
        currencyDisplay: 'narrowSymbol',
      })
        .formatToParts(0)
        .find((part) => part.type === 'currency')?.value ?? currency
    );
  } catch {
    return currency;
  }
}

export function MoneyInput({
  currency,
  className,
  ...props
}: Omit<ComponentProps<typeof Input>, 'type'> & { currency: string }) {
  return (
    <div
      className={`flex min-h-16 items-center rounded-input border border-input bg-control px-4 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/35 ${className ?? ''}`}
    >
      <span className="mr-2 text-sm text-text-tertiary">{currency}</span>
      <span className="sr-only">{currencySymbol(currency)}</span>
      <Input
        {...props}
        inputMode="decimal"
        className="min-h-0 border-0 bg-transparent px-0 !text-[2rem] font-semibold tabular-nums tracking-tight focus-visible:ring-0"
      />
    </div>
  );
}
