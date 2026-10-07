create table if not exists public.shared_board_todos (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.shared_boards(id) on delete cascade,
  space_id uuid not null references public.spaces(id) on delete cascade,
  due_date date not null default (timezone('Asia/Shanghai', now()))::date,
  assignee_id uuid references auth.users(id) on delete set null,
  project text not null default '' check (char_length(project) <= 120),
  title text not null check (char_length(trim(title)) between 1 and 240),
  is_done boolean not null default false,
  subtasks jsonb not null default '[]'::jsonb check (jsonb_typeof(subtasks) = 'array'),
  sort_order integer not null default 0,
  created_by uuid not null references auth.users(id) on delete cascade,
  updated_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_shared_board_todos_space_date_order
on public.shared_board_todos(space_id, due_date, sort_order, created_at);

create index if not exists idx_shared_board_todos_board_date
on public.shared_board_todos(board_id, due_date, created_at);

 drop trigger if exists trg_shared_board_todos_updated_at on public.shared_board_todos;
create trigger trg_shared_board_todos_updated_at
before update on public.shared_board_todos
for each row
execute function public.set_updated_at();

alter table public.shared_board_todos enable row level security;

drop policy if exists shared_board_todos_select_member on public.shared_board_todos;
create policy shared_board_todos_select_member
on public.shared_board_todos
for select
to authenticated
using (
  public.is_space_member(space_id)
  and exists (
    select 1
    from public.shared_boards board
    where board.id = board_id
      and board.space_id = space_id
  )
);

drop policy if exists shared_board_todos_insert_member on public.shared_board_todos;
create policy shared_board_todos_insert_member
on public.shared_board_todos
for insert
to authenticated
with check (
  public.is_space_member(space_id)
  and created_by = auth.uid()
  and updated_by = auth.uid()
  and exists (
    select 1
    from public.shared_boards board
    where board.id = board_id
      and board.space_id = space_id
  )
);

drop policy if exists shared_board_todos_update_member on public.shared_board_todos;
create policy shared_board_todos_update_member
on public.shared_board_todos
for update
to authenticated
using (
  public.is_space_member(space_id)
  and exists (
    select 1
    from public.shared_boards board
    where board.id = board_id
      and board.space_id = space_id
  )
)
with check (
  public.is_space_member(space_id)
  and updated_by = auth.uid()
  and exists (
    select 1
    from public.shared_boards board
    where board.id = board_id
      and board.space_id = space_id
  )
);

drop policy if exists shared_board_todos_delete_member on public.shared_board_todos;
create policy shared_board_todos_delete_member
on public.shared_board_todos
for delete
to authenticated
using (
  public.is_space_member(space_id)
  and exists (
    select 1
    from public.shared_boards board
    where board.id = board_id
      and board.space_id = space_id
  )
);

grant select, insert, update, delete on public.shared_board_todos to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'shared_board_todos'
  ) then
    alter publication supabase_realtime add table public.shared_board_todos;
  end if;
end
$$;
