create extension if not exists pgcrypto;

create table if not exists public.farms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  hectares numeric,
  low_gain_threshold_adg numeric not null default 0.3,
  overdue_days integer not null default 45,
  created_at timestamptz not null default now()
);

create table if not exists public.farm_memberships (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  user_id uuid not null,
  role text not null check (role in ('admin','supervisor','operador')),
  created_at timestamptz not null default now(),
  unique(farm_id, user_id)
);

create table if not exists public.paddocks (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  code text not null,
  hectares numeric,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  unique(farm_id, code)
);

create table if not exists public.paddock_soil_tests (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  paddock_id uuid not null references public.paddocks(id) on delete cascade,
  tested_at date not null,
  ph numeric,
  grass_percent numeric,
  sugar_percent numeric,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.animals (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  chip_id text,
  ear_tag text,
  name text,
  sex text not null check (sex in ('M','H')),
  breed text,
  birth_date date not null,
  cost numeric,
  status text not null default 'vivo' check (status in ('vivo','vendido','muerto','extraviado')),
  notes text,
  photo_path text,
  current_paddock_id uuid references public.paddocks(id) on delete set null,
  sire_id uuid references public.animals(id) on delete set null,
  dam_id uuid references public.animals(id) on delete set null,
  sire_external text,
  dam_external text,
  created_at timestamptz not null default now()
);

create unique index if not exists animals_chip_unique on public.animals(farm_id, chip_id) where chip_id is not null;
create unique index if not exists animals_ear_unique on public.animals(farm_id, ear_tag) where ear_tag is not null;

create table if not exists public.animal_weights (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  animal_id uuid not null references public.animals(id) on delete cascade,
  weighed_at date not null,
  weight_kg numeric not null,
  client_generated_id uuid not null unique,
  created_by uuid not null,
  created_at timestamptz not null default now()
);

create index if not exists animal_weights_idx on public.animal_weights(animal_id, weighed_at);

create table if not exists public.animal_events (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  animal_id uuid not null references public.animals(id) on delete cascade,
  event_type text not null check (event_type in ('vacuna','desparasitacion','parto','venta','compra','traslado_potrero','otro')),
  event_at date not null,
  payload jsonb,
  notes text,
  created_by uuid not null,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  name text not null,
  product_type text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.paddock_treatments (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  paddock_id uuid not null references public.paddocks(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  treatment_type text not null default 'otro',
  applied_at date not null,
  next_due_at date,
  evidence_path text,
  notes text,
  created_by uuid,
  created_at timestamptz not null default now()
);

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
  limit 1;
$$;

revoke all on function public.user_role_for_farm(uuid) from public;
grant execute on function public.user_role_for_farm(uuid) to anon, authenticated;
