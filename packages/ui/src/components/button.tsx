import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../lib/utils.js';

const buttonVariants = cva(
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-control text-sm font-semibold ' +
    'transition-colors duration-[var(--gt-duration-state)] focus-visible:outline-none ' +
    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ' +
    'focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90',
        outline:
          'border border-input bg-control px-4 py-2 text-foreground hover:bg-accent hover:text-accent-foreground',
        ghost: 'px-3 py-2 text-primary hover:bg-accent',
        danger: 'bg-destructive px-4 py-2 text-primary-foreground hover:bg-destructive/90',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ asChild = false, className, variant, ...props }: ButtonProps) {
  const Component = asChild ? Slot : 'button';

  return <Component className={cn(buttonVariants({ variant }), className)} {...props} />;
}
