import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../lib/utils.js';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none ' +
    'disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90',
        outline: 'border border-input bg-background px-4 py-2 hover:bg-accent',
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
