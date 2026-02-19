-- Policies for inventory + profiles + monthly import mappings

alter table public.inventory_movements enable row level security;
alter table public.profiles enable row level security;
alter table public.weight_import_identifier_mappings enable row level security;

drop policy if exists inventory_select_member on public.inventory_movements;
create policy inventory_select_member on public.inventory_movements
for select using (public.user_role_for_farm(farm_id) is not null);

drop policy if exists inventory_write_supervisor on public.inventory_movements;
create policy inventory_write_supervisor on public.inventory_movements
for all using (public.user_role_for_farm(farm_id) in ('admin','supervisor'))
with check (public.user_role_for_farm(farm_id) in ('admin','supervisor'));

drop policy if exists import_map_select_member on public.weight_import_identifier_mappings;
create policy import_map_select_member on public.weight_import_identifier_mappings
for select using (public.user_role_for_farm(farm_id) in ('admin','supervisor'));

drop policy if exists import_map_write_supervisor on public.weight_import_identifier_mappings;
create policy import_map_write_supervisor on public.weight_import_identifier_mappings
for all using (public.user_role_for_farm(farm_id) in ('admin','supervisor'))
with check (public.user_role_for_farm(farm_id) in ('admin','supervisor'));

drop policy if exists profiles_select_visible on public.profiles;
create policy profiles_select_visible on public.profiles
for select
using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.farm_memberships mine
    join public.farm_memberships target
      on target.farm_id = mine.farm_id
    where mine.user_id = auth.uid()
      and mine.active = true
      and mine.role in ('admin','supervisor')
      and target.user_id = profiles.user_id
  )
);

-- Recreate memberships select policy so active memberships keep visibility scope
drop policy if exists memberships_select_member on public.farm_memberships;
create policy memberships_select_member on public.farm_memberships
for select using (public.user_role_for_farm(farm_id) is not null);
