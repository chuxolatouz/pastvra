alter table public.farms enable row level security;
alter table public.farm_memberships enable row level security;
alter table public.paddocks enable row level security;
alter table public.paddock_soil_tests enable row level security;
alter table public.animals enable row level security;
alter table public.animal_weights enable row level security;
alter table public.animal_events enable row level security;
alter table public.products enable row level security;
alter table public.paddock_treatments enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.profiles enable row level security;
alter table public.weight_import_identifier_mappings enable row level security;

-- Farms
create policy farms_select_member on public.farms
for select using (public.user_role_for_farm(id) is not null);

create policy farms_insert_auth on public.farms
for insert with check (auth.uid() is not null);

create policy farms_update_admin on public.farms
for update using (public.user_role_for_farm(id) = 'admin')
with check (public.user_role_for_farm(id) = 'admin');

create policy farms_delete_admin on public.farms
for delete using (public.user_role_for_farm(id) = 'admin');

-- Memberships
create policy memberships_select_member on public.farm_memberships
for select using (public.user_role_for_farm(farm_id) is not null);

create policy memberships_insert_admin on public.farm_memberships
for insert with check (public.user_role_for_farm(farm_id) = 'admin');

create policy memberships_update_admin on public.farm_memberships
for update using (public.user_role_for_farm(farm_id) = 'admin')
with check (public.user_role_for_farm(farm_id) = 'admin');

create policy memberships_delete_admin on public.farm_memberships
for delete using (public.user_role_for_farm(farm_id) = 'admin');

-- Paddocks & soil tests
create policy paddocks_select_member on public.paddocks
for select using (public.user_role_for_farm(farm_id) is not null);

create policy paddocks_write_supervisor on public.paddocks
for all using (public.user_role_for_farm(farm_id) in ('admin','supervisor'))
with check (public.user_role_for_farm(farm_id) in ('admin','supervisor'));

create policy soil_select_member on public.paddock_soil_tests
for select using (public.user_role_for_farm(farm_id) is not null);

create policy soil_write_supervisor on public.paddock_soil_tests
for all using (public.user_role_for_farm(farm_id) in ('admin','supervisor'))
with check (public.user_role_for_farm(farm_id) in ('admin','supervisor'));

-- Animals
create policy animals_select_member on public.animals
for select using (public.user_role_for_farm(farm_id) is not null);

create policy animals_write_supervisor on public.animals
for all using (public.user_role_for_farm(farm_id) in ('admin','supervisor'))
with check (public.user_role_for_farm(farm_id) in ('admin','supervisor'));

-- Weights
create policy weights_select_member on public.animal_weights
for select using (public.user_role_for_farm(farm_id) is not null);

create policy weights_insert_operator on public.animal_weights
for insert with check (public.user_role_for_farm(farm_id) in ('admin','supervisor','operador'));

create policy weights_update_supervisor on public.animal_weights
for update using (public.user_role_for_farm(farm_id) in ('admin','supervisor'))
with check (public.user_role_for_farm(farm_id) in ('admin','supervisor'));

create policy weights_delete_supervisor on public.animal_weights
for delete using (public.user_role_for_farm(farm_id) in ('admin','supervisor'));

-- Events
create policy events_select_member on public.animal_events
for select using (public.user_role_for_farm(farm_id) is not null);

create policy events_insert_operator on public.animal_events
for insert with check (public.user_role_for_farm(farm_id) in ('admin','supervisor','operador'));

create policy events_update_supervisor on public.animal_events
for update using (public.user_role_for_farm(farm_id) in ('admin','supervisor'))
with check (public.user_role_for_farm(farm_id) in ('admin','supervisor'));

create policy events_delete_supervisor on public.animal_events
for delete using (public.user_role_for_farm(farm_id) in ('admin','supervisor'));

-- Phase 2 scaffolding
create policy products_select_member on public.products
for select using (public.user_role_for_farm(farm_id) is not null);

create policy products_write_supervisor on public.products
for all using (public.user_role_for_farm(farm_id) in ('admin','supervisor'))
with check (public.user_role_for_farm(farm_id) in ('admin','supervisor'));

create policy treatments_select_member on public.paddock_treatments
for select using (public.user_role_for_farm(farm_id) is not null);

create policy treatments_write_supervisor on public.paddock_treatments
for all using (public.user_role_for_farm(farm_id) in ('admin','supervisor'))
with check (public.user_role_for_farm(farm_id) in ('admin','supervisor'));

-- Inventory
create policy inventory_select_member on public.inventory_movements
for select using (public.user_role_for_farm(farm_id) is not null);

create policy inventory_write_supervisor on public.inventory_movements
for all using (public.user_role_for_farm(farm_id) in ('admin','supervisor'))
with check (public.user_role_for_farm(farm_id) in ('admin','supervisor'));

-- Weight import mappings
create policy import_map_select_member on public.weight_import_identifier_mappings
for select using (public.user_role_for_farm(farm_id) in ('admin','supervisor'));

create policy import_map_write_supervisor on public.weight_import_identifier_mappings
for all using (public.user_role_for_farm(farm_id) in ('admin','supervisor'))
with check (public.user_role_for_farm(farm_id) in ('admin','supervisor'));

-- Profiles (email lookup in user management)
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
