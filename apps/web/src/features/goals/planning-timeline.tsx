import type { GoalDetail } from '@goal-tracker/contracts';
import { Button } from '@goal-tracker/ui/components/button';
import { Card, CardContent } from '@goal-tracker/ui/components/card';
import { Progress } from '@goal-tracker/ui/components/progress';
import { Check } from 'lucide-react';

import { formatBusinessMonthLabel, formatMoney } from '../../lib/format';

function obligationTotal(progress: string | null, required: string): string {
  const toMinor = (value: string) => {
    const [whole = '0', fraction = ''] = value.split('.');
    return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0').slice(0, 2));
  };
  const minor = toMinor(progress ?? '0.00') + toMinor(required);
  return `${minor / 100n}.${String(minor % 100n).padStart(2, '0')}`;
}

function progressPercent(progress: string | null, required: string): number {
  const funded = Number(progress ?? 0);
  const total = funded + Number(required);
  return total > 0 ? Math.min(100, (funded / total) * 100) : 0;
}

/** Goal-specific planning composite. It presents authoritative guidance and owns no rules. */
export function PlanningTimeline({
  goal,
  onOpenItems,
}: {
  goal: GoalDetail;
  onOpenItems: () => void;
}) {
  const { guidance } = goal;
  const recommendation = guidance.recommendation;
  const obligation = guidance.obligation;
  const activeDatedMonth = obligation?.kind === 'dated_items' ? obligation.dueMonth : null;
  const completedDatedItems = goal.items
    .filter((item) => item.dueMonth != null)
    .filter(
      (item) =>
        item.purchase != null ||
        guidance.fullyFunded ||
        activeDatedMonth == null ||
        item.dueMonth! < activeDatedMonth,
    )
    .sort(
      (left, right) =>
        left.dueMonth!.localeCompare(right.dueMonth!) || left.position - right.position,
    );
  const showEnding = goal.finalMonth != null || guidance.forecastMonth != null;

  if (!recommendation && !obligation && !goal.finalMonth && !guidance.forecastMonth) return null;

  return (
    <Card role="region" aria-labelledby="planning-timeline-title">
      <CardContent className="p-4">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 id="planning-timeline-title" className="text-sm font-medium text-text-secondary">
            Planning timeline
          </h2>
          {goal.items.length ? (
            <Button variant="ghost" className="min-h-9 px-2 text-sm" onClick={onOpenItems}>
              All items
            </Button>
          ) : null}
        </div>

        <div className="grid grid-cols-[12px_1fr] gap-x-3">
          <div className="flex flex-col items-center">
            <span className="mt-1 size-2.5 rounded-full bg-primary" />
            <span className="w-px flex-1 bg-border" />
          </div>
          <div className="pb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">
              Now · {formatBusinessMonthLabel(guidance.asOfMonth)}
            </p>
            {recommendation ? (
              <p className="mt-2 text-sm">
                Next contribution ·{' '}
                <strong data-money>
                  {formatMoney(recommendation.perContribution, goal.currency)}
                </strong>
              </p>
            ) : null}
          </div>

          {completedDatedItems.map((item) => (
            <div key={item.id} className="contents">
              <div className="flex flex-col items-center">
                <span className="mt-4 grid size-4 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Check aria-hidden="true" className="size-3" />
                </span>
                <span className="w-px flex-1 bg-border" />
              </div>
              <div className="pb-4">
                <div className="rounded-inner border border-accent-border bg-accent-surface/40 p-3">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-medium text-primary">
                      {formatBusinessMonthLabel(item.dueMonth!)}
                    </span>
                    <span data-money className="text-text-secondary">
                      {formatMoney(item.purchase?.actualPrice ?? item.expectedPrice, goal.currency)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p className="font-semibold">{item.name}</p>
                    <span className="text-xs font-semibold text-primary">
                      {item.purchase ? 'Purchased' : 'Funded'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {obligation?.kind === 'dated_items' ? (
            <>
              <div className="flex flex-col items-center">
                <span className="mt-5 size-3 rounded-full border-2 border-primary bg-surface" />
                <span className="w-px flex-1 bg-border" />
              </div>
              <div className="pb-4">
                <div className="rounded-inner border border-border bg-control/40 p-3">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-medium text-primary">
                      {formatBusinessMonthLabel(obligation.dueMonth)}
                    </span>
                    <span data-money className="text-text-secondary">
                      {formatMoney(
                        obligationTotal(guidance.progress, obligation.required),
                        goal.currency,
                      )}
                    </span>
                  </div>
                  <p className="mt-2 font-semibold">{obligation.itemNames.join(', ')}</p>
                  <Progress
                    className="mt-3"
                    value={progressPercent(guidance.progress, obligation.required)}
                    aria-label={`${Math.round(progressPercent(guidance.progress, obligation.required))}% funded for this obligation`}
                  />
                  <p className="mt-2 text-xs text-text-secondary">
                    {formatMoney(guidance.progress ?? '0.00', goal.currency)} funded ·{' '}
                    {formatMoney(obligation.required, goal.currency)} remaining ·{' '}
                    {obligation.remainingOpportunities} contributions
                  </p>
                </div>
              </div>
            </>
          ) : null}

          {showEnding ? (
            <>
              <div className="flex flex-col items-center">
                <span className="mt-1 size-2 rounded-full bg-text-tertiary" />
              </div>
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-text-tertiary">
                      {formatBusinessMonthLabel(goal.finalMonth ?? guidance.forecastMonth!)}
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      {goal.finalMonth ? 'Final target' : 'Forecast finish'}
                    </p>
                  </div>
                  {guidance.target ? (
                    <span className="text-sm text-text-secondary" data-money>
                      {formatMoney(guidance.target, goal.currency)}
                    </span>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
