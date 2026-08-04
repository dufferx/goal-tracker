import type { CreateGoalRequest, Profile } from '@goal-tracker/contracts';
import { Alert, AlertDescription } from '@goal-tracker/ui/components/alert';
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
import { ArrowLeft } from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';

import { MoneyInput } from '../../components/money-input';
import { ApiRequestError, type GoalTrackerApi } from '../../lib/api';
import type { AuthSession } from '../../lib/auth';
import { formatMoney, monthOptions, normalizeMoneyInput } from '../../lib/format';

type DraftItem = { key: string; name: string; expectedPrice: string; dueMonth: string };

const months = monthOptions(2025, 6);

function currentMonthValue() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function GoalCreatePage({
  api,
  session,
  profile,
  onCancel,
  onCreated,
  onSessionExpired,
}: {
  api: GoalTrackerApi;
  session: AuthSession;
  profile: Profile;
  onCancel: () => void;
  onCreated: (goalId: string) => void;
  onSessionExpired: () => void;
}) {
  const designState = import.meta.env.DEV
    ? new URLSearchParams(window.location.search).get('__design')
    : null;
  const [name, setName] = useState(
    designState === 'items' ? 'Home Gym' : designState ? 'Japan Trip' : '',
  );
  const [targetMode, setTargetMode] = useState<'fixed' | 'items'>(
    designState === 'items' ? 'items' : 'fixed',
  );
  const [fixedTarget, setFixedTarget] = useState('3,000');
  const [startMonth, setStartMonth] = useState(currentMonthValue());
  const [finalMonth, setFinalMonth] = useState(
    designState === 'populated' || designState === 'overage' ? '2027-02' : '',
  );
  const [contributionsPerMonth, setContributionsPerMonth] = useState<1 | 2>(2);
  const [preferredContribution, setPreferredContribution] = useState('');
  const [items, setItems] = useState<DraftItem[]>(
    designState === 'items'
      ? [
          {
            key: crypto.randomUUID(),
            name: 'Squat rack',
            expectedPrice: '600',
            dueMonth: '',
          },
          {
            key: crypto.randomUUID(),
            name: 'Bench',
            expectedPrice: '250',
            dueMonth: '',
          },
        ]
      : designState === 'overage'
        ? [
            {
              key: crypto.randomUUID(),
              name: 'Rail pass',
              expectedPrice: '3240',
              dueMonth: '',
            },
          ]
        : [],
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>(
    designState === 'overage' ? 'The planned items exceed the fixed target.' : undefined,
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [overageDecision, setOverageDecision] = useState<'keep_target' | 'increase_target'>();
  const [showOverage, setShowOverage] = useState(designState === 'overage');

  const itemsTotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const normalized = normalizeMoneyInput(item.expectedPrice);
      if (!/^\d+\.\d{2}$/.test(normalized)) return sum;
      return sum + Number(normalized);
    }, 0);
  }, [items]);

  async function submit(decision?: 'keep_target' | 'increase_target') {
    setPending(true);
    setError(undefined);
    setFieldErrors({});
    try {
      const payload: CreateGoalRequest = {
        name: name.trim(),
        currency: profile.defaultCurrency,
        targetMode,
        startMonth,
        finalMonth: finalMonth || null,
        contributionsPerMonth,
        preferredContribution: preferredContribution
          ? normalizeMoneyInput(preferredContribution)
          : null,
        ...(targetMode === 'fixed' ? { fixedTarget: normalizeMoneyInput(fixedTarget) } : {}),
        items: items
          .filter((item) => item.name.trim() && item.expectedPrice.trim())
          .map((item) => ({
            name: item.name.trim(),
            expectedPrice: normalizeMoneyInput(item.expectedPrice),
            dueMonth: item.dueMonth || null,
          })),
        ...(decision ? { overageDecision: decision } : {}),
      };
      const created = await api.createGoal(session, payload);
      onCreated(created.id);
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
        setError(err.message);
        return;
      }
      if (err instanceof ApiRequestError) {
        setError(err.message);
        setFieldErrors(err.fieldErrors ?? {});
        return;
      }
      setError(err instanceof Error ? err.message : 'The goal could not be created.');
    } finally {
      setPending(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void submit(overageDecision);
  }

  const overagePanel = showOverage ? (
    <Card data-design-overage className="border-warning-border bg-warning-surface">
      <CardContent className="space-y-3 p-4">
        <h2 className="font-semibold text-[color:var(--gt-status-at-risk)]">
          Your items now add up to more than the target
        </h2>
        <p className="text-sm text-muted-foreground">{error}</p>
        <RadioGroup
          value={overageDecision}
          onValueChange={(value) => setOverageDecision(value as 'increase_target' | 'keep_target')}
          className="space-y-2"
        >
          <RadioGroupItem value="increase_target" presentation="card">
            <p className="font-semibold">
              Raise the target to {formatMoney(itemsTotal.toFixed(2), profile.defaultCurrency)}
            </p>
          </RadioGroupItem>
          <RadioGroupItem value="keep_target" presentation="card">
            <p className="font-semibold">
              Keep{' '}
              {formatMoney(normalizeMoneyInput(fixedTarget) || '0.00', profile.defaultCurrency)}
            </p>
            <p className="text-sm text-muted-foreground">
              The over-allocation stays visible on the items screen.
            </p>
          </RadioGroupItem>
        </RadioGroup>
        <Button
          type="button"
          disabled={pending || !overageDecision}
          onClick={() => void submit(overageDecision)}
        >
          Continue
        </Button>
      </CardContent>
    </Card>
  ) : null;

  return (
    <form
      className="mx-auto min-h-dvh w-full max-w-[390px] space-y-4 px-[17px] pb-8 pt-3 lg:min-h-0 lg:max-w-[680px] lg:px-0 lg:pt-0"
      onSubmit={onSubmit}
    >
      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="ghost" className="px-2" onClick={onCancel} aria-label="Back">
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-lg font-semibold">New goal</h1>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="goal-name">Name</Label>
        <Input
          id="goal-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={pending}
          required
        />
        {fieldErrors.name?.[0] ? (
          <p role="alert" className="text-sm text-status-behind">
            {fieldErrors.name[0]}
          </p>
        ) : null}
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm text-muted-foreground">What decides the target?</legend>
        <RadioGroup
          value={targetMode}
          onValueChange={(value) => setTargetMode(value as 'fixed' | 'items')}
          disabled={pending}
          className="grid grid-cols-2 gap-3"
        >
          <RadioGroupItem value="fixed" presentation="card" className="min-h-[67px] p-3">
            <p className="font-semibold">An amount</p>
            <p className="mt-2 text-sm text-muted-foreground">I know the total</p>
          </RadioGroupItem>
          <RadioGroupItem value="items" presentation="card" className="min-h-[67px] p-3">
            <p className="font-semibold">A list of things</p>
            <p className="mt-2 text-sm text-muted-foreground">Add up the prices</p>
          </RadioGroupItem>
        </RadioGroup>
      </fieldset>

      {targetMode === 'fixed' ? (
        <div className="space-y-2">
          <Label htmlFor="fixed-target">Target</Label>
          <MoneyInput
            id="fixed-target"
            currency={profile.defaultCurrency}
            value={fixedTarget}
            onChange={(event) => setFixedTarget(event.target.value)}
            disabled={pending}
            required
          />
          <p className="text-xs leading-5 text-muted-foreground">
            Currency can change until this goal has financial activity.
          </p>
        </div>
      ) : (
        <Alert>
          <AlertDescription>Item prices add up to the goal target.</AlertDescription>
        </Alert>
      )}

      {overagePanel}

      {targetMode === 'fixed' ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Start planning</Label>
              <Select value={startMonth} onValueChange={setStartMonth} disabled={pending}>
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
              <Label>Finish by · optional</Label>
              <Select
                value={finalMonth || '__none__'}
                onValueChange={(value) => setFinalMonth(value === '__none__' ? '' : value)}
                disabled={pending}
              >
                <SelectTrigger aria-label="Finish by">
                  <SelectValue placeholder="Open" />
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

          <fieldset className="space-y-2">
            <legend className="text-sm text-muted-foreground">Contributions per month</legend>
            <RadioGroup
              value={String(contributionsPerMonth)}
              onValueChange={(value) => setContributionsPerMonth(Number(value) as 1 | 2)}
              disabled={pending}
              className="grid grid-cols-2 gap-3"
            >
              <RadioGroupItem value="1" presentation="card" className="min-h-12 p-3 text-center">
                <span className="font-medium">Once</span>
              </RadioGroupItem>
              <RadioGroupItem value="2" presentation="card" className="min-h-12 p-3 text-center">
                <span className="font-medium">Twice</span>
              </RadioGroupItem>
            </RadioGroup>
            <p className="text-xs leading-5 text-muted-foreground">
              This shapes later recommendations. You can still record as many contributions as you
              like.
            </p>
          </fieldset>

          <div className="space-y-2">
            <Label htmlFor="preferred">Preferred amount per contribution · optional</Label>
            <Input
              id="preferred"
              inputMode="decimal"
              data-money
              placeholder="Leave empty to be told what’s needed"
              value={preferredContribution}
              onChange={(event) => setPreferredContribution(event.target.value)}
              disabled={pending}
            />
          </div>

          <Alert>
            <AlertDescription>
              Your recommended contribution appears after the goal is created.
            </AlertDescription>
          </Alert>
        </>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Things to buy · add now or later</p>
          <div className="space-y-2">
            {items.map((item) => (
              <Card key={item.key}>
                <CardContent className="grid grid-cols-[1fr_auto] items-center gap-3 p-1">
                  <Input
                    aria-label="Item name"
                    className="min-h-10 border-0 bg-transparent focus-visible:ring-0"
                    placeholder="Item name"
                    value={item.name}
                    disabled={pending}
                    onChange={(event) =>
                      setItems((current) =>
                        current.map((entry) =>
                          entry.key === item.key ? { ...entry, name: event.target.value } : entry,
                        ),
                      )
                    }
                  />
                  <Input
                    aria-label="Expected price"
                    inputMode="decimal"
                    data-money
                    className="min-h-10 w-28 border-0 bg-transparent text-right focus-visible:ring-0"
                    placeholder="0.00"
                    value={item.expectedPrice}
                    disabled={pending}
                    onChange={(event) =>
                      setItems((current) =>
                        current.map((entry) =>
                          entry.key === item.key
                            ? { ...entry, expectedPrice: event.target.value }
                            : entry,
                        ),
                      )
                    }
                  />
                </CardContent>
              </Card>
            ))}
            <Button
              type="button"
              variant="outline"
              className="w-full border-dashed bg-transparent"
              disabled={pending}
              onClick={() =>
                setItems((current) => [
                  ...current,
                  {
                    key: crypto.randomUUID(),
                    name: '',
                    expectedPrice: '',
                    dueMonth: '',
                  },
                ])
              }
            >
              Add another
            </Button>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Target so far</span>
            <span data-money className="font-semibold">
              {formatMoney(itemsTotal.toFixed(2), profile.defaultCurrency)}
            </span>
          </div>
        </div>
      )}

      {error && !showOverage ? (
        <p role="alert" className="text-sm text-status-behind">
          {error}
        </p>
      ) : null}

      {!showOverage ? (
        <Button type="submit" className="w-full min-h-12" disabled={pending}>
          {pending ? 'Creating…' : 'Create goal'}
        </Button>
      ) : null}
    </form>
  );
}
