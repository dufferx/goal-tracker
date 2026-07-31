import type { FinancialHistory, FinancialTransaction, GoalDetail } from '@goal-tracker/contracts';
import { Alert, AlertDescription, AlertTitle } from '@goal-tracker/ui/components/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@goal-tracker/ui/components/alert-dialog';
import { Badge } from '@goal-tracker/ui/components/badge';
import { Button } from '@goal-tracker/ui/components/button';
import { Card, CardContent } from '@goal-tracker/ui/components/card';
import { DatePicker } from '@goal-tracker/ui/components/date-picker';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@goal-tracker/ui/components/drawer';
import { Label } from '@goal-tracker/ui/components/label';
import { Progress } from '@goal-tracker/ui/components/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@goal-tracker/ui/components/select';
import { ArrowLeft, Check, MoreHorizontal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { MoneyInput } from '../../components/money-input';
import { ApiRequestError, type GoalTrackerApi } from '../../lib/api';
import type { AuthSession } from '../../lib/auth';
import {
  formatBusinessMonthLabel,
  formatMoney,
  formatMoneyInput,
  normalizeMoneyInput,
} from '../../lib/format';
import { GuidanceCard } from './guidance-card';
import { PlanningTimeline } from './planning-timeline';

const today = () => new Date().toISOString().slice(0, 10);
const amountNumber = (value: string | null) => Number((value ?? '0').replace(/,/g, ''));

function dateFromIso(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year!, month! - 1, day!);
}

function isoFromDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`));
}

function transactionTitle(row: FinancialTransaction) {
  if (row.kind === 'purchase') return `Purchase · ${row.itemName ?? 'Item'}`;
  if (row.kind === 'purchase_undo') return `Purchase undone · ${row.itemName ?? 'Item'}`;
  return row.kind === 'contribution' ? 'Contribution' : 'Withdrawal';
}

function signedAmount(row: FinancialTransaction, currency: string) {
  const positive = row.kind === 'contribution' || row.kind === 'purchase_undo';
  return `${positive ? '+' : '−'}${formatMoney(row.amount, currency)}`;
}

export function ContributionDrawer({
  open,
  onOpenChange,
  api,
  session,
  goal,
  initialKind = 'contribution',
  onReconciled,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  api: GoalTrackerApi;
  session: AuthSession;
  goal: GoalDetail;
  initialKind?: 'contribution' | 'withdrawal';
  onReconciled: (message: string) => Promise<void> | void;
}) {
  const designState = import.meta.env.DEV
    ? new URLSearchParams(window.location.search).get('__design')
    : null;
  const [kind, setKind] = useState<'contribution' | 'withdrawal'>(initialKind);
  const [amount, setAmount] = useState(
    designState === 'm3-contribution' ? '120' : designState === 'm3-withdrawal' ? '100' : '',
  );
  const [date, setDate] = useState(today());
  const [pending, setPending] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  const [unknownResult, setUnknownResult] = useState(false);
  const [error, setError] = useState<string>();
  useEffect(() => {
    if (open) {
      setKind(initialKind);
      setError(undefined);
      setUnknownResult(false);
    }
  }, [open, initialKind]);

  async function submit() {
    setPending(true);
    setError(undefined);
    try {
      const result = await api.createFinancialTransaction(session, goal.id, {
        kind,
        amount: normalizeMoneyInput(amount),
        effectiveDate: date,
      });
      await onReconciled(
        `${kind === 'contribution' ? 'Contribution added' : 'Withdrawal recorded'} for ${goal.name} — Available ${formatMoney(result.totals.available, goal.currency)}.`,
      );
      setAmount('');
      onOpenChange(false);
    } catch (reason) {
      if (reason instanceof ApiRequestError) setError(reason.message);
      else {
        setUnknownResult(true);
        setReconciling(true);
        setError('Result unknown. Your amount and date are still here while history is refreshed.');
        try {
          await Promise.all([
            api.getGoal(session, goal.id),
            api.getFinancialHistory(session, goal.id),
          ]);
        } finally {
          setReconciling(false);
        }
      }
    } finally {
      setPending(false);
    }
  }

  const availableAfter =
    amountNumber(goal.derived.financial.available) +
    (kind === 'contribution' ? amountNumber(amount) : -amountNumber(amount));
  return (
    <Drawer open={open} onOpenChange={(next) => !pending && !reconciling && onOpenChange(next)}>
      <DrawerContent className="mx-auto max-h-[92dvh] max-w-[390px] rounded-t-[22px] border-border bg-raised shadow-sheet">
        <DrawerHeader>
          <div className="flex items-center justify-between gap-3">
            <DrawerTitle>{kind === 'contribution' ? 'Add contribution' : 'Withdraw'}</DrawerTitle>
            <span className="text-sm text-text-secondary">{goal.name}</span>
          </div>
          <DrawerDescription className="sr-only">
            Record real money for this goal.
          </DrawerDescription>
        </DrawerHeader>
        <div className="space-y-5 overflow-y-auto px-4">
          <div className="grid grid-cols-2 rounded-control bg-control p-1">
            <Button
              variant={kind === 'contribution' ? 'default' : 'ghost'}
              onClick={() => setKind('contribution')}
              disabled={pending}
            >
              Add
            </Button>
            <Button
              variant={kind === 'withdrawal' ? 'default' : 'ghost'}
              onClick={() => setKind('withdrawal')}
              disabled={pending}
            >
              Withdraw
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="financial-amount">Amount</Label>
            <MoneyInput
              id="financial-amount"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              currency={goal.currency}
              autoFocus
              disabled={pending || reconciling}
              className="h-[78px] text-center text-4xl font-semibold"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="financial-date">Date</Label>
            <DatePicker
              id="financial-date"
              label="Date"
              maxDate={dateFromIso(today())}
              value={dateFromIso(date)}
              onChange={(value) => setDate(isoFromDate(value))}
              disabled={pending || reconciling}
            />
          </div>
          {amount ? (
            <p className="text-center text-sm text-text-secondary">
              Available after {kind === 'contribution' ? 'contribution' : 'withdrawal'} ·{' '}
              <span data-money>
                {formatMoney(String(Math.max(0, availableAfter).toFixed(2)), goal.currency)}
              </span>
            </p>
          ) : null}
          {error ? (
            <Alert variant={unknownResult ? 'default' : 'error'}>
              <AlertTitle>
                {reconciling
                  ? 'Checking what happened'
                  : unknownResult
                    ? 'Result unknown'
                    : 'Not saved'}
              </AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
        </div>
        <DrawerFooter className="grid grid-cols-[1fr_auto] gap-2">
          <Button
            disabled={pending || reconciling || !amount || !date}
            onClick={() => void submit()}
          >
            {pending || reconciling
              ? 'Checking…'
              : `${kind === 'contribution' ? 'Add' : 'Withdraw'} ${amount ? formatMoney(normalizeMoneyInput(amount), goal.currency) : ''}`}
          </Button>
          <Button
            variant="outline"
            disabled={pending || reconciling}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export function PurchaseDrawer({
  item,
  goal,
  api,
  session,
  onClose,
  onChanged,
}: {
  item: GoalDetail['items'][number] | undefined;
  goal: GoalDetail;
  api: GoalTrackerApi;
  session: AuthSession;
  onClose: () => void;
  onChanged: () => Promise<void>;
}) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today());
  const [pending, setPending] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  const [unknownResult, setUnknownResult] = useState(false);
  const [error, setError] = useState<string>();
  const [overageRequired, setOverageRequired] = useState(false);
  useEffect(() => {
    if (item) {
      setAmount(formatMoneyInput(item.expectedPrice));
      setError(undefined);
      setUnknownResult(false);
      setOverageRequired(false);
    }
  }, [item]);
  const enough = amountNumber(goal.derived.financial.available) >= amountNumber(amount);
  async function save(overageDecision?: 'keep_target' | 'increase_target') {
    if (!item) return;
    setPending(true);
    setError(undefined);
    setUnknownResult(false);
    try {
      await api.purchaseItem(session, goal.id, item.id, {
        amount: normalizeMoneyInput(amount),
        effectiveDate: date,
        ...(overageDecision ? { overageDecision } : {}),
      });
      await onChanged();
      onClose();
    } catch (reason) {
      if (reason instanceof ApiRequestError) {
        if (reason.code === 'OVERAGE_DECISION_REQUIRED') setOverageRequired(true);
        setError(reason.message);
      } else {
        setUnknownResult(true);
        setReconciling(true);
        setError('Your price and date are still here while the latest history is checked.');
        try {
          await Promise.all([
            api.getGoal(session, goal.id),
            api.getFinancialHistory(session, goal.id),
          ]);
        } finally {
          setReconciling(false);
        }
      }
    } finally {
      setPending(false);
    }
  }
  return (
    <Drawer
      open={Boolean(item)}
      onOpenChange={(open) => !open && !pending && !reconciling && onClose()}
    >
      <DrawerContent className="mx-auto max-h-[92dvh] max-w-[390px] rounded-t-[22px] border-border bg-raised shadow-sheet">
        <DrawerHeader>
          <DrawerTitle>{item ? `Buy ${item.name}` : 'Buy item'}</DrawerTitle>
          <DrawerDescription>The actual price replaces the estimate.</DrawerDescription>
        </DrawerHeader>
        <div className="space-y-4 overflow-y-auto px-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="purchase-price">What you paid</Label>
              <MoneyInput
                id="purchase-price"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                currency={goal.currency}
                disabled={pending || reconciling}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchase-date">Date</Label>
              <DatePicker
                id="purchase-date"
                label="Date"
                maxDate={dateFromIso(today())}
                value={dateFromIso(date)}
                onChange={(value) => setDate(isoFromDate(value))}
                disabled={pending || reconciling}
              />
            </div>
          </div>
          <Card className="bg-control">
            <CardContent className="space-y-2 p-3 text-sm">
              <p className="text-text-secondary">What changes</p>
              <div className="flex justify-between">
                <span>Available</span>
                <span data-money>
                  {formatMoney(goal.derived.financial.available, goal.currency)} →{' '}
                  {formatMoney(
                    String(
                      Math.max(
                        0,
                        amountNumber(goal.derived.financial.available) - amountNumber(amount),
                      ).toFixed(2),
                    ),
                    goal.currency,
                  )}
                </span>
              </div>
            </CardContent>
          </Card>
          {!enough && amount ? (
            <Alert variant="error">
              <AlertTitle>Not enough available</AlertTitle>
              <AlertDescription>
                This item costs {formatMoney(normalizeMoneyInput(amount), goal.currency)} and you
                have {formatMoney(goal.derived.financial.available, goal.currency)} available.
              </AlertDescription>
            </Alert>
          ) : null}
          {error ? (
            <Alert variant={unknownResult ? 'default' : 'error'}>
              <AlertTitle>{unknownResult ? 'Result unknown' : 'Purchase not saved'}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          {overageRequired ? (
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                disabled={pending || reconciling}
                onClick={() => void save('keep_target')}
              >
                Keep target
              </Button>
              <Button
                disabled={pending || reconciling}
                onClick={() => void save('increase_target')}
              >
                Increase target
              </Button>
            </div>
          ) : null}
        </div>
        <DrawerFooter>
          <Button
            disabled={pending || reconciling || !amount || !date || !enough || overageRequired}
            onClick={() => void save()}
          >
            {pending || reconciling ? 'Checking…' : 'Record purchase'}
          </Button>
          <Button variant="outline" disabled={pending || reconciling} onClick={onClose}>
            Cancel
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export function FinancialOverview({
  api,
  session,
  goal,
  onGoalChanged,
  onOpenHistory,
  onOpenItems,
  onOpenSimulator,
  onEditGoal,
  contributionSignal,
}: {
  api: GoalTrackerApi;
  session: AuthSession;
  goal: GoalDetail;
  onGoalChanged: (goal: GoalDetail) => void;
  onOpenHistory: () => void;
  onOpenItems: () => void;
  onOpenSimulator: () => void;
  onEditGoal: () => void;
  contributionSignal?: number;
}) {
  const designState = import.meta.env.DEV
    ? new URLSearchParams(window.location.search).get('__design')
    : null;
  const [history, setHistory] = useState<FinancialHistory>();
  const [contribute, setContribute] = useState(
    designState === 'm3-contribution' || designState === 'm3-withdrawal',
  );
  const [purchaseItem, setPurchaseItem] = useState<GoalDetail['items'][number] | undefined>(
    designState === 'm3-purchase' ? goal.items[0] : undefined,
  );
  const [undo, setUndo] = useState<GoalDetail['items'][number]>();
  const [undoPending, setUndoPending] = useState(false);
  const [undoReconciling, setUndoReconciling] = useState(false);
  const [undoUnknownResult, setUndoUnknownResult] = useState(false);
  const [undoError, setUndoError] = useState<string>();
  const [message, setMessage] = useState<string>();
  async function refresh(messageText?: string | ((history: FinancialHistory) => string)) {
    const [nextGoal, nextHistory] = await Promise.all([
      api.getGoal(session, goal.id),
      api.getFinancialHistory(session, goal.id),
    ]);
    onGoalChanged(nextGoal);
    setHistory(nextHistory);
    const text = typeof messageText === 'function' ? messageText(nextHistory) : messageText;
    if (text) setMessage(text);
  }
  useEffect(() => {
    void api.getFinancialHistory(session, goal.id).then(setHistory);
  }, [goal.id]);
  useEffect(() => {
    if (contributionSignal) setContribute(true);
  }, [contributionSignal]);
  async function submitUndo() {
    if (!undo?.purchase) return;
    setUndoPending(true);
    setUndoError(undefined);
    setUndoUnknownResult(false);
    try {
      await api.undoPurchase(session, goal.id, undo.purchase.transactionId, {
        effectiveDate: today(),
      });
      await refresh(
        (history) =>
          `Purchase undone — Available ${formatMoney(history.totals.available, goal.currency)}.`,
      );
      setUndo(undefined);
    } catch (reason) {
      if (reason instanceof ApiRequestError) setUndoError(reason.message);
      else {
        setUndoUnknownResult(true);
        setUndoReconciling(true);
        setUndoError('The latest history is being checked before another action is allowed.');
        try {
          await refresh();
        } finally {
          setUndoReconciling(false);
        }
      }
    } finally {
      setUndoPending(false);
    }
  }
  const target = amountNumber(goal.derived.currentTarget);
  const funded = amountNumber(goal.derived.financial.funded);
  const progress = target > 0 ? Math.min(100, (funded / target) * 100) : 0;
  return (
    <div className="space-y-4">
      {message ? (
        <Alert variant="success">
          <Check className="size-4" />
          <AlertTitle>{message}</AlertTitle>
        </Alert>
      ) : null}
      <div className="space-y-2">
        <p className="text-sm text-text-secondary">
          {goal.targetMode === 'fixed' ? 'Fixed target' : 'Item-derived target'} · {goal.currency}
        </p>
      </div>
      {goal.status !== 'active' ? (
        <Alert>
          <AlertTitle>Archived goal</AlertTitle>
          <AlertDescription>Restore it before recording money.</AlertDescription>
        </Alert>
      ) : null}
      <GuidanceCard
        goal={goal}
        onAddContribution={() => setContribute(true)}
        onEditGoal={onEditGoal}
        onOpenItems={onOpenItems}
        embedded
      />
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex items-end justify-between gap-3">
            <span className="text-sm text-text-secondary">Funded</span>
            <span>
              <strong data-money className="text-xl">
                {formatMoney(goal.derived.financial.funded, goal.currency)}
              </strong>{' '}
              <span className="text-sm text-text-tertiary">
                of{' '}
                {goal.derived.currentTarget
                  ? formatMoney(goal.derived.currentTarget, goal.currency)
                  : 'target pending'}
              </span>
            </span>
          </div>
          <Progress value={progress} aria-label={`${Math.round(progress)}% funded`} />
          <p className="text-sm text-text-secondary">
            {formatMoney(goal.derived.financial.available, goal.currency)} available
            <span className="float-right">
              {formatMoney(goal.derived.financial.spent, goal.currency)} spent ·{' '}
              {goal.derived.financial.remaining
                ? formatMoney(goal.derived.financial.remaining, goal.currency)
                : '—'}{' '}
              remaining
            </span>
          </p>
          {goal.guidance.recommendation ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-4 border-t border-hairline pt-4">
              <Metric
                label="Per contribution"
                value={goal.guidance.recommendation.perContribution}
                currency={goal.currency}
                accent
              />
              <Metric
                label="Monthly"
                value={goal.guidance.recommendation.monthly}
                currency={goal.currency}
              />
              <Metric
                label="Next obligation"
                value={
                  goal.guidance.obligation
                    ? formatBusinessMonthLabel(goal.guidance.obligation.dueMonth)
                    : goal.guidance.forecastMonth
                      ? formatBusinessMonthLabel(goal.guidance.forecastMonth)
                      : null
                }
              />
              <Metric
                label={goal.finalMonth ? 'Final month' : 'Forecast finish'}
                value={
                  goal.finalMonth
                    ? formatBusinessMonthLabel(goal.finalMonth)
                    : goal.guidance.forecastMonth
                      ? formatBusinessMonthLabel(goal.guidance.forecastMonth)
                      : null
                }
              />
            </div>
          ) : null}
          <p className="border-t border-hairline pt-3 text-xs text-text-tertiary">
            {goal.targetMode === 'fixed' ? 'Fixed target' : 'Item-derived target'} · planning from{' '}
            {formatBusinessMonthLabel(goal.startMonth)}
          </p>
        </CardContent>
      </Card>
      <PlanningTimeline goal={goal} onOpenItems={onOpenItems} />
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <h2 className="font-semibold">Items</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-secondary">{goal.items.length}</span>
              {goal.status === 'active' ? (
                <Button variant="ghost" className="min-h-9 px-2" onClick={onOpenItems}>
                  Manage items
                </Button>
              ) : null}
            </div>
          </div>
          <div className="divide-y divide-hairline">
            {goal.items.length ? (
              goal.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">{item.name}</p>
                      {item.purchase ? (
                        <Badge className="border-accent-border bg-accent-surface text-primary">
                          Purchased
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-sm text-text-secondary" data-money>
                      {item.purchase
                        ? `${formatMoney(item.purchase.actualPrice, goal.currency)} actual`
                        : `${formatMoney(item.expectedPrice, goal.currency)} expected`}
                    </p>
                  </div>
                  {item.purchase ? (
                    <Button
                      className="min-h-9 px-2"
                      variant="ghost"
                      onClick={() => {
                        setUndoError(undefined);
                        setUndoUnknownResult(false);
                        setUndo(item);
                      }}
                    >
                      Undo
                    </Button>
                  ) : goal.status === 'active' ? (
                    <Button
                      className="min-h-9 px-3"
                      variant="outline"
                      disabled={amountNumber(goal.derived.financial.available) <= 0}
                      onClick={() => setPurchaseItem(item)}
                    >
                      Buy
                    </Button>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="px-4 py-5 text-sm text-text-secondary">No planned purchases yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between px-4 py-3">
            <h2 className="font-semibold">Recent history</h2>
            <Button variant="ghost" className="min-h-9 px-2" onClick={onOpenHistory}>
              See all
            </Button>
          </div>
          <HistoryRows rows={history?.transactions.slice(0, 3) ?? []} currency={goal.currency} />
        </CardContent>
      </Card>
      <Button
        variant="outline"
        className="h-auto min-h-16 w-full justify-between px-4 py-3 text-left"
        onClick={onOpenSimulator}
      >
        <span>
          <span className="block font-semibold">Try a contribution plan</span>
          <span className="mt-1 block text-sm text-text-secondary">
            Preview different amounts without changing this goal.
          </span>
        </span>
        <span className="text-sm font-semibold text-primary">Simulator</span>
      </Button>
      <ContributionDrawer
        open={contribute}
        onOpenChange={setContribute}
        api={api}
        session={session}
        goal={goal}
        initialKind={designState === 'm3-withdrawal' ? 'withdrawal' : 'contribution'}
        onReconciled={(text) => refresh(text)}
      />
      <PurchaseDrawer
        item={purchaseItem}
        goal={goal}
        api={api}
        session={session}
        onClose={() => setPurchaseItem(undefined)}
        onChanged={() =>
          refresh(
            (history) =>
              `Purchase recorded — Available ${formatMoney(history.totals.available, goal.currency)}.`,
          )
        }
      />
      <AlertDialog
        open={Boolean(undo)}
        onOpenChange={(open) => !open && !undoPending && !undoReconciling && setUndo(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Undo this purchase?</AlertDialogTitle>
            <AlertDialogDescription>
              The full purchase amount returns to available money. The item becomes unpurchased.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {undoError ? (
            <Alert variant={undoUnknownResult ? 'default' : 'error'}>
              <AlertTitle>
                {undoUnknownResult ? 'Result unknown' : 'Purchase not undone'}
              </AlertTitle>
              <AlertDescription>{undoError}</AlertDescription>
            </Alert>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={undoPending || undoReconciling}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={undoPending || undoReconciling}
              onClick={(event) => {
                event.preventDefault();
                void submitUndo();
              }}
            >
              {undoPending || undoReconciling ? 'Checking…' : 'Undo purchase'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Metric({
  label,
  value,
  currency,
  accent = false,
}: {
  label: string;
  value: string | null;
  currency?: string;
  accent?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-text-secondary">{label}</p>
      <p className={`mt-1 truncate font-semibold ${accent ? 'text-primary' : ''}`} data-money>
        {value == null ? '—' : currency ? formatMoney(value, currency) : value}
      </p>
    </div>
  );
}
function HistoryRows({
  rows,
  currency,
  onOpen,
}: {
  rows: FinancialTransaction[];
  currency: string;
  onOpen?: (row: FinancialTransaction) => void;
}) {
  return (
    <div className="divide-y divide-hairline">
      {rows.length ? (
        rows.map((row) => (
          <button
            key={row.id}
            type="button"
            className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left hover:bg-control"
            onClick={() => onOpen?.(row)}
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium">
                {transactionTitle(row)}{' '}
                {row.edited ? <span className="text-xs text-text-tertiary">· edited</span> : null}
              </p>
              <p className="text-sm text-text-tertiary">
                {dateLabel(row.effectiveDate)} · available{' '}
                {formatMoney(row.balanceAfter.available, currency)}
              </p>
            </div>
            <span
              data-money
              className={
                row.kind === 'contribution' || row.kind === 'purchase_undo' ? 'text-primary' : ''
              }
            >
              {signedAmount(row, currency)}
            </span>
            {onOpen ? <MoreHorizontal className="size-4 text-text-tertiary" /> : null}
          </button>
        ))
      ) : (
        <p className="px-4 py-5 text-sm text-text-secondary">No money recorded yet.</p>
      )}
    </div>
  );
}

export function FinancialHistoryPage({
  api,
  session,
  goalId,
  onBack,
  onChanged,
}: {
  api: GoalTrackerApi;
  session: AuthSession;
  goalId: string;
  onBack: () => void;
  onChanged: () => void;
}) {
  const designState = import.meta.env.DEV
    ? new URLSearchParams(window.location.search).get('__design')
    : null;
  const [goal, setGoal] = useState<GoalDetail>();
  const [history, setHistory] = useState<FinancialHistory>();
  const [kind, setKind] = useState('all');
  const [month, setMonth] = useState('all');
  const [selected, setSelected] = useState<FinancialTransaction>();
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [pending, setPending] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  const [unknownResult, setUnknownResult] = useState(false);
  const [error, setError] = useState<string>();
  const [overageRequired, setOverageRequired] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  async function load() {
    const [nextGoal, nextHistory] = await Promise.all([
      api.getGoal(session, goalId),
      api.getFinancialHistory(session, goalId, {
        ...(kind !== 'all' ? { kind } : {}),
        ...(month !== 'all' ? { month } : {}),
      }),
    ]);
    setGoal(nextGoal);
    setHistory(nextHistory);
    if (designState === 'm3-correction' && !selected) {
      const editable =
        nextHistory.transactions.find((row) => row.kind === 'contribution') ??
        nextHistory.transactions.find(
          (row) => row.kind === 'withdrawal' || row.kind === 'purchase',
        );
      if (editable) open(editable);
    }
  }
  useEffect(() => {
    void load();
  }, [goalId, kind, month]);
  const months = useMemo(
    () => [...new Set(history?.transactions.map((row) => row.effectiveDate.slice(0, 7)) ?? [])],
    [history],
  );
  function open(row: FinancialTransaction) {
    setSelected(row);
    setAmount(formatMoneyInput(row.amount));
    setDate(row.effectiveDate);
    setError(undefined);
    setUnknownResult(false);
    setOverageRequired(false);
  }
  async function save(overageDecision?: 'keep_target' | 'increase_target') {
    if (!selected) return;
    setPending(true);
    setError(undefined);
    setUnknownResult(false);
    try {
      await api.updateFinancialTransaction(session, goalId, selected.id, {
        amount: normalizeMoneyInput(amount),
        effectiveDate: date,
        ...(overageDecision ? { overageDecision } : {}),
      });
      setSelected(undefined);
      await load();
      onChanged();
    } catch (reason) {
      if (reason instanceof ApiRequestError) {
        if (reason.code === 'OVERAGE_DECISION_REQUIRED') setOverageRequired(true);
        setError(reason.message);
      } else {
        setUnknownResult(true);
        setReconciling(true);
        setError('Your amount and date are still here while the latest history is checked.');
        try {
          await load();
        } finally {
          setReconciling(false);
        }
      }
    } finally {
      setPending(false);
    }
  }
  async function remove() {
    if (!selected) return;
    setPending(true);
    setError(undefined);
    setUnknownResult(false);
    try {
      await api.deleteFinancialTransaction(session, goalId, selected.id);
      setSelected(undefined);
      setConfirmDelete(false);
      await load();
      onChanged();
    } catch (reason) {
      if (reason instanceof ApiRequestError) setError(reason.message);
      else {
        setUnknownResult(true);
        setReconciling(true);
        setError('The latest history is being checked before another action is allowed.');
        try {
          await load();
        } finally {
          setReconciling(false);
        }
      }
      setConfirmDelete(false);
    } finally {
      setPending(false);
    }
  }
  if (!goal || !history)
    return (
      <div className="mx-auto max-w-[390px] p-4">
        <p className="text-sm text-text-secondary">Loading history…</p>
      </div>
    );
  return (
    <div className="mx-auto min-h-dvh w-full max-w-[390px] px-4 pb-10 pt-3">
      <header className="grid grid-cols-[44px_1fr_44px] items-center">
        <Button variant="ghost" className="px-2" aria-label="Back" onClick={onBack}>
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="truncate text-center text-lg font-semibold">{goal.name} · history</h1>
        <span />
      </header>
      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {[
          ['all', 'All'],
          ['contribution', 'Contributions'],
          ['withdrawal', 'Withdrawals'],
          ['purchase', 'Purchases'],
        ].map(([value, label]) => (
          <Button
            key={value}
            variant={kind === value ? 'default' : 'outline'}
            className="min-h-9 rounded-pill px-3"
            onClick={() => setKind(value!)}
          >
            {label}
          </Button>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            {months.map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="mt-5 flex justify-between text-xs text-text-tertiary">
        <span>Balance after each event</span>
        <span>available today {formatMoney(history.totals.available, goal.currency)}</span>
      </div>
      <Card className="mt-3 overflow-hidden">
        <CardContent className="p-0">
          <HistoryRows rows={history.transactions} currency={goal.currency} onOpen={open} />
        </CardContent>
      </Card>
      <Drawer
        open={Boolean(selected)}
        onOpenChange={(openValue) =>
          !openValue && !pending && !reconciling && setSelected(undefined)
        }
      >
        <DrawerContent className="mx-auto max-h-[92dvh] max-w-[390px] rounded-t-[22px] border-border bg-raised shadow-sheet">
          <DrawerHeader>
            <DrawerTitle>
              {selected ? `Edit ${transactionTitle(selected).toLowerCase()}` : 'Edit transaction'}
            </DrawerTitle>
            <DrawerDescription>
              Totals update only after the full history remains valid.
            </DrawerDescription>
          </DrawerHeader>
          <div className="space-y-4 overflow-y-auto px-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-amount">Amount</Label>
                <MoneyInput
                  id="edit-amount"
                  currency={goal.currency}
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  disabled={pending || reconciling}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-date">Date</Label>
                <DatePicker
                  id="edit-date"
                  label="Date"
                  maxDate={dateFromIso(today())}
                  value={dateFromIso(date)}
                  onChange={(value) => setDate(isoFromDate(value))}
                  disabled={pending || reconciling}
                />
              </div>
            </div>
            {error ? (
              <Alert variant={unknownResult ? 'default' : 'error'}>
                <AlertTitle>
                  {unknownResult ? 'Result unknown' : 'That change would break your history'}
                </AlertTitle>
                <AlertDescription>
                  {error}
                  {!unknownResult ? ' Nothing has been changed.' : ''}
                </AlertDescription>
              </Alert>
            ) : null}
            {overageRequired ? (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  disabled={pending || reconciling}
                  onClick={() => void save('keep_target')}
                >
                  Keep target
                </Button>
                <Button
                  disabled={pending || reconciling}
                  onClick={() => void save('increase_target')}
                >
                  Increase target
                </Button>
              </div>
            ) : null}
          </div>
          <DrawerFooter className="grid grid-cols-[auto_1fr] gap-2">
            {selected?.kind === 'contribution' || selected?.kind === 'withdrawal' ? (
              <Button
                variant="outline"
                className="text-status-behind"
                onClick={() => setConfirmDelete(true)}
                disabled={pending || reconciling}
              >
                Delete
              </Button>
            ) : null}
            <Button
              onClick={() => void save()}
              disabled={pending || reconciling || overageRequired}
            >
              {pending || reconciling ? 'Checking…' : 'Save change'}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              The change is accepted only if every later balance stays valid.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction variant="danger" onClick={() => void remove()}>
              Delete transaction
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
