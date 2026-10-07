create table if not exists public.shared_boards (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null unique references public.spaces(id) on delete cascade,
  title text not null default '我们的展板' check (char_length(trim(title)) between 1 and 80),
  blocks jsonb not null default '[]'::jsonb check (jsonb_typeof(blocks) = 'array'),
  revision bigint not null default 0 check (revision >= 0),
  created_by uuid not null references auth.users(id) on delete cascade,
  updated_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_shared_boards_space_updated
on public.shared_boards(space_id, updated_at desc);

alter table public.shared_boards enable row level security;

drop policy if exists shared_boards_select_member on public.shared_boards;
create policy shared_boards_select_member
on public.shared_boards
for select
to authenticated
using (public.is_space_member(space_id));

drop policy if exists shared_boards_insert_member on public.shared_boards;
create policy shared_boards_insert_member
on public.shared_boards
for insert
to authenticated
with check (
  public.is_space_member(space_id)
  and created_by = auth.uid()
  and updated_by = auth.uid()
);

drop policy if exists shared_boards_update_member on public.shared_boards;
create policy shared_boards_update_member
on public.shared_boards
for update
to authenticated
using (public.is_space_member(space_id))
with check (
  public.is_space_member(space_id)
  and updated_by = auth.uid()
);

grant select, insert, update on public.shared_boards to authenticated;
