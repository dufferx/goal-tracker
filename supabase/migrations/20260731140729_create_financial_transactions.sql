-- M3: the sole monetary source of truth. Contextual invariants are enforced by
-- the locked backend replay path; structural references and ownership live here.
create type public.financial_transaction_kind as enum (
  'contribution',
  'withdrawal',
  'purchase',
  'purchase_undo'
);

create table public.financial_transactions (
  id uuid primary key,
  owner_id uuid not null,
  goal_id uuid not null,
  kind public.financial_transaction_kind not null,
  amount_minor bigint not null,
  effective_date date not null,
  item_id uuid,
  reverses_transaction_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint financial_transactions_amount_positive_check check (amount_minor > 0),
  constraint financial_transactions_kind_references_check check (
    (kind in ('contribution', 'withdrawal') and item_id is null and reverses_transaction_id is null)
    or (kind = 'purchase' and item_id is not null and reverses_transaction_id is null)
    or (kind = 'purchase_undo' and item_id is not null and reverses_transaction_id is not null)
  ),
  constraint financial_transactions_goal_id_id_unique unique (goal_id, id),
  constraint financial_transactions_owner_goal_fk
    foreign key (owner_id, goal_id)
    references public.goals (owner_id, id)
    on delete cascade,
  constraint financial_transactions_goal_item_fk
    foreign key (goal_id, item_id)
    references public.goal_items (goal_id, id),
  constraint financial_transactions_goal_reversal_fk
    foreign key (goal_id, reverses_transaction_id)
    references public.financial_transactions (goal_id, id)
);

create unique index financial_transactions_reversal_uidx
  on public.financial_transactions (reverses_transaction_id)
  where reverses_transaction_id is not null;
create index financial_transactions_goal_replay_idx
  on public.financial_transactions (goal_id, effective_date, created_at, id);
create index financial_transactions_item_purchase_idx
  on public.financial_transactions (goal_id, item_id, kind)
  where item_id is not null;
create index financial_transactions_owner_goal_idx
  on public.financial_transactions (owner_id, goal_id);

create trigger financial_transactions_set_updated_at
before update on public.financial_transactions
for each row execute function private.set_updated_at();

alter table public.financial_transactions enable row level security;
revoke all on table public.financial_transactions from public, anon, authenticated;
grant select, insert, update, delete on table public.financial_transactions to authenticated;

create policy "financial_transactions_select_own"
on public.financial_transactions for select to authenticated
using ((select auth.uid()) = owner_id);

create policy "financial_transactions_insert_own"
on public.financial_transactions for insert to authenticated
with check (
  (select auth.uid()) = owner_id
  and exists (
    select 1 from public.goals as g
    where g.id = goal_id and g.owner_id = owner_id and g.owner_id = (select auth.uid())
  )
);

create policy "financial_transactions_update_own"
on public.financial_transactions for update to authenticated
using ((select auth.uid()) = owner_id)
with check (
  (select auth.uid()) = owner_id
  and exists (
    select 1 from public.goals as g
    where g.id = goal_id and g.owner_id = owner_id and g.owner_id = (select auth.uid())
  )
);

create policy "financial_transactions_delete_own"
on public.financial_transactions for delete to authenticated
using ((select auth.uid()) = owner_id);
