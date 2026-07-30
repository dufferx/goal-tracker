import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@goal-tracker/ui/globals.css';
import { App } from './app';
import { createGoalTrackerApi } from './lib/api';
import { createSupabaseAuthGateway } from './lib/auth';

const root = document.querySelector('#root');

if (!root) {
  throw new Error('Root element was not found');
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are required');
}

const auth = createSupabaseAuthGateway({
  url: supabaseUrl,
  publishableKey: supabasePublishableKey,
});
const api = createGoalTrackerApi(import.meta.env.VITE_API_URL ?? '');

createRoot(root).render(
  <StrictMode>
    <App auth={auth} api={api} />
  </StrictMode>,
);
