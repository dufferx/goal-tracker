-- Pre-M4 hardening: application data flows only through the API. Direct
-- PostgREST writes would bypass the backend's single Financial Engine path
-- (lock, deterministic replay, and invariant checks), so authenticated
-- clients lose insert/update/delete on application tables. Read access stays
-- granted and owner-scoped by RLS; the browser uses Supabase directly only
-- for Auth.

revoke insert, update, delete on table public.goals from authenticated;
revoke insert, update, delete on table public.goal_items from authenticated;
revoke insert, update, delete on table public.financial_transactions from authenticated;

-- Write policies are inert without write grants; drop them so the schema
-- documents that writes only happen through the backend.
drop policy "goals_insert_own" on public.goals;
drop policy "goals_update_own" on public.goals;
drop policy "goals_delete_own" on public.goals;

drop policy "goal_items_insert_own" on public.goal_items;
drop policy "goal_items_update_own" on public.goal_items;
drop policy "goal_items_delete_own" on public.goal_items;

drop policy "financial_transactions_insert_own" on public.financial_transactions;
drop policy "financial_transactions_update_own" on public.financial_transactions;
drop policy "financial_transactions_delete_own" on public.financial_transactions;
