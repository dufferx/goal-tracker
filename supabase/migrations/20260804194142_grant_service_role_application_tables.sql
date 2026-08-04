-- Supabase no longer grants Data API table privileges implicitly on new projects.
-- Keep browser access restricted while allowing trusted server-side administration
-- and the RLS integration harness to use the service role explicitly.
grant select, insert, update, delete
  on table
    public.profiles,
    public.goals,
    public.goal_items,
    public.financial_transactions
  to service_role;
