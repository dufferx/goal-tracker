import { Button } from '@goal-tracker/ui/components/button';
import { cn } from '@goal-tracker/ui/lib/utils';
import { Diamond, Settings } from 'lucide-react';
import type { ReactNode } from 'react';

export function AppShell({
  children,
  active,
  onNavigateGoals,
  onNavigateSettings,
}: {
  children: ReactNode;
  active: 'goals' | 'settings';
  onNavigateGoals: () => void;
  onNavigateSettings: () => void;
}) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto flex min-h-dvh w-full max-w-[28rem] flex-col px-4 pb-28 pt-6 md:max-w-[80rem] md:flex-row md:gap-8 md:px-6 md:pb-8">
        <aside className="mb-6 hidden w-[14.75rem] shrink-0 md:block">
          <p className="text-lg font-semibold">Goal Tracker</p>
          <nav className="mt-6 space-y-2" aria-label="Primary">
            <Button
              type="button"
              variant={active === 'goals' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={onNavigateGoals}
            >
              Goals
            </Button>
            <Button
              type="button"
              variant={active === 'settings' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={onNavigateSettings}
            >
              Settings
            </Button>
          </nav>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <nav
        aria-label="Mobile"
        className="fixed inset-x-0 bottom-4 z-40 mx-auto grid w-[min(100%-2rem,24rem)] grid-cols-2 items-center rounded-tabbar border border-border bg-raised/95 px-4 py-2 shadow-tabbar backdrop-blur md:hidden"
      >
        <Button
          type="button"
          variant="ghost"
          className={cn(
            'min-h-12 flex-col gap-1 px-3 text-xs',
            active === 'goals' ? 'text-primary' : 'text-muted-foreground',
          )}
          onClick={onNavigateGoals}
        >
          <Diamond className="size-4" aria-hidden />
          Goals
        </Button>
        <Button
          type="button"
          variant="ghost"
          className={cn(
            'min-h-12 flex-col gap-1 px-3 text-xs',
            active === 'settings' ? 'text-primary' : 'text-muted-foreground',
          )}
          onClick={onNavigateSettings}
        >
          <Settings className="size-4" aria-hidden />
          Settings
        </Button>
      </nav>
    </div>
  );
}
