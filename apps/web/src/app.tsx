import { Alert, AlertDescription, AlertTitle } from '@goal-tracker/ui/components/alert';
import { Button } from '@goal-tracker/ui/components/button';
import { Card, CardContent } from '@goal-tracker/ui/components/card';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@goal-tracker/ui/components/drawer';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@goal-tracker/ui/components/dialog';
import { Input } from '@goal-tracker/ui/components/input';
import { Label } from '@goal-tracker/ui/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@goal-tracker/ui/components/select';
import { Skeleton } from '@goal-tracker/ui/components/skeleton';
import { ArrowLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';
import type {
  DeploymentCapabilities,
  GoalDetail,
  Profile,
  UpdateProfileRequest,
} from '@goal-tracker/contracts';
import { type FormEvent, useEffect, useState } from 'react';

import { AppShell } from './components/app-shell';
import { useDesktopLayout } from './components/use-desktop-layout';
import { AuthShell, PageHeader } from './components/auth-shell';
import { GoalsDashboard } from './features/goals/dashboard';
import { GoalCreatePage } from './features/goals/goal-create';
import { GoalDetailPage } from './features/goals/goal-detail';
import { ContributionDrawer, FinancialHistoryPage } from './features/goals/financial';
import { SimulatorPage } from './features/goals/simulator';
import { OnboardingWelcome } from './features/goals/onboarding';
import { ApiRequestError, type GoalTrackerApi } from './lib/api';
import type { AuthGateway, AuthSession } from './lib/auth';
import type { GoalList } from '@goal-tracker/contracts';

const currencyNames = new Intl.DisplayNames(['en'], { type: 'currency' });
const currencies = Intl.supportedValuesOf('currency').map(
  (code) => [code, currencyNames.of(code) ?? code] as const,
);

type Route =
  | 'sign-in'
  | 'register'
  | 'forgot-password'
  | 'update-password'
  | 'settings'
  | 'goals'
  | 'goal-create'
  | 'goal-detail'
  | 'goal-history'
  | 'goal-items'
  | 'goal-simulator';

function currentRoute(): Route {
  const path = window.location.pathname;
  if (path === '/register') return 'register';
  if (path === '/forgot-password') return 'forgot-password';
  if (path === '/update-password' || path === '/auth/callback') return 'update-password';
  if (path === '/settings') return 'settings';
  if (path === '/goals/new') return 'goal-create';
  if (path === '/goals') return 'goals';
  const historyMatch = /^\/goals\/([^/]+)\/history$/.exec(path);
  if (historyMatch) return 'goal-history';
  const itemsMatch = /^\/goals\/([^/]+)\/items$/.exec(path);
  if (itemsMatch) return 'goal-items';
  const simulatorMatch = /^\/goals\/([^/]+)\/simulator$/.exec(path);
  if (simulatorMatch) return 'goal-simulator';
  const detailMatch = /^\/goals\/([^/]+)$/.exec(path);
  if (detailMatch) return 'goal-detail';
  return 'sign-in';
}

function currentGoalId(): string | undefined {
  const match = /^\/goals\/([^/]+)/.exec(window.location.pathname);
  return match?.[1] === 'new' ? undefined : match?.[1];
}

function navigate(route: Route, goalId?: string) {
  const paths: Record<Route, string> = {
    'sign-in': '/',
    register: '/register',
    'forgot-password': '/forgot-password',
    'update-password': '/update-password',
    settings: '/settings',
    goals: '/goals',
    'goal-create': '/goals/new',
    'goal-detail': goalId ? `/goals/${goalId}` : '/goals',
    'goal-history': goalId ? `/goals/${goalId}/history` : '/goals',
    'goal-items': goalId ? `/goals/${goalId}/items` : '/goals',
    'goal-simulator': goalId ? `/goals/${goalId}/simulator` : '/goals',
  };
  window.history.pushState({}, '', paths[route]);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function unexpectedErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function ErrorText({ id, children }: { id?: string; children?: string }) {
  return children ? (
    <p id={id} role="alert" className="text-sm text-status-behind">
      {children}
    </p>
  ) : null;
}

function PasswordField({
  value,
  onChange,
  error,
  autoComplete,
  recoveryAction,
  showStrength = false,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete: string;
  recoveryAction?: () => void;
  showStrength?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const strength = passwordStrength(value);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="password">Password</Label>
        {recoveryAction ? (
          <Button
            type="button"
            variant="ghost"
            className="min-h-11 px-1 text-sm"
            onClick={recoveryAction}
          >
            Forgot?
          </Button>
        ) : null}
      </div>
      <div className="relative">
        <Input
          id="password"
          name="password"
          className="pr-12"
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'password-error' : undefined}
          onChange={(event) => onChange(event.target.value)}
        />
        <Button
          type="button"
          variant="ghost"
          className="absolute inset-y-0 right-1 my-auto size-11 min-h-11 px-0 text-text-secondary hover:text-primary"
          aria-label={visible ? 'Hide password' : 'Show password'}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? (
            <EyeOff aria-hidden="true" className="size-5" />
          ) : (
            <Eye aria-hidden="true" className="size-5" />
          )}
        </Button>
      </div>
      {showStrength ? (
        <div
          aria-label={`Password strength: ${strength} of 4`}
          className="grid grid-cols-4 gap-1.5"
        >
          {[1, 2, 3, 4].map((segment) => (
            <span
              key={segment}
              className={
                segment <= strength
                  ? 'h-[3px] rounded-pill bg-primary'
                  : 'h-[3px] rounded-pill bg-control'
              }
            />
          ))}
        </div>
      ) : null}
      <ErrorText id="password-error">{error}</ErrorText>
    </div>
  );
}

function passwordStrength(value: string): number {
  if (!value) return 0;
  let score = value.length >= 8 ? 1 : 0;
  if (value.length >= 12) score += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
  if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) score += 1;
  return Math.min(score, 4);
}

function SignInPage({
  auth,
  registrationEnabled,
}: {
  auth: AuthGateway;
  registrationEnabled: boolean;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(undefined);
    try {
      const result = await auth.signIn(email.trim(), password);
      if (result.error) setError(result.error);
    } catch (unexpectedError) {
      setError(unexpectedErrorMessage(unexpectedError, 'Sign in is temporarily unavailable.'));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthShell showMark>
      <PageHeader title="Welcome back" description="Your goals are where you left them." />
      <form className="space-y-4" onSubmit={submit}>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <PasswordField
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          recoveryAction={() => navigate('forgot-password')}
        />
        <ErrorText>{error}</ErrorText>
        <Button className="min-h-12 w-full" disabled={pending}>
          {pending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      <p className="mt-auto pt-8 text-center text-sm text-text-secondary">
        {registrationEnabled ? (
          <>
            New here?{' '}
            <Button
              type="button"
              variant="ghost"
              className="min-h-11 px-1 align-baseline"
              onClick={() => navigate('register')}
            >
              Create an account
            </Button>
          </>
        ) : (
          'Accounts are created by this deployment’s administrator.'
        )}
      </p>
    </AuthShell>
  );
}

function RegisterPage({
  auth,
  registrationEnabled,
}: {
  auth: AuthGateway;
  registrationEnabled: boolean;
}) {
  const designFilled =
    import.meta.env.DEV &&
    new URLSearchParams(window.location.search).get('__design') === 'public-signup-filled';
  const [email, setEmail] = useState(designFilled ? 'alex@example.com' : '');
  const [password, setPassword] = useState(designFilled ? 'Strong-password-42' : '');
  const [currency, setCurrency] = useState('USD');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [passwordError, setPasswordError] = useState<string>();
  const [created, setCreated] = useState(false);

  if (!registrationEnabled) {
    return (
      <AuthShell>
        <Alert>
          <AlertTitle>Registration is closed on this instance</AlertTitle>
          <AlertDescription>
            The person who runs this deployment has turned off public sign-up. Ask them to create an
            account for you.
          </AlertDescription>
          <Button className="mt-3" variant="outline" onClick={() => navigate('sign-in')}>
            Back to sign in
          </Button>
        </Alert>
      </AuthShell>
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password.length < 8) {
      setPasswordError('Use at least 8 characters.');
      return;
    }
    setPending(true);
    setError(undefined);
    setPasswordError(undefined);
    try {
      const result = await auth.signUp(email.trim(), password, currency);
      if (result.error) setError(result.error);
      else setCreated(true);
    } catch (unexpectedError) {
      setError(
        unexpectedErrorMessage(unexpectedError, 'Account creation is temporarily unavailable.'),
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthShell>
      <Button
        type="button"
        variant="ghost"
        className="-mt-2 mb-3 min-h-11 w-11 justify-start px-0 text-text-secondary"
        aria-label="Back to sign in"
        onClick={() => navigate('sign-in')}
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
      </Button>
      <PageHeader
        title="Create your account"
        description="Your goals are private to your account."
      />
      {created ? (
        <Alert variant="success">
          <AlertTitle>Account created</AlertTitle>
          <AlertDescription>
            If this deployment requires email confirmation, confirm your address before signing in.
          </AlertDescription>
          <Button className="mt-3 w-full" onClick={() => navigate('sign-in')}>
            Continue to sign in
          </Button>
        </Alert>
      ) : (
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <PasswordField
            value={password}
            onChange={setPassword}
            error={passwordError}
            autoComplete="new-password"
            showStrength
          />
          <div className="space-y-2">
            <Label htmlFor="currency">Default currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map(([code, name]) => (
                  <SelectItem key={code} value={code}>
                    {code} — {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs leading-5 text-text-tertiary">
              Each goal keeps one currency. This is only the default for new goals.
            </p>
          </div>
          <ErrorText>{error}</ErrorText>
          <Button className="min-h-12 w-full" disabled={pending}>
            {pending ? 'Creating account…' : 'Create account'}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}

function RecoveryPage({ auth, emailAvailable }: { auth: AuthGateway; emailAvailable: boolean }) {
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(undefined);
    const redirectTo = new URL('/update-password', window.location.origin).toString();
    try {
      const result = await auth.requestPasswordReset(email.trim(), redirectTo);
      if (result.error) setError(result.error);
      else setMessage('If that account exists, a reset link has been sent.');
    } catch (unexpectedError) {
      setError(
        unexpectedErrorMessage(unexpectedError, 'Password recovery is temporarily unavailable.'),
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthShell>
      <Button
        type="button"
        variant="ghost"
        className="-mt-2 mb-3 min-h-11 w-11 justify-start px-0 text-text-secondary"
        aria-label="Back to sign in"
        onClick={() => navigate('sign-in')}
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
      </Button>
      <PageHeader
        title="Reset your password"
        description={emailAvailable ? "We'll email a link. It expires in one hour." : undefined}
      />
      {emailAvailable ? (
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          {message ? <Alert variant="success">{message}</Alert> : null}
          <ErrorText>{error}</ErrorText>
          <Button className="min-h-12 w-full" disabled={pending}>
            {pending ? 'Sending…' : 'Send link'}
          </Button>
        </form>
      ) : (
        <Alert>
          <AlertTitle>This instance can't send email</AlertTitle>
          <AlertDescription>
            No mail server is configured, so there’s no reset link to send. Contact the person who
            runs this deployment. Administrators can follow the committed Manual password reset
            procedure.
          </AlertDescription>
        </Alert>
      )}
    </AuthShell>
  );
}

function UpdatePasswordPage({ auth, session }: { auth: AuthGateway; session: AuthSession | null }) {
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [passwordError, setPasswordError] = useState<string>();
  const [updated, setUpdated] = useState(false);

  if (!session) {
    return (
      <AuthShell>
        <PageHeader title="This reset link is no longer valid" />
        <p className="mb-5 text-text-secondary">Request a new link to continue.</p>
        <Button onClick={() => navigate('forgot-password')}>Request a new link</Button>
      </AuthShell>
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password.length < 8) {
      setPasswordError('Use at least 8 characters.');
      return;
    }
    setPending(true);
    setError(undefined);
    setPasswordError(undefined);
    try {
      const result = await auth.updatePassword(password);
      if (result.error) setError(result.error);
      else setUpdated(true);
    } catch (unexpectedError) {
      setError(
        unexpectedErrorMessage(unexpectedError, 'The password could not be updated right now.'),
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthShell>
      <PageHeader title="Choose a new password" description="Use at least 8 characters." />
      {updated ? (
        <Alert variant="success">
          <AlertTitle>Password updated</AlertTitle>
          <Button className="mt-3" onClick={() => navigate('settings')}>
            Continue to settings
          </Button>
        </Alert>
      ) : (
        <form className="space-y-4" onSubmit={submit}>
          <PasswordField
            value={password}
            onChange={setPassword}
            error={passwordError}
            autoComplete="new-password"
          />
          <ErrorText>{error}</ErrorText>
          <Button className="min-h-12 w-full" disabled={pending}>
            {pending ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}

function SettingsSkeleton() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-[620px] space-y-4 px-4 py-8">
      <Skeleton className="h-9 w-32" />
      <Skeleton className="h-24 w-full rounded-card" />
      <Skeleton className="h-28 w-full rounded-card" />
      <Skeleton className="h-16 w-full rounded-card" />
    </main>
  );
}

function GoalsHome({
  api,
  session,
  onSessionExpired,
  onCreate,
  onOpenGoal,
  onOpenItems,
  onNavigateGoals,
  onNavigateSettings,
}: {
  api: GoalTrackerApi;
  session: AuthSession;
  onSessionExpired: () => void;
  onCreate: () => void;
  onOpenGoal: (goalId: string) => void;
  onOpenItems: (goalId: string) => void;
  onNavigateGoals: () => void;
  onNavigateSettings: () => void;
}) {
  const [list, setList] = useState<GoalList>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [filter, setFilter] = useState<'active' | 'archived'>(
    import.meta.env.DEV &&
      new URLSearchParams(window.location.search).get('__design') === 'archived'
      ? 'archived'
      : 'active',
  );
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [contributionGoal, setContributionGoal] = useState<GoalDetail>();
  const desktop = useDesktopLayout();

  async function openContribution() {
    const active = list?.active ?? [];
    if (active.length === 1) {
      setContributionGoal(await api.getGoal(session, active[0]!.id));
      return;
    }
    setSelectedGoalId(active[0]?.id ?? '');
    setPickerOpen(true);
  }

  async function load() {
    setLoading(true);
    setError(undefined);
    try {
      const next = await api.listGoals(session);
      setList(next);
      setShowOnboarding(next.active.length === 0 && next.archived.length === 0);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        onSessionExpired();
        return;
      }
      setError(err instanceof Error ? err.message : 'The server did not answer');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [session.accessToken]);

  if (showOnboarding && !loading && !error) {
    return (
      <AppShell
        active="goals"
        onNavigateGoals={onNavigateGoals}
        onNavigateSettings={onNavigateSettings}
      >
        <OnboardingWelcome onCreate={onCreate} onBrowse={() => setShowOnboarding(false)} />
      </AppShell>
    );
  }

  const chooseGoal = (
    <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
      <SelectTrigger aria-label="Goal">
        <SelectValue placeholder="Choose a goal" />
      </SelectTrigger>
      <SelectContent>
        {list?.active.map((goal) => (
          <SelectItem key={goal.id} value={goal.id}>
            {goal.name} · {goal.currency}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
  const continueContribution = (
    <Button
      disabled={!selectedGoalId}
      onClick={() =>
        void api.getGoal(session, selectedGoalId).then((goal) => {
          setContributionGoal(goal);
          setPickerOpen(false);
        })
      }
    >
      Continue
    </Button>
  );

  return (
    <AppShell
      active="goals"
      onNavigateGoals={onNavigateGoals}
      onNavigateSettings={onNavigateSettings}
      rail={{
        kind: 'product',
        activeCount: list?.active.length,
        archivedCount: list?.archived.length,
      }}
      {...((list?.active.length ?? 0) > 0
        ? { onAddContribution: () => void openContribution() }
        : {})}
    >
      <GoalsDashboard
        list={list}
        loading={loading}
        error={error}
        filter={filter}
        onFilterChange={setFilter}
        onRetry={() => void load()}
        onCreate={onCreate}
        onOpenGoal={onOpenGoal}
        onOpenItems={onOpenItems}
      />
      {desktop ? (
        <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
          <DialogContent className="max-w-[480px]" showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>Add contribution</DialogTitle>
              <DialogDescription>Choose the goal that receives this money.</DialogDescription>
            </DialogHeader>
            {chooseGoal}
            <DialogFooter>{continueContribution}</DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={pickerOpen} onOpenChange={setPickerOpen}>
          <DrawerContent className="mx-auto max-w-[390px] rounded-t-[22px] border-border bg-raised shadow-sheet">
            <DrawerHeader>
              <DrawerTitle>Add contribution</DrawerTitle>
              <DrawerDescription>Choose the goal that receives this money.</DrawerDescription>
            </DrawerHeader>
            <div className="px-4">{chooseGoal}</div>
            <DrawerFooter>{continueContribution}</DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}
      {contributionGoal ? (
        <ContributionDrawer
          open
          api={api}
          session={session}
          goal={contributionGoal}
          onOpenChange={(open) => !open && setContributionGoal(undefined)}
          onReconciled={async () => {
            await load();
          }}
        />
      ) : null}
    </AppShell>
  );
}

function SettingsPage({
  api,
  auth,
  session,
  capabilities,
  onSessionExpired,
}: {
  api: GoalTrackerApi;
  auth: AuthGateway;
  session: AuthSession;
  capabilities: DeploymentCapabilities;
  onSessionExpired: () => void;
}) {
  const [profile, setProfile] = useState<Profile>();
  const [loadError, setLoadError] = useState<string>();
  const [displayName, setDisplayName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  const [saved, setSaved] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(true);
  const [signOutPending, setSignOutPending] = useState(false);
  const [signOutError, setSignOutError] = useState<string>();

  async function load() {
    setLoadError(undefined);
    try {
      const next = await api.getProfile(session);
      setProfile(next);
      setDisplayName(next.displayName ?? '');
      setCurrency(next.defaultCurrency);
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) {
        setLoadError('Your session expired. Sign in again.');
        onSessionExpired();
        return;
      }
      setLoadError(error instanceof Error ? error.message : 'Could not load settings.');
    }
  }

  useEffect(() => void load(), [session.accessToken]);

  async function save(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setSaveError(undefined);
    setSaved(false);
    const input: UpdateProfileRequest = {
      displayName: displayName.trim() || null,
      defaultCurrency: currency,
    };
    try {
      const next = await api.updateProfile(session, input);
      setProfile(next);
      setEditing(false);
      setSaved(true);
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) {
        setSaveError('Your session expired. Sign in again.');
        onSessionExpired();
        return;
      }
      setSaveError(error instanceof Error ? error.message : 'Could not save settings.');
    } finally {
      setPending(false);
    }
  }

  async function signOut() {
    setSignOutPending(true);
    setSignOutError(undefined);
    try {
      const result = await auth.signOut();
      if (result.error) setSignOutError(result.error);
    } catch (unexpectedError) {
      setSignOutError(
        unexpectedErrorMessage(unexpectedError, 'Sign out is temporarily unavailable.'),
      );
    } finally {
      setSignOutPending(false);
    }
  }

  if (!profile && !loadError) return <SettingsSkeleton />;

  return (
    <div className="mx-auto w-full max-w-[620px]">
      <h1 className="mb-5 text-[27px] font-semibold tracking-[-0.025em]">Settings</h1>
      {loadError ? (
        <Alert variant="error" className="mb-4">
          <AlertTitle>Settings could not load</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
          <Button variant="outline" className="mt-3" onClick={load}>
            Try again
          </Button>
        </Alert>
      ) : null}
      {profile ? (
        <>
          <Button
            type="button"
            variant="outline"
            className="mb-3 min-h-[74px] w-full justify-start rounded-card bg-card px-4 text-left"
            onClick={() => setEditing(true)}
          >
            <div
              aria-hidden="true"
              className="grid size-11 place-items-center rounded-pill bg-control text-lg text-primary"
            >
              {(profile.displayName || session.email).slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-semibold">{profile.displayName || 'No display name'}</p>
              <p className="truncate text-sm text-text-tertiary">{session.email}</p>
            </div>
            <ChevronRight aria-hidden="true" className="ml-auto size-4 text-text-tertiary" />
          </Button>
          {editing ? (
            <Card className="mb-3">
              <CardContent className="p-4">
                <form className="space-y-4" onSubmit={save}>
                  <div className="space-y-2">
                    <Label htmlFor="display-name">Display name</Label>
                    <Input
                      id="display-name"
                      maxLength={100}
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="settings-currency">Default currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger id="settings-currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map(([code, name]) => (
                          <SelectItem key={code} value={code}>
                            {code} — {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <ErrorText>{saveError}</ErrorText>
                  <div className="flex gap-2">
                    <Button className="flex-1" disabled={pending}>
                      {pending ? 'Saving…' : 'Save changes'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditing(false)}
                      disabled={pending}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="mb-3 min-h-14 w-full justify-start rounded-card bg-card px-4 font-normal"
              onClick={() => setEditing(true)}
            >
              <span>Default currency</span>
              <span className="ml-auto font-mono text-text-secondary">
                {profile.defaultCurrency}
              </span>
            </Button>
          )}
          {saved ? (
            <Alert variant="success" className="mb-3">
              Settings saved.
            </Alert>
          ) : null}
        </>
      ) : null}
      <Card className="mb-3 divide-y divide-hairline">
        <Button
          type="button"
          variant="ghost"
          className="min-h-14 w-full justify-start rounded-none px-4 text-foreground"
          onClick={() => navigate('update-password')}
        >
          Change password
          <ChevronRight aria-hidden="true" className="ml-auto size-4 text-text-tertiary" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="min-h-14 w-full justify-start rounded-none px-4 text-foreground"
          aria-expanded={aboutOpen}
          onClick={() => setAboutOpen((current) => !current)}
        >
          About this deployment
          <ChevronRight
            aria-hidden="true"
            className={`ml-auto size-4 text-text-tertiary transition-transform ${aboutOpen ? 'rotate-90' : ''}`}
          />
        </Button>
      </Card>
      {aboutOpen ? (
        <Card className="mb-3">
          <CardContent className="p-4">
            <h2 className="mb-3 font-semibold">About this deployment</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-text-secondary">Version</dt>
                <dd data-date>development</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-secondary">Registration</dt>
                <dd>{capabilities.registrationEnabled ? 'Open' : 'Closed'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-secondary">Password reset email</dt>
                <dd>
                  {capabilities.passwordRecoveryEmailEnabled ? 'Configured' : 'Not configured'}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-sm leading-5 text-text-tertiary">
              Backups are managed by the person who runs this deployment.
            </p>
          </CardContent>
        </Card>
      ) : null}
      <ErrorText>{signOutError}</ErrorText>
      <Button
        variant="outline"
        className="mt-3 min-h-14 w-full justify-start rounded-card bg-card"
        disabled={signOutPending}
        onClick={() => void signOut()}
      >
        {signOutPending ? 'Signing out…' : 'Sign out'}
      </Button>
    </div>
  );
}

function AuthenticatedApp({
  api,
  auth,
  session,
  capabilities,
  route,
  onSessionExpired,
}: {
  api: GoalTrackerApi;
  auth: AuthGateway;
  session: AuthSession;
  capabilities: DeploymentCapabilities;
  route: Route;
  onSessionExpired: () => void;
}) {
  const [profile, setProfile] = useState<Profile>();
  const [goalContributionSignal, setGoalContributionSignal] = useState(0);
  const [goalEditSignal, setGoalEditSignal] = useState(0);
  const [goalContext, setGoalContext] = useState<'overview' | 'items' | 'edit'>('overview');
  const goalId = currentGoalId();

  function goalRail(active: 'overview' | 'items' | 'history' | 'simulator' | 'edit') {
    return {
      kind: 'goal' as const,
      active,
      onAllGoals: () => navigate('goals'),
      onOverview: () => goalId && navigate('goal-detail', goalId),
      onItems: () => goalId && navigate('goal-items', goalId),
      onHistory: () => goalId && navigate('goal-history', goalId),
      onSimulator: () => goalId && navigate('goal-simulator', goalId),
      onEdit: () => {
        setGoalEditSignal((value) => value + 1);
        if (goalId) navigate('goal-detail', goalId);
      },
    };
  }

  useEffect(() => {
    void api
      .getProfile(session)
      .then(setProfile)
      .catch((error: unknown) => {
        if (error instanceof ApiRequestError && error.status === 401) {
          onSessionExpired();
        }
      });
  }, [api, session, onSessionExpired]);

  if (route === 'settings') {
    return (
      <AppShell
        active="settings"
        onNavigateGoals={() => navigate('goals')}
        onNavigateSettings={() => navigate('settings')}
      >
        <SettingsPage
          api={api}
          auth={auth}
          session={session}
          capabilities={capabilities}
          onSessionExpired={onSessionExpired}
        />
      </AppShell>
    );
  }

  if (route === 'goal-create') {
    if (!profile) {
      return (
        <AppShell
          active="goals"
          contentMode="edge"
          showMobileNavigation={false}
          onNavigateGoals={() => navigate('goals')}
          onNavigateSettings={() => navigate('settings')}
        >
          <SettingsSkeleton />
        </AppShell>
      );
    }
    return (
      <AppShell
        active="goals"
        contentMode="edge"
        showMobileNavigation={false}
        onNavigateGoals={() => navigate('goals')}
        onNavigateSettings={() => navigate('settings')}
      >
        <GoalCreatePage
          api={api}
          session={session}
          profile={profile}
          onCancel={() => navigate('goals')}
          onCreated={() => navigate('goals')}
          onSessionExpired={onSessionExpired}
        />
      </AppShell>
    );
  }

  if ((route === 'goal-detail' || route === 'goal-items') && goalId) {
    return (
      <AppShell
        active="goals"
        contentMode="edge"
        rail={goalRail(route === 'goal-items' ? 'items' : goalContext)}
        onNavigateGoals={() => navigate('goals')}
        onNavigateSettings={() => navigate('settings')}
        onAddContribution={() => {
          setGoalContributionSignal((value) => value + 1);
          navigate('goal-detail', goalId);
        }}
      >
        <GoalDetailPage
          api={api}
          session={session}
          goalId={goalId}
          initialTab={route === 'goal-items' ? 'items' : 'overview'}
          contributionSignal={goalContributionSignal}
          editSignal={goalEditSignal}
          onContextChange={setGoalContext}
          onBack={() =>
            route === 'goal-items' ? navigate('goal-detail', goalId) : navigate('goals')
          }
          onOpenOverview={() => navigate('goal-detail', goalId)}
          onOpenItems={() => navigate('goal-items', goalId)}
          onOpenHistory={() => navigate('goal-history', goalId)}
          onOpenSimulator={() => navigate('goal-simulator', goalId)}
          onDeleted={() => navigate('goals')}
          onSessionExpired={onSessionExpired}
        />
      </AppShell>
    );
  }

  if (route === 'goal-simulator' && goalId) {
    return (
      <AppShell
        active="goals"
        contentMode="edge"
        showMobileNavigation={false}
        rail={goalRail('simulator')}
        onNavigateGoals={() => navigate('goals')}
        onNavigateSettings={() => navigate('settings')}
      >
        <SimulatorPage
          api={api}
          session={session}
          goalId={goalId}
          onBack={() => navigate('goal-detail', goalId)}
        />
      </AppShell>
    );
  }

  if (route === 'goal-history' && goalId) {
    return (
      <AppShell
        active="goals"
        contentMode="edge"
        showMobileNavigation={false}
        rail={goalRail('history')}
        onNavigateGoals={() => navigate('goals')}
        onNavigateSettings={() => navigate('settings')}
      >
        <FinancialHistoryPage
          api={api}
          session={session}
          goalId={goalId}
          onBack={() => navigate('goal-detail', goalId)}
          onChanged={() => undefined}
        />
      </AppShell>
    );
  }

  return (
    <GoalsHome
      api={api}
      session={session}
      onSessionExpired={onSessionExpired}
      onCreate={() => navigate('goal-create')}
      onOpenGoal={(id) => navigate('goal-detail', id)}
      onOpenItems={(id) => navigate('goal-items', id)}
      onNavigateGoals={() => navigate('goals')}
      onNavigateSettings={() => navigate('settings')}
    />
  );
}

export function App({ auth, api }: { auth: AuthGateway; api: GoalTrackerApi }) {
  const [route, setRoute] = useState(currentRoute);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [capabilities, setCapabilities] = useState<DeploymentCapabilities>();
  const [capabilitiesError, setCapabilitiesError] = useState<string>();

  function expireSession() {
    setSession(null);
    navigate('sign-in');
    void auth.signOut().catch(() => undefined);
  }

  useEffect(() => {
    const onPopState = () => setRoute(currentRoute());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    let active = true;
    void api
      .getCapabilities()
      .then((value) => active && setCapabilities(value))
      .catch((error: unknown) => {
        if (active)
          setCapabilitiesError(
            error instanceof Error ? error.message : 'Deployment information is unavailable.',
          );
      });
    void auth
      .restoreSession()
      .then((value) => {
        if (!active) return;
        setSession(value);
        if (value && currentRoute() === 'sign-in') navigate('goals');
      })
      .catch(() => active && setSession(null))
      .finally(() => active && setRestoring(false));
    const unsubscribe = auth.onChange((_event, value) => {
      setSession(value);
      setRestoring(false);
      if (value && (currentRoute() === 'sign-in' || currentRoute() === 'register')) {
        navigate('goals');
      }
      if (
        !value &&
        (currentRoute() === 'settings' ||
          currentRoute() === 'goals' ||
          currentRoute() === 'goal-create' ||
          currentRoute() === 'goal-detail' ||
          currentRoute() === 'goal-history' ||
          currentRoute() === 'goal-items')
      ) {
        navigate('sign-in');
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [api, auth]);

  if (restoring || (!capabilities && !capabilitiesError)) return <SettingsSkeleton />;

  if (capabilitiesError || !capabilities) {
    return (
      <AuthShell>
        <Alert variant="error">
          <AlertTitle>Goal Tracker is unavailable</AlertTitle>
          <AlertDescription>{capabilitiesError}</AlertDescription>
          <Button className="mt-3" variant="outline" onClick={() => window.location.reload()}>
            Try again
          </Button>
        </Alert>
      </AuthShell>
    );
  }

  if (session && route !== 'update-password') {
    return (
      <AuthenticatedApp
        api={api}
        auth={auth}
        session={session}
        capabilities={capabilities}
        route={route === 'sign-in' || route === 'register' ? 'goals' : route}
        onSessionExpired={expireSession}
      />
    );
  }
  if (route === 'register')
    return <RegisterPage auth={auth} registrationEnabled={capabilities.registrationEnabled} />;
  if (route === 'forgot-password')
    return <RecoveryPage auth={auth} emailAvailable={capabilities.passwordRecoveryEmailEnabled} />;
  if (route === 'update-password') return <UpdatePasswordPage auth={auth} session={session} />;
  return <SignInPage auth={auth} registrationEnabled={capabilities.registrationEnabled} />;
}
