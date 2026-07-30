import { CheckIcon, CircleIcon } from 'lucide-react';
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '../lib/utils.js';

export function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn('grid gap-3', className)}
      {...props}
    />
  );
}

export function RadioGroupItem({
  className,
  children,
  presentation = 'radio',
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item> & {
  presentation?: 'radio' | 'card';
}) {
  if (presentation === 'card') {
    return (
      <RadioGroupPrimitive.Item
        data-slot="radio-group-item"
        className={cn(
          'relative min-h-[6.25rem] w-full rounded-card border border-border bg-control p-4 text-left ' +
            'outline-none transition-colors duration-[var(--gt-duration-state)] ' +
            'hover:border-border-strong data-[state=checked]:border-primary ' +
            'data-[state=checked]:bg-accent-surface focus-visible:ring-2 focus-visible:ring-ring ' +
            'focus-visible:ring-offset-2 focus-visible:ring-offset-background ' +
            'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      >
        {children}
        <RadioGroupPrimitive.Indicator className="absolute right-3 top-3 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
          <CheckIcon aria-hidden="true" className="size-3.5 stroke-[3]" />
        </RadioGroupPrimitive.Indicator>
      </RadioGroupPrimitive.Item>
    );
  }

  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        'aspect-square size-5 shrink-0 rounded-full border border-input bg-control text-primary ' +
          'outline-none transition-colors duration-[var(--gt-duration-state)] ' +
          'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35 ' +
          'disabled:cursor-not-allowed disabled:opacity-50 ' +
          'aria-invalid:border-status-behind aria-invalid:ring-status-behind/25',
        className,
      )}
      {...props}
    >
      {children}
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="relative flex items-center justify-center"
      >
        <CircleIcon
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 fill-primary"
        />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}
