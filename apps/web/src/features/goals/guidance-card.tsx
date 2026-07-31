import type { GoalDetail, Guidance, PaceStatus } from '@goal-tracker/contracts';
import { Button } from '@goal-tracker/ui/components/button';
import { Card, CardContent } from '@goal-tracker/ui/components/card';

import { formatBusinessMonthLabel, formatMoney } from '../../lib/format';

const STATUS_PRESENTATION: Record<PaceStatus, { label: string; tone: string; dot: string }> = {
  ahead: { label: 'Ahead', tone: 'text-status-ahead', dot: 'bg-status-ahead' },
  on_track: { label: 'On track', tone: 'text-status-on-track', dot: 'bg-status-on-track' },
  at_risk: { label: 'At risk', tone: 'text-status-at-risk', dot: 'bg-status-at-risk' },
  behind: { label: 'Behind', tone: 'text-status-behind', dot: 'bg-status-behind' },
};

function frequencyText(contributionsPerMonth: 1 | 2): string {
  return contributionsPerMonth === 2 ? 'twice' : 'once';
}

function contributionCountText(count: number): string {
  return count === 1 ? '1 contribution' : `${count} contributions`;
}

function longMonth(month: string): string {
  return new Intl.DateTimeFormat(undefined, { month: 'long', timeZone: 'UTC' }).format(
    new Date(`${month}-01T00:00:00Z`),
  );
}

function headline(guidance: Guidance, currency: string): string | null {
  const { explanation, recommendation } = guidance;
  switch (explanation.code) {
    case 'fully_funded':
      return 'Fully funded.';
    case 'setup_incomplete':
      return 'Finish the setup to see your pace.';
    case 'behind_deadline':
      return explanation.required
        ? `Add ${formatMoney(explanation.required, currency)} to catch up.`
        : 'This deadline needs attention.';
    case 'no_pace':
      return "There's no deadline and no preferred amount, so there's no pace to measure.";
    case 'open_goal_forecast':
    case 'pace_delta':
      return recommendation
        ? `Add ${formatMoney(recommendation.perContribution, currency)} ${frequencyText(recommendation.contributionsPerMonth)} this month.`
        : null;
  }
}

function explanationText(guidance: Guidance, currency: string): string | null {
  const { explanation, status } = guidance;
  switch (explanation.code) {
    case 'fully_funded':
      return 'Funded money covers the target. Purchases never reduce it.';
    case 'setup_incomplete':
      return 'This goal gets its target from items. Add one to see a target, remaining money, and pace.';
    case 'behind_deadline':
      return explanation.required && explanation.dueMonth
        ? `${formatMoney(explanation.required, currency)} was due in ${formatBusinessMonthLabel(explanation.dueMonth)} and is still needed.`
        : null;
    case 'pace_delta': {
      const delta = explanation.delta ? Number(explanation.delta) : 0;
      const absolute = formatMoney(explanation.delta?.replace('-', '') ?? '0.00', currency);
      if (status === 'at_risk') {
        return `You're ${absolute} below the expected pace — that's at least one contribution behind.`;
      }
      if (status === 'ahead') {
        return `You're ${absolute} ahead of the expected pace.`;
      }
      if (delta < 0) {
        return `You're ${absolute} below the expected pace, which is still within one contribution.`;
      }
      if (delta > 0) {
        return `You're ${absolute} above the expected pace, still within one contribution.`;
      }
      return "You're right on the expected pace.";
    }
    case 'open_goal_forecast':
      return explanation.forecastMonth
        ? `At this pace you reach the target in ${formatBusinessMonthLabel(explanation.forecastMonth)}.`
        : 'Your funded money already covers the target.';
    case 'no_pace':
      return 'Totals remain exact. Add a due month, final month or preferred contribution to establish a pace.';
  }
}

export function GuidanceCard({
  goal,
  onAddContribution,
  onEditGoal,
  onOpenItems,
  embedded = false,
}: {
  goal: GoalDetail;
  onAddContribution: () => void;
  onEditGoal: () => void;
  onOpenItems: () => void;
  embedded?: boolean;
}) {
  const { guidance, currency } = goal;
  const status = guidance.status ? STATUS_PRESENTATION[guidance.status] : null;
  const defaultTitle = headline(guidance, currency);
  const title =
    embedded &&
    guidance.explanation.code === 'pace_delta' &&
    guidance.recommendation &&
    guidance.obligation?.kind === 'dated_items'
      ? `Contribute ${formatMoney(guidance.recommendation.perContribution, currency)} ${frequencyText(guidance.recommendation.contributionsPerMonth)} this month and the ${guidance.obligation.itemNames.join(', ')} are covered by ${longMonth(guidance.obligation.dueMonth)}.`
      : defaultTitle;
  const detail = explanationText(guidance, currency);
  const showObligation = guidance.obligation != null && guidance.recommendation != null;
  const showAddCta =
    goal.status === 'active' &&
    guidance.recommendation != null &&
    (guidance.explanation.code === 'pace_delta' ||
      guidance.explanation.code === 'open_goal_forecast' ||
      guidance.explanation.code === 'behind_deadline');

  const content = (
    <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {status ? (
            <span
              className={`inline-flex items-center gap-1.5 rounded-pill border border-border px-2.5 py-1 text-xs font-semibold ${status.tone}`}
            >
              <span aria-hidden="true" className={`size-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-pill border border-border px-2.5 py-1 text-xs font-semibold text-status-none">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-status-none" />
              {guidance.fullyFunded ? 'Fully funded' : 'No pace status'}
            </span>
          )}
          <span className="text-xs text-text-tertiary">
            {formatBusinessMonthLabel(guidance.asOfMonth)} ·{' '}
            {goal.contributionsPerMonth === 2 ? 'twice monthly' : 'once monthly'} · {currency}
          </span>
        </div>

        {title ? <p className={embedded ? 'text-[1.35rem] font-semibold leading-7' : 'text-lg font-semibold'}>{title}</p> : null}

        {showObligation && !embedded ? (
          <div className="space-y-2 rounded-inner bg-control p-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-text-secondary">
                {guidance.obligation!.kind === 'dated_items' ? 'Next item' : 'Final target'}
              </span>
              <span className="text-right font-medium">
                {guidance.obligation!.kind === 'dated_items'
                  ? `${guidance.obligation!.itemNames.join(', ')} · `
                  : ''}
                {formatBusinessMonthLabel(guidance.obligation!.dueMonth)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-text-secondary">Still needed</span>
              <span className="text-right font-medium" data-money>
                {formatMoney(guidance.obligation!.required, currency)}{' '}
                <span className="text-text-tertiary">
                  over {contributionCountText(guidance.obligation!.remainingOpportunities)}
                </span>
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-text-secondary">Monthly</span>
              <span className="font-medium" data-money>
                {formatMoney(guidance.recommendation!.monthly, currency)}
              </span>
            </div>
          </div>
        ) : null}

        {detail ? <p className="text-sm leading-6 text-text-secondary">{detail}</p> : null}

        {showAddCta ? (
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Button className="min-h-12" onClick={onAddContribution}>
              Add {formatMoney(guidance.recommendation!.perContribution, currency)}
            </Button>
            <Button variant="outline" className="min-h-12" onClick={onAddContribution}>
              Other amount
            </Button>
          </div>
        ) : null}
        {guidance.explanation.code === 'no_pace' && goal.status === 'active' ? (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="min-h-11" onClick={onEditGoal}>
              Set a preferred amount
            </Button>
            <Button variant="outline" className="min-h-11" onClick={onEditGoal}>
              Add a due month
            </Button>
          </div>
        ) : null}
        {guidance.setupIncomplete && goal.status === 'active' ? (
          <Button variant="outline" className="min-h-11 w-full" onClick={onOpenItems}>
            Add an item
          </Button>
        ) : null}
    </div>
  );

  if (embedded) return <section aria-label="Guidance">{content}</section>;

  return (
    <Card aria-label="Guidance">
      <CardContent className="p-4">{content}</CardContent>
    </Card>
  );
}
