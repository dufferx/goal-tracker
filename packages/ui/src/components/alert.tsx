import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../lib/utils.js';

const alertVariants = cva('rounded-inner border px-3.5 py-3 text-sm', {
  variants: {
    variant: {
      default: 'border-border bg-surface text-foreground',
      error: 'border-danger-border bg-danger-surface text-foreground',
      success: 'border-accent-border bg-accent-surface text-foreground',
    },
  },
  defaultVariants: { variant: 'default' },
});

export function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

export function AlertTitle({ className, ...props }: React.ComponentProps<'h3'>) {
  return <h3 className={cn('mb-1 font-semibold', className)} {...props} />;
}

export function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('leading-6 text-text-secondary', className)} {...props} />;
}
