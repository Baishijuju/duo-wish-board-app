do $$
begin
  if not exists (select 1 from pg_type where typname = 'wish_progress_mode') then
    create type public.wish_progress_mode as enum ('none', 'count', 'steps');
  end if;
end
$$;

alter table public.wishes add column if not exists progress_mode public.wish_progress_mode not null default 'none';
alter table public.wishes add column if not exists progress_current integer not null default 0;
alter table public.wishes add column if not exists progress_target integer not null default 0;
alter table public.wishes add column if not exists progress_unit text not null default '';
alter table public.wishes add column if not exists completed_at timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'wishes_progress_current_non_negative') then
    alter table public.wishes add constraint wishes_progress_current_non_negative check (progress_current >= 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'wishes_progress_target_non_negative') then
    alter table public.wishes add constraint wishes_progress_target_non_negative check (progress_target >= 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'wishes_progress_unit_length') then
    alter table public.wishes add constraint wishes_progress_unit_length check (char_length(trim(progress_unit)) <= 12);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'wishes_progress_count_target_required') then
    alter table public.wishes add constraint wishes_progress_count_target_required check (
      progress_mode <> 'count' or progress_target > 0
    );
  end if;

  if not exists (select 1 from pg_constraint where conname = 'wishes_progress_current_within_target') then
    alter table public.wishes add constraint wishes_progress_current_within_target check (
      progress_mode <> 'count' or progress_current <= progress_target
    );
  end if;
end
$$;

update public.wishes
set completed_at = updated_at
where status = 'done'
  and completed_at is null;

create table if not exists public.wish_steps (
  id uuid primary key default gen_random_uuid(),
  wish_id uuid not null references public.wishes (id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 120),
  is_done boolean not null default false,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_wish_steps_wish on public.wish_steps (wish_id, sort_order, created_at);

drop trigger if exists trg_wish_steps_updated_at on public.wish_steps;
create trigger trg_wish_steps_updated_at
before update on public.wish_steps
for each row
execute function public.set_updated_at();

alter table public.wish_steps enable row level security;

drop policy if exists "wish_steps_select_visible_wish" on public.wish_steps;
create policy "wish_steps_select_visible_wish"
on public.wish_steps
for select
to authenticated
using (public.can_access_wish(wish_id));

drop policy if exists "wish_steps_insert_visible_wish" on public.wish_steps;
create policy "wish_steps_insert_visible_wish"
on public.wish_steps
for insert
to authenticated
with check (public.can_access_wish(wish_id));

drop policy if exists "wish_steps_update_visible_wish" on public.wish_steps;
create policy "wish_steps_update_visible_wish"
on public.wish_steps
for update
to authenticated
using (public.can_access_wish(wish_id))
with check (public.can_access_wish(wish_id));

drop policy if exists "wish_steps_delete_visible_wish" on public.wish_steps;
create policy "wish_steps_delete_visible_wish"
on public.wish_steps
for delete
to authenticated
using (public.can_access_wish(wish_id));

grant usage on type public.wish_progress_mode to authenticated;
grant select, insert, update, delete on table public.wish_steps to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'wish_steps'
  ) then
    alter publication supabase_realtime add table public.wish_steps;
  end if;
end
$$;