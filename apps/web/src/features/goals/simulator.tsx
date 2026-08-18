import type { GoalDetail, SimulationReport } from '@goal-tracker/contracts';
import { Alert, AlertDescription, AlertTitle } from '@goal-tracker/ui/components/alert';
import { Button } from '@goal-tracker/ui/components/button';
import { Card, CardContent } from '@goal-tracker/ui/components/card';
import { Input } from '@goal-tracker/ui/components/input';
import { Label } from '@goal-tracker/ui/components/label';
import { Skeleton } from '@goal-tracker/ui/components/skeleton';
import { Switch } from '@goal-tracker/ui/components/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@goal-tracker/ui/components/table';
import { ArrowLeft, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { MoneyInput } from '../../components/money-input';
import { ApiRequestError, type GoalTrackerApi } from '../../lib/api';
import type { AuthSession } from '../../lib/auth';
import { formatBusinessMonthLabel, formatMoney, normalizeMoneyInput } from '../../lib/format';

type DraftPhase = { key: string; months: string; amount: string };

const MAX_PHASES = 3;

function newPhase(): DraftPhase {
  return { key: crypto.randomUUID(), months: '', amount: '' };
}

function parseMonths(value: string): number | null {
  if (!/^\d+$/.test(value.trim())) return null;
  const months = Number(value.trim());
  return months >= 1 && months <= 600 ? months : null;
}

function parseAmount(value: string): string | null {
  const normalized = normalizeMoneyInput(value);
  if (!/^\d+\.\d{2}$/.test(normalized)) return null;
  return normalized;
}

function currentMonthValue(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

function shiftMonth(month: string, count: number): string {
  const [year, monthNumber] = month.split('-').map(Number);
  const total = year! * 12 + (monthNumber! - 1) + count;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`;
}

function phaseRangeLabel(fromMonth: string, months: number | null): string | null {
  if (months == null) return null;
  const end = shiftMonth(fromMonth, months - 1);
  const startLabel = formatBusinessMonthLabel(fromMonth);
  const endLabel = formatBusinessMonthLabel(end);
  return fromMonth.slice(0, 4) === end.slice(0, 4)
    ? `${startLabel.slice(0, 3)} – ${endLabel}`
    : `${startLabel} – ${endLabel}`;
}

export function SimulatorPage({
  api,
  session,
  goalId,
  onBack,
}: {
  api: GoalTrackerApi;
  session: AuthSession;
  goalId: string;
  onBack: () => void;
}) {
  const designState = import.meta.env.DEV
    ? new URLSearchParams(window.location.search).get('__design')
    : null;
  const [goal, setGoal] = useState<GoalDetail>();
  const [loadError, setLoadError] = useState<string>();
  const [phases, setPhases] = useState<DraftPhase[]>(() =>
    designState === 'm4-simulator'
      ? [
          { ...newPhase(), months: '3', amount: '150' },
          { ...newPhase(), months: '3', amount: '80' },
        ]
      : [newPhase()],
  );
  const [continueLast, setContinueLast] = useState(designState === 'm4-simulator');
  const [report, setReport] = useState<SimulationReport>();
  const [reportError, setReportError] = useState<string>();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .getGoal(session, goalId)
      .then((loaded) => {
        if (!cancelled) setGoal(loaded);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'The goal could not be loaded.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [api, session, goalId]);

  const startMonth = goal?.guidance.asOfMonth ?? currentMonthValue();
  const parsedPhases = phases.map((phase) => ({
    months: parseMonths(phase.months),
    amount: parseAmount(phase.amount),
  }));
  const phasesValid = parsedPhases.every((phase) => phase.months != null && phase.amount != null);
  const lastPhaseAmount = parsedPhases.at(-1)?.amount;
  const lastPhaseCanContinue = lastPhaseAmount != null && lastPhaseAmount !== '0.00';

  useEffect(() => {
    if (!lastPhaseCanContinue) setContinueLast(false);
  }, [lastPhaseCanContinue]);

  const phaseStarts = useMemo(() => {
    const starts: string[] = [];
    let cursor = startMonth;
    for (const phase of parsedPhases) {
      starts.push(cursor);
      if (phase.months != null) cursor = shiftMonth(cursor, phase.months);
    }
    return starts;
  }, [phases, startMonth]);

  useEffect(() => {
    if (!goal || !phasesValid) {
      setReport(undefined);
      if (!phasesValid) setReportError(undefined);
      return;
    }
    const timer = setTimeout(() => {
      setPending(true);
      setReportError(undefined);
      api
        .simulate(session, goal.id, {
          phases: parsedPhases.map((phase, index) => ({
            months: phase.months!,
            amountPerContribution: phase.amount!,
            ...(index === parsedPhases.length - 1 && continueLast
              ? { continueUntilTarget: true }
              : {}),
          })),
        })
        .then(setReport)
        .catch((error: unknown) => {
          setReport(undefined);
          setReportError(
            error instanceof ApiRequestError
              ? error.message
              : 'The simulation could not be loaded. Try again.',
          );
        })
        .finally(() => setPending(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [api, session, goal?.id, phases, continueLast, phasesValid]);

  function reset() {
    setPhases([newPhase()]);
    setContinueLast(false);
    setReport(undefined);
    setReportError(undefined);
  }

  if (loadError) {
    return (
      <div className="mx-auto min-h-dvh w-full max-w-[390px] px-4 pt-3 lg:min-h-0 lg:max-w-[920px] lg:px-0 lg:pt-0">
        <Card role="alert">
          <CardContent className="space-y-3 p-4">
            <h1 className="text-lg font-semibold">Couldn&apos;t load the simulator</h1>
            <p className="text-sm text-text-secondary">{loadError}</p>
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!goal) {
    return (
      <div
        className="mx-auto w-full max-w-[390px] space-y-4 px-4 pt-3 lg:max-w-[920px] lg:px-0 lg:pt-0"
        role="status"
        aria-label="Loading simulator"
        aria-busy="true"
      >
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const frequency = goal.contributionsPerMonth;
  const affordableItems = goal.items.filter((item) => !item.purchase);

  return (
    <div className="mx-auto min-h-dvh w-full max-w-[390px] space-y-4 px-4 pb-28 pt-3 lg:min-h-0 lg:max-w-[920px] lg:px-0 lg:pb-8 lg:pt-0">
      <div className="grid grid-cols-[44px_1fr_auto] items-center gap-2 lg:grid-cols-[1fr_auto]">
        <Button variant="ghost" className="px-2 lg:hidden" aria-label="Back" onClick={onBack}>
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="truncate text-center text-lg font-semibold lg:text-left lg:text-[27px]">
          {goal.name} · simulator
        </h1>
        <Button variant="ghost" className="min-h-9 px-2 text-sm" onClick={reset}>
          Reset
        </Button>
      </div>

      <Alert>
        <AlertTitle>Temporary preview</AlertTitle>
        <AlertDescription>Nothing here changes your goal.</AlertDescription>
      </Alert>

      <div className="space-y-4 lg:grid lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] lg:items-start lg:gap-6 lg:space-y-0">
        <div className="space-y-4">
          {phases.map((phase, index) => {
            const parsed = parsedPhases[index]!;
            const range = phaseRangeLabel(phaseStarts[index]!, parsed.months);
            const monthlyMinor =
              parsed.amount != null ? Math.round(Number(parsed.amount) * 100) * frequency : null;
            const totalMinor =
              monthlyMinor != null && parsed.months != null ? monthlyMinor * parsed.months : null;
            const asMoney = (minor: number) => (minor / 100).toFixed(2);
            return (
              <Card key={phase.key}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-semibold">Phase {index + 1}</h2>
                    {range ? <span className="text-sm text-text-secondary">{range}</span> : null}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor={`phase-months-${phase.key}`}>Months</Label>
                      <Input
                        id={`phase-months-${phase.key}`}
                        inputMode="numeric"
                        value={phase.months}
                        onChange={(event) =>
                          setPhases((current) =>
                            current.map((entry) =>
                              entry.key === phase.key
                                ? { ...entry, months: event.target.value }
                                : entry,
                            ),
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`phase-amount-${phase.key}`}>Per contribution</Label>
                      <MoneyInput
                        id={`phase-amount-${phase.key}`}
                        currency={goal.currency}
                        value={phase.amount}
                        onChange={(event) =>
                          setPhases((current) =>
                            current.map((entry) =>
                              entry.key === phase.key
                                ? { ...entry, amount: event.target.value }
                                : entry,
                            ),
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-text-secondary">
                      {monthlyMinor != null
                        ? `${frequency === 2 ? 'Twice' : 'Once'} a month · ${formatMoney(asMoney(monthlyMinor), goal.currency)} a month${totalMinor != null ? ` · ${formatMoney(asMoney(totalMinor), goal.currency)} total` : ''}`
                        : 'Set an amount to see the monthly total.'}
                    </p>
                    {phases.length > 1 ? (
                      <Button
                        variant="ghost"
                        className="min-h-9 px-2 text-sm text-status-behind"
                        onClick={() =>
                          setPhases((current) => current.filter((entry) => entry.key !== phase.key))
                        }
                      >
                        <X aria-hidden="true" className="size-4" /> Remove
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {phases.length < MAX_PHASES ? (
            <Button
              variant="outline"
              className="min-h-12 w-full border-dashed"
              onClick={() => setPhases((current) => [...current, newPhase()])}
            >
              Add {phases.length === 1 ? 'a second' : 'a third'} phase
            </Button>
          ) : null}

          <div className="flex items-center gap-3 px-1">
            <Switch
              id="simulator-continue"
              checked={continueLast}
              onCheckedChange={(checked) => setContinueLast(checked === true)}
              disabled={!lastPhaseCanContinue}
              aria-describedby="simulator-continue-label"
            />
            <Label
              id="simulator-continue-label"
              htmlFor="simulator-continue"
              className="font-normal"
            >
              {lastPhaseCanContinue
                ? 'Keep the last phase going until the target is reached'
                : 'Use more than $0 in the last phase to continue automatically'}
            </Label>
          </div>
        </div>
        <div className="space-y-4">
          {report ? (
            <Card>
              <CardContent className="space-y-4 p-4">
                <h2 className="text-sm font-semibold text-text-secondary">Report</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-text-secondary">Target reached</span>
                    <span className="font-semibold text-primary">
                      {report.targetReachedMonth
                        ? formatBusinessMonthLabel(report.targetReachedMonth)
                        : 'Not within these phases'}
                    </span>
                  </div>
                  {report.fundedAtTarget ? (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-text-secondary">Funded by then</span>
                      <span className="font-medium" data-money>
                        {formatMoney(report.fundedAtTarget, goal.currency)}
                      </span>
                    </div>
                  ) : null}
                </div>

                {affordableItems.length ? (
                  <div className="space-y-2 border-t border-hairline pt-3">
                    <h3 className="text-sm font-semibold text-text-secondary">
                      Each item becomes affordable
                    </h3>
                    {affordableItems.map((item) => {
                      const entry = report.itemAffordability.find((row) => row.itemId === item.id);
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-3 text-sm"
                        >
                          <span className="font-medium">
                            {item.name}{' '}
                            <span className="text-text-tertiary" data-money>
                              {formatMoney(item.expectedPrice, goal.currency)}
                            </span>
                          </span>
                          <span className="text-text-secondary">
                            {entry?.affordableMonth
                              ? formatBusinessMonthLabel(entry.affordableMonth)
                              : 'Not within these phases'}
                          </span>
                        </div>
                      );
                    })}
                    <p className="text-xs leading-5 text-text-tertiary">
                      Affordable dates are informational. Simulated purchases are never applied.
                    </p>
                  </div>
                ) : null}

                <div className="space-y-2 border-t border-hairline pt-3">
                  <h3 className="text-sm font-semibold text-text-secondary">Month by month</h3>
                  <Table className="text-sm">
                    <TableHeader>
                      <TableRow className="text-left text-text-tertiary">
                        <TableHead className="h-auto px-0 py-1 font-normal">Month</TableHead>
                        <TableHead className="h-auto px-0 py-1 text-right font-normal">
                          Funded
                        </TableHead>
                        <TableHead className="h-auto px-0 py-1 text-right font-normal">
                          Available
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.months.map((row) => (
                        <TableRow key={row.month} className="border-t border-hairline" data-money>
                          <TableCell className="px-0 py-1.5">
                            {formatBusinessMonthLabel(row.month)}
                          </TableCell>
                          <TableCell className="px-0 py-1.5 text-right">
                            {formatMoney(row.funded, goal.currency)}
                          </TableCell>
                          <TableCell className="px-0 py-1.5 text-right">
                            {formatMoney(row.available, goal.currency)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {reportError ? (
            <Alert variant="error">
              <AlertDescription>{reportError}</AlertDescription>
            </Alert>
          ) : null}
          {!phasesValid ? (
            <p role="status" className="px-1 text-sm text-status-at-risk">
              Add a duration and contribution amount to every phase.
            </p>
          ) : null}
          {pending ? (
            <p role="status" className="px-1 text-sm text-text-tertiary">
              Updating the preview…
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
