import * as React from 'react';

import { cn } from '../lib/utils.js';

export function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse rounded-control bg-control motion-reduce:animate-none',
        className,
      )}
      {...props}
    />
  );
}
