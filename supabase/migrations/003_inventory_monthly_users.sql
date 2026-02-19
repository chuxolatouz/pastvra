-- Inventory + monthly weight import + user management enhancements

alter table public.farm_memberships
  add column if not exists active boolean not null default true;

-- Active membership is now required for role resolution
create or replace function public.user_role_for_farm(target_farm uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select fm.role
  from public.farm_memberships fm
  where fm.farm_id = target_farm
    and fm.user_id = auth.uid()
    and fm.active = true
  limit 1;
$$;

revoke all on function public.user_role_for_farm(uuid) from public;
grant execute on function public.user_role_for_farm(uuid) to anon, authenticated;

create table if not exists public.profiles (
  user_id uuid primary key,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_email_unique on public.profiles(lower(email));

create or replace function public.handle_auth_user_profile_sync()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, email, created_at, updated_at)
  values (new.id, coalesce(new.email, ''), now(), now())
  on conflict (user_id)
  do update set
    email = excluded.email,
    updated_at = now();

  return new;
end;
$$;

-- Keep profile email in sync with auth.users
drop trigger if exists on_auth_user_profile_sync on auth.users;
create trigger on_auth_user_profile_sync
after insert or update of email
on auth.users
for each row execute procedure public.handle_auth_user_profile_sync();

-- Backfill existing users
insert into public.profiles (user_id, email, created_at, updated_at)
select u.id, coalesce(u.email, ''), now(), now()
from auth.users u
on conflict (user_id)
do update set
  email = excluded.email,
  updated_at = now();

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  movement_date date not null,
  partner_name text,
  destination_name text,
  category_name text,
  opening_balance numeric,
  purchases_qty numeric,
  sales_qty numeric,
  transfers_qty numeric,
  unit_value_usd numeric,
  observed_weight_kg numeric,
  price_per_kg numeric,
  kg_negotiated numeric,
  freight_usd numeric,
  commission_rate numeric,
  notes text,
  source text not null default 'manual',
  source_row_hash text,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  sales_usd numeric generated always as (coalesce(sales_qty, 0) * coalesce(unit_value_usd, 0)) stored,
  purchases_usd numeric generated always as (coalesce(purchases_qty, 0) * coalesce(unit_value_usd, 0)) stored,
  transfers_usd numeric generated always as (coalesce(transfers_qty, 0) * coalesce(unit_value_usd, 0)) stored,
  commission_usd numeric generated always as ((coalesce(purchases_qty, 0) * coalesce(unit_value_usd, 0)) * coalesce(commission_rate, 0)) stored,
  total_acquisition_usd numeric generated always as (
    (coalesce(purchases_qty, 0) * coalesce(unit_value_usd, 0)) +
    coalesce(freight_usd, 0) +
    ((coalesce(purchases_qty, 0) * coalesce(unit_value_usd, 0)) * coalesce(commission_rate, 0))
  ) stored,
  net_delta_qty numeric generated always as (
    coalesce(purchases_qty, 0) - coalesce(sales_qty, 0) - coalesce(transfers_qty, 0)
  ) stored
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'inventory_movements_source_hash_unique'
  ) then
    alter table public.inventory_movements
      add constraint inventory_movements_source_hash_unique unique (farm_id, source_row_hash);
  end if;
end $$;

create index if not exists inventory_movements_farm_date_idx
  on public.inventory_movements(farm_id, movement_date, created_at);

create index if not exists inventory_movements_scope_idx
  on public.inventory_movements(farm_id, destination_name, category_name, movement_date, created_at);

-- Mapping helper for monthly imports when spreadsheet identifier doesn't match directly
create table if not exists public.weight_import_identifier_mappings (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  external_identifier text not null,
  animal_id uuid not null references public.animals(id) on delete cascade,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  unique(farm_id, external_identifier)
);

alter table public.animal_weights
  add column if not exists source text not null default 'manual';

alter table public.animal_weights
  add column if not exists source_row_hash text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'animal_weights_source_hash_unique'
  ) then
    alter table public.animal_weights
      add constraint animal_weights_source_hash_unique unique (farm_id, source_row_hash);
  end if;
end $$;

create index if not exists animal_weights_farm_date_idx
  on public.animal_weights(farm_id, weighed_at);
