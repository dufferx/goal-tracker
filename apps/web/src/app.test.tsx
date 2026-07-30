import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { DeploymentCapabilities, Profile } from '@goal-tracker/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from './app';
import { ApiRequestError, type GoalTrackerApi } from './lib/api';
import type { AuthGateway, AuthSession } from './lib/auth';

const capabilities = {
  registrationEnabled: true,
  passwordRecoveryEmailEnabled: true,
} as DeploymentCapabilities;

const profile = {
  id: '7b5f9f92-aa08-4c32-b66e-90006fae47b0',
  displayName: 'Alex',
  defaultCurrency: 'USD',
  createdAt: '2026-07-29T12:00:00.000Z',
  updatedAt: '2026-07-29T12:00:00.000Z',
} as Profile;

function authMock(overrides: Partial<AuthGateway> = {}): AuthGateway {
  return {
    restoreSession: vi.fn().mockResolvedValue(null),
    onChange: vi.fn().mockReturnValue(() => undefined),
    signIn: vi.fn().mockResolvedValue({}),
    signUp: vi.fn().mockResolvedValue({}),
    signOut: vi.fn().mockResolvedValue({}),
    requestPasswordReset: vi.fn().mockResolvedValue({}),
    updatePassword: vi.fn().mockResolvedValue({}),
    ...overrides,
  };
}

const emptyGoalList = { active: [], archived: [] };

function apiMock(overrides: Partial<GoalTrackerApi> = {}): GoalTrackerApi {
  return {
    getCapabilities: vi.fn().mockResolvedValue(capabilities),
    getProfile: vi.fn().mockResolvedValue(profile),
    updateProfile: vi.fn().mockResolvedValue(profile),
    listGoals: vi.fn().mockResolvedValue(emptyGoalList),
    getGoal: vi.fn(),
    createGoal: vi.fn(),
    updateGoal: vi.fn(),
    previewPlanning: vi.fn(),
    archiveGoal: vi.fn(),
    restoreGoal: vi.fn(),
    deleteGoal: vi.fn(),
    createItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
    reorderItems: vi.fn(),
    convertPercent: vi.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  window.history.replaceState({}, '', '/');
});

afterEach(cleanup);

describe('M1 web identity flows', () => {
  it('does not flash protected settings while the session is restoring', async () => {
    let resolveSession: (session: AuthSession | null) => void = () => undefined;
    const sessionPromise = new Promise<AuthSession | null>((resolve) => {
      resolveSession = resolve;
    });

    render(<App auth={authMock({ restoreSession: () => sessionPromise })} api={apiMock()} />);

    expect(screen.queryByRole('heading', { name: 'Settings' })).not.toBeInTheDocument();
    resolveSession(null);
    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
  });

  it('retains credentials after a recoverable sign-in error', async () => {
    const auth = authMock({
      signIn: vi.fn().mockResolvedValue({ error: 'Email or password is incorrect.' }),
    });
    render(<App auth={auth} api={apiMock()} />);

    const email = await screen.findByLabelText('Email');
    fireEvent.change(email, { target: { value: 'alex@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'not-it' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Email or password is incorrect.');
    expect(email).toHaveValue('alex@example.com');
    expect(screen.getByLabelText('Password')).toHaveValue('not-it');
  });

  it('recovers from an unexpected sign-in network failure without locking the form', async () => {
    const auth = authMock({
      signIn: vi.fn().mockRejectedValue(new Error('The network is unavailable.')),
    });
    render(<App auth={auth} api={apiMock()} />);

    fireEvent.change(await screen.findByLabelText('Email'), {
      target: { value: 'alex@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'still-here' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('The network is unavailable.');
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled();
    expect(screen.getByLabelText('Email')).toHaveValue('alex@example.com');
    expect(screen.getByLabelText('Password')).toHaveValue('still-here');
  });

  it('shows deployment-controlled registration without a sign-up form', async () => {
    window.history.replaceState({}, '', '/register');
    render(
      <App
        auth={authMock()}
        api={apiMock({
          getCapabilities: vi
            .fn()
            .mockResolvedValue({ ...capabilities, registrationEnabled: false }),
        })}
      />,
    );

    expect(await screen.findByText('Registration is closed on this instance')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Create account' })).not.toBeInTheDocument();
  });

  it('never requests email when recovery delivery is unavailable', async () => {
    window.history.replaceState({}, '', '/forgot-password');
    const auth = authMock();
    render(
      <App
        auth={auth}
        api={apiMock({
          getCapabilities: vi
            .fn()
            .mockResolvedValue({ ...capabilities, passwordRecoveryEmailEnabled: false }),
        })}
      />,
    );

    expect(await screen.findByText("This instance can't send email")).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Send link' })).not.toBeInTheDocument();
    expect(auth.requestPasswordReset).not.toHaveBeenCalled();
  });

  it('passes the selected default currency through sign-up metadata', async () => {
    window.history.replaceState({}, '', '/register');
    const auth = authMock();
    render(<App auth={auth} api={apiMock()} />);

    fireEvent.change(await screen.findByLabelText('Email'), {
      target: { value: 'alex@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'long-enough-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() =>
      expect(auth.signUp).toHaveBeenCalledWith('alex@example.com', 'long-enough-password', 'USD'),
    );
  });

  it('uses an accessible eye control and reports password strength on sign-up', async () => {
    window.history.replaceState({}, '', '/register');
    render(<App auth={authMock()} api={apiMock()} />);

    const password = await screen.findByLabelText('Password');
    expect(password).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText('Password strength: 0 of 4')).toBeInTheDocument();

    fireEvent.change(password, { target: { value: 'Strong-password-42' } });
    expect(screen.getByLabelText('Password strength: 4 of 4')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(password).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument();
  });

  it('loads and updates the authenticated user profile', async () => {
    window.history.replaceState({}, '', '/settings');
    const session = { accessToken: 'access-token', email: 'alex@example.com' };
    const api = apiMock({
      updateProfile: vi
        .fn()
        .mockResolvedValue({ ...profile, displayName: 'Alex Rivera', defaultCurrency: 'USD' }),
    });
    render(
      <App auth={authMock({ restoreSession: vi.fn().mockResolvedValue(session) })} api={api} />,
    );

    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Alex alex@example\.com/ }));
    const name = screen.getByLabelText('Display name');
    fireEvent.change(name, { target: { value: 'Alex Rivera' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(api.updateProfile).toHaveBeenCalledWith(session, {
        displayName: 'Alex Rivera',
        defaultCurrency: 'USD',
      }),
    );
    expect(await screen.findByText('Settings saved.')).toBeInTheDocument();
  });

  it('clears protected UI when the API reports an expired session', async () => {
    window.history.replaceState({}, '', '/settings');
    const session = { accessToken: 'expired-token', email: 'alex@example.com' };
    const auth = authMock({ restoreSession: vi.fn().mockResolvedValue(session) });
    const api = apiMock({
      getProfile: vi
        .fn()
        .mockRejectedValue(new ApiRequestError('The access token is invalid or expired.', 401)),
    });

    render(<App auth={auth} api={api} />);

    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Settings' })).not.toBeInTheDocument();
    expect(auth.signOut).toHaveBeenCalled();
  });

  it('does not show registration to an already authenticated user', async () => {
    window.history.replaceState({}, '', '/register');
    const session = { accessToken: 'access-token', email: 'alex@example.com' };

    render(
      <App
        auth={authMock({ restoreSession: vi.fn().mockResolvedValue(session) })}
        api={apiMock()}
      />,
    );

    expect(
      await screen.findByRole('heading', { name: 'Know where you stand, monthly.' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Create your account' })).not.toBeInTheDocument();
  });

  it('shows a recoverable sign-out failure and re-enables the action', async () => {
    window.history.replaceState({}, '', '/settings');
    const session = { accessToken: 'access-token', email: 'alex@example.com' };
    const auth = authMock({
      restoreSession: vi.fn().mockResolvedValue(session),
      signOut: vi.fn().mockRejectedValue(new Error('Could not reach Auth.')),
    });

    render(<App auth={auth} api={apiMock()} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Sign out' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not reach Auth.');
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeEnabled();
  });

  it('treats a password-update route without a recovery session as expired', async () => {
    window.history.replaceState({}, '', '/update-password');
    render(<App auth={authMock()} api={apiMock()} />);

    expect(
      await screen.findByRole('heading', { name: 'This reset link is no longer valid' }),
    ).toBeInTheDocument();
  });
});
