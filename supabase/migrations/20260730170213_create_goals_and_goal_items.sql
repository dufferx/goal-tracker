-- M2: goals and goal_items planning aggregate.
-- Product Requirements require optional description on goals and stable item position;
-- Technical Architecture table summary omits both — resolved in favor of Product Requirements.

create type public.goal_target_mode as enum ('fixed', 'items');
create type public.goal_status as enum ('active', 'archived');

create table public.goals (
  id uuid primary key,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  description text,
  currency character(3) not null,
  target_mode public.goal_target_mode not null,
  fixed_target_minor bigint,
  start_month date not null,
  final_month date,
  contributions_per_month smallint not null,
  preferred_contribution_minor bigint,
  status public.goal_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint goals_name_trimmed_bounded_check check (
    name = btrim(name)
    and char_length(name) between 1 and 120
  ),
  constraint goals_description_trimmed_bounded_check check (
    description is null
    or (
      description = btrim(description)
      and char_length(description) between 1 and 2000
    )
  ),
  constraint goals_currency_format_check check (currency ~ '^[A-Z]{3}$'),
  constraint goals_fixed_target_mode_check check (
    (
      target_mode = 'fixed'
      and fixed_target_minor is not null
      and fixed_target_minor > 0
    )
    or (
      target_mode = 'items'
      and fixed_target_minor is null
    )
  ),
  constraint goals_start_month_first_day_check check (
    start_month = date_trunc('month', start_month)::date
  ),
  constraint goals_final_month_first_day_check check (
    final_month is null
    or final_month = date_trunc('month', final_month)::date
  ),
  constraint goals_final_month_not_before_start_check check (
    final_month is null
    or final_month >= start_month
  ),
  constraint goals_contributions_per_month_check check (
    contributions_per_month in (1, 2)
  ),
  constraint goals_preferred_contribution_positive_check check (
    preferred_contribution_minor is null
    or preferred_contribution_minor > 0
  )
);

create unique index goals_owner_id_id_uidx on public.goals (owner_id, id);
create index goals_owner_status_created_idx
  on public.goals (owner_id, status, created_at desc);

create table public.goal_items (
  id uuid primary key,
  owner_id uuid not null,
  goal_id uuid not null,
  name text not null,
  expected_price_minor bigint not null,
  due_month date,
  position integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint goal_items_name_trimmed_bounded_check check (
    name = btrim(name)
    and char_length(name) between 1 and 120
  ),
  constraint goal_items_expected_price_positive_check check (
    expected_price_minor > 0
  ),
  constraint goal_items_due_month_first_day_check check (
    due_month is null
    or due_month = date_trunc('month', due_month)::date
  ),
  constraint goal_items_position_nonnegative_check check (position >= 0),
  constraint goal_items_owner_goal_fk
    foreign key (owner_id, goal_id)
    references public.goals (owner_id, id)
    on delete cascade
);

create unique index goal_items_goal_id_id_uidx on public.goal_items (goal_id, id);
create unique index goal_items_goal_position_uidx on public.goal_items (goal_id, position);
create index goal_items_owner_goal_position_idx
  on public.goal_items (owner_id, goal_id, position);

create or replace function private.assert_goal_item_due_month()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  goal_start date;
  goal_final date;
begin
  select g.start_month, g.final_month
    into goal_start, goal_final
  from public.goals as g
  where g.id = new.goal_id
    and g.owner_id = new.owner_id;

  if not found then
    raise exception 'goal_items must reference an owned goal';
  end if;

  if new.due_month is not null then
    if new.due_month < goal_start then
      raise exception 'due_month cannot precede goal start_month';
    end if;
    if goal_final is not null and new.due_month > goal_final then
      raise exception 'due_month cannot exceed goal final_month';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.assert_goal_item_due_month() from public;
revoke all on function private.assert_goal_item_due_month() from anon;
revoke all on function private.assert_goal_item_due_month() from authenticated;

create trigger goal_items_assert_due_month
before insert or update of due_month, goal_id, owner_id
on public.goal_items
for each row
execute function private.assert_goal_item_due_month();

create trigger goals_set_updated_at
before update on public.goals
for each row
execute function private.set_updated_at();

create trigger goal_items_set_updated_at
before update on public.goal_items
for each row
execute function private.set_updated_at();

alter table public.goals enable row level security;
alter table public.goal_items enable row level security;

revoke all on table public.goals from public;
revoke all on table public.goals from anon;
revoke all on table public.goals from authenticated;

revoke all on table public.goal_items from public;
revoke all on table public.goal_items from anon;
revoke all on table public.goal_items from authenticated;

grant select, insert, update, delete on table public.goals to authenticated;
grant select, insert, update, delete on table public.goal_items to authenticated;

create policy "goals_select_own"
on public.goals
for select
to authenticated
using ((select auth.uid()) = owner_id);

create policy "goals_insert_own"
on public.goals
for insert
to authenticated
with check ((select auth.uid()) = owner_id);

create policy "goals_update_own"
on public.goals
for update
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create policy "goals_delete_own"
on public.goals
for delete
to authenticated
using ((select auth.uid()) = owner_id);

create policy "goal_items_select_own"
on public.goal_items
for select
to authenticated
using ((select auth.uid()) = owner_id);

create policy "goal_items_insert_own"
on public.goal_items
for insert
to authenticated
with check (
  (select auth.uid()) = owner_id
  and exists (
    select 1
    from public.goals as g
    where g.id = goal_id
      and g.owner_id = owner_id
      and g.owner_id = (select auth.uid())
  )
);

create policy "goal_items_update_own"
on public.goal_items
for update
to authenticated
using ((select auth.uid()) = owner_id)
with check (
  (select auth.uid()) = owner_id
  and exists (
    select 1
    from public.goals as g
    where g.id = goal_id
      and g.owner_id = owner_id
      and g.owner_id = (select auth.uid())
  )
);

create policy "goal_items_delete_own"
on public.goal_items
for delete
to authenticated
using ((select auth.uid()) = owner_id);
