import { Switch as SwitchPrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '../lib/utils.js';

export function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer inline-flex h-7 w-12 shrink-0 items-center rounded-full border border-transparent ' +
          'transition-colors duration-[var(--gt-duration-state)] ' +
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ' +
          'focus-visible:ring-offset-2 focus-visible:ring-offset-background ' +
          'disabled:cursor-not-allowed disabled:opacity-50 ' +
          'data-[state=checked]:bg-primary data-[state=unchecked]:bg-control data-[state=unchecked]:border-border',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'pointer-events-none block size-5 rounded-full bg-primary-foreground shadow ' +
            'transition-transform duration-[var(--gt-duration-state)] ' +
            'data-[state=checked]:translate-x-6 data-[state=unchecked]:translate-x-1',
        )}
      />
    </SwitchPrimitive.Root>
  );
}
