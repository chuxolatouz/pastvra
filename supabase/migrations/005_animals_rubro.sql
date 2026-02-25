alter table public.animals
  add column if not exists rubro text;

update public.animals
set rubro = 'bovino'
where rubro is null;

alter table public.animals
  alter column rubro set default 'bovino';

alter table public.animals
  alter column rubro set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'animals_rubro_check'
  ) then
    alter table public.animals
      add constraint animals_rubro_check
      check (rubro in ('bovino', 'bufalino'));
  end if;
end $$;
