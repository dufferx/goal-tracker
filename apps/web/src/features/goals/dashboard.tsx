import type { Goal, GoalList } from '@goal-tracker/contracts';
import { Badge } from '@goal-tracker/ui/components/badge';
import { Button } from '@goal-tracker/ui/components/button';
import { Card, CardContent } from '@goal-tracker/ui/components/card';
import { Skeleton } from '@goal-tracker/ui/components/skeleton';
import { Progress } from '@goal-tracker/ui/components/progress';
import { cn } from '@goal-tracker/ui/lib/utils';

import { currencyDisplayName, formatBusinessMonthLabel, formatMoney } from '../../lib/format';

function groupByCurrency(goals: Goal[]): Array<{ currency: string; goals: Goal[] }> {
  const map = new Map<string, Goal[]>();
  for (const goal of goals) {
    const list = map.get(goal.currency) ?? [];
    list.push(goal);
    map.set(goal.currency, list);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([currency, grouped]) => ({ currency, goals: grouped }));
}

function GoalCard({
  goal,
  onOpen,
  onAddItem,
}: {
  goal: Goal;
  onOpen: () => void;
  onAddItem: () => void;
}) {
  if (goal.derived.setupIncomplete) {
    return (
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-base font-semibold">{goal.name}</h3>
            <Badge variant="outline" className="text-muted-foreground">
              Setup incomplete
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-lg font-semibold leading-snug">
              Add your first item to set the target.
            </p>
            <p className="text-sm text-muted-foreground">Add an item whenever you are ready.</p>
          </div>
          <Button type="button" onClick={onAddItem}>
            Add an item
          </Button>
        </CardContent>
      </Card>
    );
  }

  const targetLabel =
    goal.derived.currentTarget == null
      ? 'Target unknown'
      : formatMoney(goal.derived.currentTarget, goal.currency);
  const windowLabel = goal.finalMonth
    ? `${formatBusinessMonthLabel(goal.startMonth)} → ${formatBusinessMonthLabel(goal.finalMonth)}`
    : `${formatBusinessMonthLabel(goal.startMonth)} → open`;
  const itemFact =
    goal.derived.itemCount === 0
      ? 'No items yet'
      : goal.derived.itemCount === 1
        ? '1 planned item'
        : `${goal.derived.itemCount} planned items`;

  return (
    <button
      type="button"
      className="w-full rounded-card text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      onClick={onOpen}
      aria-label={`Open ${goal.name}`}
    >
      <Card className="transition-colors hover:border-primary/50 hover:bg-control/30">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-base font-semibold">{goal.name}</h3>
            <Badge variant="outline" className="text-muted-foreground">
              {goal.targetMode === 'fixed' ? 'Fixed target' : 'Item target'}
            </Badge>
          </div>
          <p className="text-lg font-semibold leading-snug">{itemFact}</p>
          <p className="text-sm text-muted-foreground">
            {windowLabel}
            {goal.targetMode === 'fixed' && goal.derived.allocationState === 'overallocated'
              ? ` · Items over-allocate by ${formatMoney(goal.derived.overallocated ?? '0.00', goal.currency)}`
              : ''}
          </p>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">
              {goal.contributionsPerMonth === 1 ? 'Once a month' : 'Twice a month'}
            </span>
            <span data-money className="font-medium">
              {targetLabel}
            </span>
          </div>
          <div className="space-y-2 border-t border-hairline pt-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Funded</span>
              <span data-money>{formatMoney(goal.derived.financial.funded, goal.currency)}</span>
            </div>
            <Progress
              value={
                goal.derived.currentTarget
                  ? Math.min(
                      100,
                      (Number(goal.derived.financial.funded) / Number(goal.derived.currentTarget)) *
                        100,
                    )
                  : 0
              }
              aria-label={`${goal.name} funded progress`}
            />
            <div className="flex justify-between text-xs text-text-tertiary">
              <span>{formatMoney(goal.derived.financial.available, goal.currency)} available</span>
              <span>
                {goal.derived.financial.remaining == null
                  ? 'Target pending'
                  : `${formatMoney(goal.derived.financial.remaining, goal.currency)} remaining`}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </button>
  );
}

export function GoalsDashboard({
  list,
  loading,
  error,
  filter,
  onFilterChange,
  onRetry,
  onCreate,
  onOpenGoal,
  onOpenItems,
}: {
  list?: GoalList;
  loading: boolean;
  error?: string;
  filter: 'active' | 'archived';
  onFilterChange: (filter: 'active' | 'archived') => void;
  onRetry: () => void;
  onCreate: () => void;
  onOpenGoal: (goalId: string) => void;
  onOpenItems: (goalId: string) => void;
}) {
  const goals = filter === 'active' ? (list?.active ?? []) : (list?.archived ?? []);
  const groups = groupByCurrency(goals);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[1.75rem] font-semibold tracking-tight">
            {filter === 'archived' ? 'Goals · archived' : 'Goals'}
          </h1>
          {filter === 'archived' ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Restore a goal when you want to continue planning it.
            </p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCreate}>
            New goal
          </Button>
        </div>
      </div>

      {filter === 'archived' || (list?.archived.length ?? 0) > 0 ? (
        <div className="flex gap-2" role="tablist" aria-label="Goal lists">
          <Button
            type="button"
            role="tab"
            aria-selected={filter === 'active'}
            variant="outline"
            className={cn(
              'rounded-pill',
              filter === 'active' && 'border-primary bg-accent-surface text-foreground',
            )}
            onClick={() => onFilterChange('active')}
          >
            Active {list ? list.active.length : ''}
          </Button>
          <Button
            type="button"
            role="tab"
            aria-selected={filter === 'archived'}
            variant="outline"
            className={cn(
              'rounded-pill',
              filter === 'archived' && 'border-primary bg-accent-surface text-foreground',
            )}
            onClick={() => onFilterChange('archived')}
          >
            Archived {list ? list.archived.length : ''}
          </Button>
        </div>
      ) : null}

      {loading ? (
        <Card>
          <CardContent className="space-y-3 p-4">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-10 w-28" />
          </CardContent>
        </Card>
      ) : null}

      {!loading && error ? (
        <Card>
          <CardContent className="space-y-3 p-4">
            <h2 className="text-lg font-semibold">Could not load your goals</h2>
            <p className="text-sm text-muted-foreground">
              {error}. Nothing has changed on your account.
            </p>
            <Button type="button" onClick={onRetry}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!loading && !error && goals.length === 0 ? (
        <Card>
          <CardContent className="space-y-3 p-4">
            <h2 className="text-lg font-semibold">
              {filter === 'active' ? 'No goals yet' : 'No archived goals'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {filter === 'active'
                ? 'Start with something real you’re saving for. A target and a month is enough to begin.'
                : 'Archive a goal from its settings when you want it off the active list.'}
            </p>
            {filter === 'active' ? (
              <Button type="button" className="w-full min-h-12" onClick={onCreate}>
                Create a goal
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {!loading && !error
        ? groups.map((group) => (
            <section key={group.currency} className="space-y-3">
              <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                <h2 className="font-medium text-foreground">
                  {currencyDisplayName(group.currency)}
                </h2>
                <span data-money>
                  {group.goals.length} {group.goals.length === 1 ? 'goal' : 'goals'}
                </span>
              </div>
              <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                {group.goals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onOpen={() => onOpenGoal(goal.id)}
                    onAddItem={() => onOpenItems(goal.id)}
                  />
                ))}
              </div>
            </section>
          ))
        : null}

      {filter === 'archived' && !loading && !error && goals.length > 0 ? (
        <p className="text-sm text-muted-foreground">
          Archived goals are fully readable — items and planning — but can’t change until you
          restore them.
        </p>
      ) : null}
    </div>
  );
}
