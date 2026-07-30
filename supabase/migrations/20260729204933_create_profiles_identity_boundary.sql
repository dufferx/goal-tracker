create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  default_currency character(3) not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_trimmed_bounded_check check (
    display_name is null
    or (
      display_name = btrim(display_name)
      and char_length(display_name) between 1 and 100
    )
  ),
  constraint profiles_default_currency_format_check check (
    default_currency ~ '^[A-Z]{3}$'
  )
);

alter table public.profiles enable row level security;

revoke all on table public.profiles from public;
revoke all on table public.profiles from anon;
revoke all on table public.profiles from authenticated;

grant select on table public.profiles to authenticated;
grant update (display_name, default_currency) on table public.profiles to authenticated;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = statement_timestamp();
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public;
revoke all on function private.set_updated_at() from anon;
revoke all on function private.set_updated_at() from authenticated;

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function private.set_updated_at();

create function private.provision_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, default_currency)
  values (
    new.id,
    case
      when (new.raw_user_meta_data ->> 'default_currency') ~ '^[A-Z]{3}$'
        then new.raw_user_meta_data ->> 'default_currency'
      else 'USD'
    end
  );

  return new;
end;
$$;

revoke all on function private.provision_profile() from public;
revoke all on function private.provision_profile() from anon;
revoke all on function private.provision_profile() from authenticated;

create trigger auth_user_provision_profile
after insert on auth.users
for each row
execute function private.provision_profile();
