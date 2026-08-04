import type {
  GoalDetail,
  GoalItem,
  PlanningPreviewResponse,
  UpdateGoalRequest,
} from '@goal-tracker/contracts';
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
import { Input } from '@goal-tracker/ui/components/input';
import { Label } from '@goal-tracker/ui/components/label';
import { RadioGroup, RadioGroupItem } from '@goal-tracker/ui/components/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@goal-tracker/ui/components/select';
import { Skeleton } from '@goal-tracker/ui/components/skeleton';
import { ArrowLeft, ChevronDown, ChevronUp, MoreHorizontal } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';

import { ApiRequestError, type GoalTrackerApi } from '../../lib/api';
import type { AuthSession } from '../../lib/auth';
import {
  formatMoneyInput,
  formatBusinessMonthLabel,
  formatMoney,
  monthOptions,
  normalizeMoneyInput,
} from '../../lib/format';
import { MoneyInput } from '../../components/money-input';
import { ResponsiveOverlay } from '../../components/responsive-overlay';
import { FinancialOverview } from './financial';

const months = monthOptions(2025, 6);

export function GoalDetailPage({
  api,
  session,
  goalId,
  initialTab = 'overview',
  onBack,
  onOpenOverview,
  onOpenItems,
  onOpenHistory,
  onOpenSimulator,
  onDeleted,
  onSessionExpired,
  contributionSignal = 0,
  editSignal = 0,
  onContextChange,
}: {
  api: GoalTrackerApi;
  session: AuthSession;
  goalId: string;
  initialTab?: 'overview' | 'items' | 'settings';
  onBack: () => void;
  onOpenOverview: () => void;
  onOpenItems: () => void;
  onOpenHistory: () => void;
  onOpenSimulator: () => void;
  onDeleted: () => void;
  onSessionExpired: () => void;
  contributionSignal?: number;
  editSignal?: number;
  onContextChange?: (context: 'overview' | 'items' | 'edit') => void;
}) {
  const [goal, setGoal] = useState<GoalDetail>();
  const [tab, setTab] = useState<'overview' | 'items' | 'settings'>(initialTab);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string>();

  function showOverview() {
    setTab('overview');
    onContextChange?.('overview');
    onOpenOverview();
  }

  function showItems() {
    setTab('items');
    onContextChange?.('items');
    onOpenItems();
  }

  function showSettings() {
    setTab('settings');
    onContextChange?.('edit');
  }

  async function load() {
    setLoading(true);
    setError(undefined);
    try {
      setGoal(await api.getGoal(session, goalId));
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        onSessionExpired();
        return;
      }
      setError(err instanceof Error ? err.message : 'The goal could not be loaded.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [goalId, session.accessToken]);

  // Keep the visible tab in sync with the route (back arrow, browser
  // back/forward) — the same component instance serves both detail routes.
  useEffect(() => {
    setTab(initialTab);
    onContextChange?.(initialTab === 'items' ? 'items' : 'overview');
  }, [initialTab]);

  useEffect(() => {
    if (editSignal) showSettings();
  }, [editSignal]);

  if (loading) {
    return (
      <div className="space-y-4" role="status" aria-label="Loading goal" aria-busy="true">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error || !goal) {
    return (
      <Card role="alert">
        <CardContent className="space-y-3 p-4">
          <h1 className="text-lg font-semibold">Couldn&apos;t load this goal</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
          <div className="flex gap-2">
            <Button type="button" onClick={() => void load()}>
              Try again
            </Button>
            <Button type="button" variant="outline" onClick={onBack}>
              Back
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto min-h-dvh w-full max-w-[390px] space-y-4 px-4 pb-28 pt-3 lg:min-h-0 lg:max-w-none lg:px-0 lg:pb-8 lg:pt-0">
      <div className="grid grid-cols-[44px_1fr_64px] items-center gap-2 lg:block">
        <Button
          type="button"
          variant="ghost"
          className="px-2 lg:hidden"
          onClick={onBack}
          aria-label="Back"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="truncate text-center text-lg font-semibold lg:text-left lg:text-[27px] lg:tracking-[-0.025em]">
          {tab === 'overview'
            ? goal.name
            : tab === 'items'
              ? `${goal.name} · items`
              : `Edit ${goal.name}`}
        </h1>
        <Button
          type="button"
          variant="ghost"
          className="justify-end px-1 lg:hidden"
          onClick={() => (tab === 'settings' ? showOverview() : showSettings())}
        >
          {tab === 'settings' ? 'Done' : 'Edit'}
        </Button>
      </div>

      {message ? (
        <p role="status" className="text-sm text-primary">
          {message}
        </p>
      ) : null}

      {tab === 'overview' ? (
        <FinancialOverview
          api={api}
          session={session}
          goal={goal}
          onGoalChanged={setGoal}
          onOpenHistory={onOpenHistory}
          onOpenItems={showItems}
          onOpenSimulator={onOpenSimulator}
          onEditGoal={showSettings}
          contributionSignal={contributionSignal}
        />
      ) : tab === 'items' ? (
        <ItemsPanel
          api={api}
          session={session}
          goal={goal}
          pending={pending}
          setPending={setPending}
          onChanged={setGoal}
          onSessionExpired={onSessionExpired}
          onError={setError}
        />
      ) : (
        <SettingsPanel
          api={api}
          session={session}
          goal={goal}
          pending={pending}
          setPending={setPending}
          onChanged={setGoal}
          onDeleted={onDeleted}
          onSessionExpired={onSessionExpired}
          onMessage={setMessage}
          onSaved={showOverview}
        />
      )}
    </div>
  );
}

function ItemsPanel({
  api,
  session,
  goal,
  pending,
  setPending,
  onChanged,
  onSessionExpired,
  onError,
}: {
  api: GoalTrackerApi;
  session: AuthSession;
  goal: GoalDetail;
  pending: boolean;
  setPending: (value: boolean) => void;
  onChanged: (goal: GoalDetail) => void;
  onSessionExpired: () => void;
  onError: (message: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [expectedPrice, setExpectedPrice] = useState('');
  const [dueMonth, setDueMonth] = useState('');
  const [percent, setPercent] = useState('');
  const [overageDecision, setOverageDecision] = useState<'keep_target' | 'increase_target'>();
  const [showOverage, setShowOverage] = useState(false);
  const [deleteId, setDeleteId] = useState<string>();
  const [editingItem, setEditingItem] = useState<GoalItem>();
  const [editName, setEditName] = useState('');
  const [editExpectedPrice, setEditExpectedPrice] = useState('');
  const [editDueMonth, setEditDueMonth] = useState('');
  const archived = goal.status === 'archived';

  async function createItem(decision?: 'keep_target' | 'increase_target') {
    setPending(true);
    onError('');
    try {
      const updated = await api.createItem(session, goal.id, {
        name: name.trim(),
        expectedPrice: normalizeMoneyInput(expectedPrice),
        dueMonth: dueMonth || null,
        ...(decision ? { overageDecision: decision } : {}),
      });
      onChanged(updated);
      setAdding(false);
      setName('');
      setExpectedPrice('');
      setDueMonth('');
      setPercent('');
      setShowOverage(false);
      setOverageDecision(undefined);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        onSessionExpired();
        return;
      }
      if (
        err instanceof ApiRequestError &&
        err.message.toLowerCase().includes('exceed the fixed target')
      ) {
        setShowOverage(true);
        onError(err.message);
        return;
      }
      onError(err instanceof Error ? err.message : 'The item could not be created.');
    } finally {
      setPending(false);
    }
  }

  async function move(itemId: string, direction: -1 | 1) {
    const ordered = [...goal.items].sort((a, b) => a.position - b.position);
    const index = ordered.findIndex((item) => item.id === itemId);
    const swapWith = index + direction;
    if (index < 0 || swapWith < 0 || swapWith >= ordered.length) return;
    const next = [...ordered];
    const current = next[index]!;
    next[index] = next[swapWith]!;
    next[swapWith] = current;
    setPending(true);
    try {
      const items = await api.reorderItems(session, goal.id, {
        orderedItemIds: next.map((item) => item.id),
      });
      onChanged({ ...goal, items });
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        onSessionExpired();
        return;
      }
      onError(err instanceof Error ? err.message : 'Items could not be reordered.');
    } finally {
      setPending(false);
    }
  }

  function openItem(item: GoalItem) {
    setEditingItem(item);
    setEditName(item.name);
    setEditExpectedPrice(formatMoneyInput(item.expectedPrice));
    setEditDueMonth(item.dueMonth ?? '');
  }

  async function saveItem() {
    if (!editingItem) return;
    setPending(true);
    onError('');
    try {
      const updated = await api.updateItem(session, goal.id, editingItem.id, {
        name: editName.trim(),
        expectedPrice: normalizeMoneyInput(editExpectedPrice),
        dueMonth: editDueMonth || null,
      });
      onChanged(updated);
      setEditingItem(undefined);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        onSessionExpired();
        return;
      }
      onError(err instanceof Error ? err.message : 'The item could not be updated.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4 lg:max-w-[840px]">
      <p className="text-sm text-muted-foreground">
        {goal.targetMode === 'fixed'
          ? `Items share the fixed ${formatMoney(goal.fixedTarget ?? '0.00', goal.currency)} budget.`
          : "Item prices define this goal's target."}
      </p>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {goal.targetMode === 'fixed' ? 'Allocated' : 'Target'}
        </span>
        <span data-money className="font-medium">
          {goal.targetMode === 'fixed'
            ? `${formatMoney(goal.derived.allocated ?? '0.00', goal.currency)} of ${formatMoney(goal.fixedTarget ?? '0.00', goal.currency)}`
            : goal.derived.currentTarget
              ? formatMoney(goal.derived.currentTarget, goal.currency)
              : 'Unknown'}
        </span>
      </div>

      {goal.derived.setupIncomplete ? (
        <Card>
          <CardContent className="space-y-2 p-4">
            <Badge variant="outline">Setup incomplete</Badge>
            <p className="text-lg font-semibold">Add your first item to set the target.</p>
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-3">
        {goal.items.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <h2 className="font-semibold">{item.name}</h2>
                  <p data-money className="text-sm">
                    {formatMoney(item.expectedPrice, goal.currency)} expected
                  </p>
                </div>
                <div className="flex items-start gap-1">
                  <span className="pt-2 text-sm text-muted-foreground">
                    {item.dueMonth
                      ? `Due ${formatBusinessMonthLabel(item.dueMonth)}`
                      : 'No due month'}
                  </span>
                  {!archived ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="size-11 px-0 text-text-secondary"
                      aria-label={`Edit ${item.name}`}
                      onClick={() => openItem(item)}
                    >
                      <MoreHorizontal aria-hidden="true" className="size-5" />
                    </Button>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!archived ? (
        adding ? (
          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="space-y-2">
                <Label htmlFor="item-name">Name</Label>
                <Input
                  id="item-name"
                  value={name}
                  disabled={pending}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-price">Expected price</Label>
                <Input
                  id="item-price"
                  inputMode="decimal"
                  data-money
                  value={expectedPrice}
                  disabled={pending}
                  onChange={(event) => setExpectedPrice(event.target.value)}
                />
              </div>
              {goal.targetMode === 'fixed' && goal.fixedTarget ? (
                <div className="space-y-2">
                  <Label htmlFor="item-percent">Or percent of target</Label>
                  <div className="flex gap-2">
                    <Input
                      id="item-percent"
                      inputMode="decimal"
                      value={percent}
                      disabled={pending}
                      onChange={(event) => setPercent(event.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={pending || !percent}
                      onClick={() => {
                        void api
                          .convertPercent(session, {
                            percent: Number(percent),
                            fixedTarget: goal.fixedTarget!,
                          })
                          .then((result) => setExpectedPrice(result.expectedPrice))
                          .catch((err: unknown) =>
                            onError(
                              err instanceof Error
                                ? err.message
                                : 'Percentage could not be converted.',
                            ),
                          );
                      }}
                    >
                      Convert
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Converts immediately to money. Only the money value is saved.
                  </p>
                </div>
              ) : null}
              <div className="space-y-2">
                <Label>Due month · optional</Label>
                <Select
                  value={dueMonth || '__none__'}
                  onValueChange={(value) => setDueMonth(value === '__none__' ? '' : value)}
                  disabled={pending}
                >
                  <SelectTrigger aria-label="Due month">
                    <SelectValue placeholder="No due month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No due month</SelectItem>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {showOverage ? (
                <div className="space-y-2 rounded-card border border-warning-border bg-warning-surface p-3">
                  <p className="font-semibold text-[color:var(--gt-status-at-risk)]">
                    Your items now add up to more than the target
                  </p>
                  <RadioGroup
                    value={overageDecision}
                    onValueChange={(value) =>
                      setOverageDecision(value as 'increase_target' | 'keep_target')
                    }
                  >
                    <RadioGroupItem value="increase_target" presentation="card">
                      Raise the target to the items total
                    </RadioGroupItem>
                    <RadioGroupItem value="keep_target" presentation="card">
                      Keep the current target
                    </RadioGroupItem>
                  </RadioGroup>
                  <Button
                    type="button"
                    disabled={pending || !overageDecision}
                    onClick={() => void createItem(overageDecision)}
                  >
                    Continue
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    disabled={pending || !name.trim() || !expectedPrice.trim()}
                    onClick={() => void createItem()}
                  >
                    Save item
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={pending}
                    onClick={() => setAdding(false)}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="w-full border-dashed bg-transparent hover:bg-control"
            disabled={pending}
            onClick={() => setAdding(true)}
          >
            Add an item
          </Button>
        )
      ) : null}

      <ResponsiveOverlay
        open={Boolean(editingItem)}
        onOpenChange={(open) => !open && setEditingItem(undefined)}
        title="Edit item"
        description="Update the planned amount, month, or display order."
        footer={
          <>
            <Button
              type="button"
              disabled={pending || !editName.trim() || !editExpectedPrice.trim()}
              onClick={() => void saveItem()}
            >
              {pending ? 'Saving…' : 'Save item'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="text-status-behind"
              disabled={pending}
              onClick={() => {
                if (!editingItem) return;
                setDeleteId(editingItem.id);
                setEditingItem(undefined);
              }}
            >
              Delete item
            </Button>
          </>
        }
      >
        <div className="space-y-4 overflow-y-auto px-4 lg:px-0">
          <div className="space-y-2">
            <Label htmlFor="edit-item-name">Name</Label>
            <Input
              id="edit-item-name"
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-item-price">Expected price</Label>
            <Input
              id="edit-item-price"
              inputMode="decimal"
              data-money
              value={editExpectedPrice}
              onChange={(event) => setEditExpectedPrice(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Due month · optional</Label>
            <Select
              value={editDueMonth || '__none__'}
              onValueChange={(value) => setEditDueMonth(value === '__none__' ? '' : value)}
            >
              <SelectTrigger aria-label="Edit due month">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No due month</SelectItem>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={
                pending ||
                !editingItem ||
                goal.items.findIndex((item) => item.id === editingItem.id) === 0
              }
              onClick={() => editingItem && void move(editingItem.id, -1)}
            >
              <ChevronUp aria-hidden="true" className="size-4" />
              Move up
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={
                pending ||
                !editingItem ||
                goal.items.findIndex((item) => item.id === editingItem.id) === goal.items.length - 1
              }
              onClick={() => editingItem && void move(editingItem.id, 1)}
            >
              <ChevronDown aria-hidden="true" className="size-4" />
              Move down
            </Button>
          </div>
        </div>
      </ResponsiveOverlay>

      <AlertDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the planned item from the goal. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={() => {
                if (!deleteId) return;
                setPending(true);
                void api
                  .deleteItem(session, goal.id, deleteId)
                  .then((updated) => {
                    onChanged(updated);
                    setDeleteId(undefined);
                  })
                  .catch((err: unknown) => {
                    if (err instanceof ApiRequestError && err.status === 401) {
                      onSessionExpired();
                      return;
                    }
                    onError(err instanceof Error ? err.message : 'The item could not be deleted.');
                  })
                  .finally(() => setPending(false));
              }}
            >
              Delete item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SettingsPanel({
  api,
  session,
  goal,
  pending,
  setPending,
  onChanged,
  onDeleted,
  onSessionExpired,
  onMessage,
  onSaved,
}: {
  api: GoalTrackerApi;
  session: AuthSession;
  goal: GoalDetail;
  pending: boolean;
  setPending: (value: boolean) => void;
  onChanged: (goal: GoalDetail) => void;
  onDeleted: () => void;
  onSessionExpired: () => void;
  onMessage: (message: string) => void;
  onSaved: () => void;
}) {
  const designState = import.meta.env.DEV
    ? new URLSearchParams(window.location.search).get('__design')
    : null;
  const [name, setName] = useState(goal.name);
  const [description, setDescription] = useState(goal.description ?? '');
  const [targetMode, setTargetMode] = useState(
    designState === 'mode-dialog' ? 'items' : goal.targetMode,
  );
  const [fixedTarget, setFixedTarget] = useState(formatMoneyInput(goal.fixedTarget ?? ''));
  const [startMonth, setStartMonth] = useState(goal.startMonth);
  const [finalMonth, setFinalMonth] = useState(goal.finalMonth ?? '');
  const [contributionsPerMonth, setContributionsPerMonth] = useState(goal.contributionsPerMonth);
  const [preferredContribution, setPreferredContribution] = useState(
    goal.preferredContribution ?? '',
  );
  const [preview, setPreview] = useState<PlanningPreviewResponse | undefined>(
    designState === 'mode-dialog'
      ? {
          impacts: [
            {
              kind: 'target_mode_changed',
              label: 'Target',
              before: '$3,000',
              after: '$1,600',
            },
          ],
          resultingFixedTarget: null,
          requiresOverageDecision: false,
          requiresTargetModeConfirmation: true,
        }
      : undefined,
  );
  const [error, setError] = useState<string>();
  const [archiveOpen, setArchiveOpen] = useState(designState === 'archive-dialog');
  const [deleteOpen, setDeleteOpen] = useState(designState === 'delete-dialog');
  const [confirmationName, setConfirmationName] = useState('');
  const [modeConfirmOpen, setModeConfirmOpen] = useState(designState === 'mode-dialog');
  const archived = goal.status === 'archived';

  useEffect(() => {
    setName(goal.name);
    setDescription(goal.description ?? '');
    setTargetMode(designState === 'mode-dialog' ? 'items' : goal.targetMode);
    setFixedTarget(formatMoneyInput(goal.fixedTarget ?? ''));
    setStartMonth(goal.startMonth);
    setFinalMonth(goal.finalMonth ?? '');
    setContributionsPerMonth(goal.contributionsPerMonth);
    setPreferredContribution(goal.preferredContribution ?? '');
  }, [designState, goal]);

  async function runPreview() {
    try {
      const result = await api.previewPlanning(session, goal.id, {
        name: name.trim(),
        description: description.trim() || null,
        targetMode,
        fixedTarget: targetMode === 'fixed' ? normalizeMoneyInput(fixedTarget) : null,
        startMonth,
        finalMonth: finalMonth || null,
        contributionsPerMonth,
        preferredContribution: preferredContribution
          ? normalizeMoneyInput(preferredContribution)
          : null,
      });
      setPreview(result);
      return result;
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        onSessionExpired();
        return undefined;
      }
      setError(err instanceof Error ? err.message : 'Preview failed.');
      return undefined;
    }
  }

  async function save(extra?: Partial<UpdateGoalRequest>) {
    setPending(true);
    setError(undefined);
    try {
      const updated = await api.updateGoal(session, goal.id, {
        name: name.trim(),
        description: description.trim() || null,
        targetMode,
        fixedTarget: targetMode === 'fixed' ? normalizeMoneyInput(fixedTarget) : null,
        startMonth,
        finalMonth: finalMonth || null,
        contributionsPerMonth,
        preferredContribution: preferredContribution
          ? normalizeMoneyInput(preferredContribution)
          : null,
        ...extra,
      });
      onChanged(updated);
      onMessage('Changes saved.');
      onSaved();
      setModeConfirmOpen(false);
      setPreview(undefined);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        onSessionExpired();
        return;
      }
      if (err instanceof ApiRequestError && err.code === 'TARGET_MODE_CONFIRMATION_REQUIRED') {
        setModeConfirmOpen(true);
        await runPreview();
        return;
      }
      setError(err instanceof Error ? err.message : 'Changes could not be saved.');
    } finally {
      setPending(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (archived) return;
    const result = await runPreview();
    if (result?.requiresTargetModeConfirmation) {
      setModeConfirmOpen(true);
      return;
    }
    await save();
  }

  return (
    <form className="space-y-4 lg:max-w-[640px]" onSubmit={(event) => void onSubmit(event)}>
      <div className="space-y-2">
        <Label htmlFor="edit-name">Name</Label>
        <Input
          id="edit-name"
          value={name}
          disabled={pending || archived}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-description">Description · optional</Label>
        <Input
          id="edit-description"
          value={description}
          disabled={pending || archived}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Currency</Label>
        <Input value={goal.currency} disabled readOnly />
        <p className="text-sm text-muted-foreground">
          Editable until this goal has financial activity.
        </p>
      </div>

      <fieldset className="space-y-2" disabled={pending || archived}>
        <legend className="text-sm text-muted-foreground">Target mode</legend>
        <RadioGroup
          value={targetMode}
          onValueChange={(value) => setTargetMode(value as 'fixed' | 'items')}
          disabled={pending || archived}
          className="grid grid-cols-2 gap-3"
        >
          <RadioGroupItem value="fixed" presentation="card" className="min-h-14">
            An amount
          </RadioGroupItem>
          <RadioGroupItem value="items" presentation="card" className="min-h-14">
            A list of things
          </RadioGroupItem>
        </RadioGroup>
      </fieldset>

      {targetMode === 'fixed' ? (
        <div className="space-y-2">
          <Label htmlFor="edit-target">Target</Label>
          <MoneyInput
            id="edit-target"
            currency={goal.currency}
            value={fixedTarget}
            disabled={pending || archived}
            onChange={(event) => setFixedTarget(event.target.value)}
          />
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Start planning</Label>
          <Select value={startMonth} onValueChange={setStartMonth} disabled={pending || archived}>
            <SelectTrigger aria-label="Start planning">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Finish by</Label>
          <Select
            value={finalMonth || '__none__'}
            onValueChange={(value) => setFinalMonth(value === '__none__' ? '' : value)}
            disabled={pending || archived}
          >
            <SelectTrigger aria-label="Finish by">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Open</SelectItem>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <fieldset className="space-y-2" disabled={pending || archived}>
        <legend className="text-sm text-muted-foreground">Contributions per month</legend>
        <RadioGroup
          value={String(contributionsPerMonth)}
          onValueChange={(value) => setContributionsPerMonth(Number(value) as 1 | 2)}
          disabled={pending || archived}
          className="grid grid-cols-2 gap-3"
        >
          <RadioGroupItem value="1" presentation="card" className="min-h-12 p-3 text-center">
            Once
          </RadioGroupItem>
          <RadioGroupItem value="2" presentation="card" className="min-h-12 p-3 text-center">
            Twice
          </RadioGroupItem>
        </RadioGroup>
      </fieldset>

      {!finalMonth ? (
        <div className="space-y-2">
          <Label htmlFor="edit-preferred-contribution">
            Preferred amount per contribution{' '}
            <span className="text-muted-foreground">· optional</span>
          </Label>
          <MoneyInput
            id="edit-preferred-contribution"
            currency={goal.currency}
            value={formatMoneyInput(preferredContribution)}
            disabled={pending || archived}
            onChange={(event) => setPreferredContribution(event.target.value)}
            placeholder="Leave empty to get a recommendation"
          />
        </div>
      ) : null}

      {preview && preview.impacts.length > 0 ? (
        <Card className="border-warning-border bg-warning-surface">
          <CardContent className="space-y-2 p-4">
            <h2 className="font-semibold text-[color:var(--gt-status-at-risk)]">
              What this change does
            </h2>
            {preview.impacts.map((impact) => (
              <div
                key={`${impact.kind}-${impact.label}`}
                className="flex justify-between gap-3 text-sm"
              >
                <span>{impact.label}</span>
                <span data-money>
                  {impact.before ?? '—'} → {impact.after ?? '—'}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-status-behind">
          {error}
        </p>
      ) : null}

      {!archived ? (
        <Button type="submit" className="w-full min-h-12" disabled={pending}>
          {pending ? 'Saving…' : 'Save changes'}
        </Button>
      ) : (
        <Button
          type="button"
          className="w-full"
          disabled={pending}
          onClick={() => {
            setPending(true);
            void api
              .restoreGoal(session, goal.id)
              .then((updated) => {
                onChanged(updated);
                onMessage(`${updated.name} is active again.`);
              })
              .catch((err: unknown) => {
                if (err instanceof ApiRequestError && err.status === 401) {
                  onSessionExpired();
                  return;
                }
                setError(err instanceof Error ? err.message : 'Restore failed.');
              })
              .finally(() => setPending(false));
          }}
        >
          Restore goal
        </Button>
      )}

      <div className="grid grid-cols-2 gap-3">
        {!archived ? (
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => setArchiveOpen(true)}
          >
            Archive goal
          </Button>
        ) : (
          <span />
        )}
        <Button
          type="button"
          variant="ghost"
          className="text-status-behind"
          disabled={pending}
          onClick={() => setDeleteOpen(true)}
        >
          Delete goal
        </Button>
      </div>

      <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {goal.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              It leaves your active list and stops accepting planning changes until restored.
              Everything it holds stays exactly as it is.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setPending(true);
                void api
                  .archiveGoal(session, goal.id)
                  .then((updated) => {
                    onChanged(updated);
                    setArchiveOpen(false);
                    onMessage(`${updated.name} was archived.`);
                  })
                  .catch((err: unknown) => {
                    if (err instanceof ApiRequestError && err.status === 401) {
                      onSessionExpired();
                      return;
                    }
                    setError(err instanceof Error ? err.message : 'Archive failed.');
                  })
                  .finally(() => setPending(false));
              }}
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-status-behind">
              Delete {goal.name} permanently
            </AlertDialogTitle>
            <AlertDialogDescription>
              This erases the goal and its {goal.items.length} items. There&apos;s no undo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="confirm-name">Type the goal name to confirm</Label>
            <Input
              id="confirm-name"
              value={confirmationName}
              placeholder={goal.name}
              onChange={(event) => setConfirmationName(event.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="danger"
              disabled={pending || confirmationName.trim() !== goal.name}
              onClick={() => {
                setPending(true);
                void api
                  .deleteGoal(session, goal.id, { confirmationName: confirmationName.trim() })
                  .then(() => {
                    setDeleteOpen(false);
                    onDeleted();
                  })
                  .catch((err: unknown) => {
                    if (err instanceof ApiRequestError && err.status === 401) {
                      onSessionExpired();
                      return;
                    }
                    setError(err instanceof Error ? err.message : 'Delete failed.');
                  })
                  .finally(() => setPending(false));
              }}
            >
              Delete {goal.name}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={modeConfirmOpen} onOpenChange={setModeConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {targetMode === 'items'
                ? 'Let the items decide the target?'
                : 'Switch back to a fixed amount?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {preview?.impacts
                .map(
                  (impact) => `${impact.label}: ${impact.before ?? '—'} → ${impact.after ?? '—'}`,
                )
                .join('. ') || 'Review the planning impact before confirming.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setTargetMode(goal.targetMode);
                setModeConfirmOpen(false);
              }}
            >
              Keep current mode
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => void save({ confirmTargetModeChange: true })}>
              Confirm change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
