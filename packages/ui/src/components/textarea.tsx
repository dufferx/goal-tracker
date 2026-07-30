import * as React from 'react';

import { cn } from '../lib/utils.js';

export function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex min-h-24 w-full rounded-input border border-input bg-control px-3.5 py-2 text-base ' +
          'text-foreground outline-none transition-colors duration-[var(--gt-duration-state)] ' +
          'placeholder:text-text-tertiary ' +
          'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35 ' +
          'disabled:cursor-not-allowed disabled:opacity-50 ' +
          'aria-invalid:border-status-behind aria-invalid:ring-status-behind/25',
        className,
      )}
      {...props}
    />
  );
}
