import { Button } from '@goal-tracker/ui/components/button';
import { cn } from '@goal-tracker/ui/lib/utils';
import {
  ArrowLeft,
  Diamond,
  History,
  ListChecks,
  Pencil,
  Plus,
  Settings,
  SlidersHorizontal,
} from 'lucide-react';
import type { ReactNode } from 'react';

type ProductRail = {
  kind: 'product';
  activeCount?: number;
  archivedCount?: number;
};

type GoalRail = {
  kind: 'goal';
  active: 'overview' | 'items' | 'history' | 'simulator' | 'edit';
  onAllGoals: () => void;
  onOverview: () => void;
  onItems: () => void;
  onHistory: () => void;
  onSimulator: () => void;
  onEdit: () => void;
};

export type AppRail = ProductRail | GoalRail;

export function AppShell({
  children,
  active,
  onNavigateGoals,
  onNavigateSettings,
  onAddContribution,
  rail = { kind: 'product' },
  contentMode = 'standard',
  showMobileNavigation = true,
}: {
  children: ReactNode;
  active: 'goals' | 'settings';
  onNavigateGoals: () => void;
  onNavigateSettings: () => void;
  onAddContribution?: () => void;
  rail?: AppRail;
  contentMode?: 'standard' | 'edge';
  showMobileNavigation?: boolean;
}) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-control bg-primary px-4 py-3 font-medium text-primary-foreground transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>
      <div
        className={cn(
          'mx-auto flex min-h-dvh w-full flex-col lg:max-w-[var(--layout-content-max)] lg:flex-row lg:gap-8 lg:px-6 lg:pb-8',
          contentMode === 'standard'
            ? 'max-w-[28rem] px-4 pb-28 pt-6 md:max-w-[56rem] md:px-6'
            : 'max-w-none px-0 pb-0 pt-0',
        )}
      >
        <aside className="hidden w-[var(--layout-rail)] shrink-0 border-r border-hairline pr-4 pt-6 lg:flex lg:flex-col">
          <div className="flex items-center gap-2 text-base font-semibold">
            <span className="size-7 rounded-[7px] bg-primary" aria-hidden />
            Goal Tracker
          </div>
          {rail.kind === 'product' ? (
            <ProductNavigation
              active={active}
              activeCount={rail.activeCount}
              archivedCount={rail.archivedCount}
              onNavigateGoals={onNavigateGoals}
              onNavigateSettings={onNavigateSettings}
              onAddContribution={onAddContribution}
            />
          ) : (
            <GoalNavigation rail={rail} />
          )}
        </aside>
        <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 outline-none lg:pt-6">
          {children}
        </main>
      </div>

      {showMobileNavigation ? (
        <MobileNavigation
          active={active}
          onNavigateGoals={onNavigateGoals}
          onNavigateSettings={onNavigateSettings}
          onAddContribution={onAddContribution}
        />
      ) : null}
    </div>
  );
}

function ProductNavigation({
  active,
  activeCount,
  archivedCount,
  onNavigateGoals,
  onNavigateSettings,
  onAddContribution,
}: {
  active: 'goals' | 'settings';
  activeCount?: number;
  archivedCount?: number;
  onNavigateGoals: () => void;
  onNavigateSettings: () => void;
  onAddContribution?: () => void;
}) {
  return (
    <>
      {onAddContribution ? (
        <Button type="button" className="mt-5 w-full" onClick={onAddContribution}>
          Add contribution
        </Button>
      ) : null}
      <nav className="mt-4 space-y-1" aria-label="Primary">
        <Button
          type="button"
          variant="ghost"
          aria-current={active === 'goals' ? 'page' : undefined}
          className={cn('w-full justify-start', active === 'goals' && 'bg-control text-foreground')}
          onClick={onNavigateGoals}
        >
          <Diamond className="size-4" aria-hidden /> Goals
        </Button>
        <Button
          type="button"
          variant="ghost"
          aria-current={active === 'settings' ? 'page' : undefined}
          className={cn(
            'w-full justify-start',
            active === 'settings' && 'bg-control text-foreground',
          )}
          onClick={onNavigateSettings}
        >
          <Settings className="size-4" aria-hidden /> Settings
        </Button>
      </nav>
      {activeCount != null || archivedCount != null ? (
        <dl className="mt-6 space-y-3 border-t border-hairline pt-5 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-text-secondary">Active</dt>
            <dd data-money>{activeCount ?? 0}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-text-secondary">Archived</dt>
            <dd data-money>{archivedCount ?? 0}</dd>
          </div>
        </dl>
      ) : null}
    </>
  );
}

function GoalNavigation({ rail }: { rail: GoalRail }) {
  const entries = [
    ['overview', 'Overview', Diamond, rail.onOverview],
    ['items', 'Items', ListChecks, rail.onItems],
    ['history', 'History', History, rail.onHistory],
    ['simulator', 'Simulator', SlidersHorizontal, rail.onSimulator],
    ['edit', 'Edit goal', Pencil, rail.onEdit],
  ] as const;
  return (
    <>
      <Button
        variant="ghost"
        className="mt-5 w-full justify-start px-1 text-text-secondary"
        onClick={rail.onAllGoals}
      >
        <ArrowLeft className="size-4" aria-hidden /> All goals
      </Button>
      <nav className="mt-3 space-y-1" aria-label="Goal">
        {entries.map(([key, label, Icon, onClick]) => (
          <Button
            key={key}
            type="button"
            variant="ghost"
            aria-current={rail.active === key ? 'page' : undefined}
            className={cn(
              'w-full justify-start',
              rail.active === key && 'bg-control text-foreground',
            )}
            onClick={onClick}
          >
            <Icon className="size-4" aria-hidden /> {label}
          </Button>
        ))}
      </nav>
    </>
  );
}

export function MobileNavigation({
  active,
  onNavigateGoals,
  onNavigateSettings,
  onAddContribution,
}: {
  active: 'goals' | 'settings';
  onNavigateGoals: () => void;
  onNavigateSettings: () => void;
  onAddContribution?: () => void;
}) {
  return (
    <nav
      aria-label="Mobile"
      className={cn(
        'fixed inset-x-0 bottom-4 z-40 mx-auto grid w-[min(100%-2rem,24rem)] items-center rounded-tabbar border border-border bg-raised/95 px-3 py-2 shadow-tabbar backdrop-blur lg:hidden',
        onAddContribution ? 'grid-cols-[1fr_auto_1fr]' : 'grid-cols-2',
      )}
    >
      <Button
        type="button"
        variant="ghost"
        className={cn(
          'min-h-12 flex-col gap-1 px-3 text-xs',
          active === 'goals' ? 'text-primary' : 'text-muted-foreground',
        )}
        aria-current={active === 'goals' ? 'page' : undefined}
        onClick={onNavigateGoals}
      >
        <Diamond className="size-4" aria-hidden />
        Goals
      </Button>
      {onAddContribution ? (
        <Button
          type="button"
          className="size-14 shrink-0 rounded-full p-0 shadow-sheet"
          onClick={onAddContribution}
          aria-label="Add contribution"
        >
          <Plus className="size-6" aria-hidden />
        </Button>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        className={cn(
          'min-h-12 flex-col gap-1 px-3 text-xs',
          active === 'settings' ? 'text-primary' : 'text-muted-foreground',
        )}
        aria-current={active === 'settings' ? 'page' : undefined}
        onClick={onNavigateSettings}
      >
        <Settings className="size-4" aria-hidden />
        Settings
      </Button>
    </nav>
  );
}
