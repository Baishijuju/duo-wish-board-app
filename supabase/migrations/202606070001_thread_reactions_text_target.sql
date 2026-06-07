do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'thread_reactions'
      and con.contype = 'f'
      and exists (
        select 1
        from unnest(con.conkey) key_attnum
        join pg_attribute attr on attr.attrelid = rel.oid and attr.attnum = key_attnum
        where attr.attname = 'target_thread_id'
      )
  loop
    execute format('alter table public.thread_reactions drop constraint if exists %I', constraint_name);
  end loop;
end
$$;

drop policy if exists "thread_reactions_select_visible" on public.thread_reactions;
drop policy if exists "thread_reactions_insert_self" on public.thread_reactions;
drop policy if exists "thread_reactions_delete_self" on public.thread_reactions;

drop index if exists public.idx_thread_reactions_unique;
drop index if exists public.idx_thread_reactions_thread_created;

alter table public.thread_reactions
alter column target_thread_id type text using target_thread_id::text;

create unique index if not exists idx_thread_reactions_unique
on public.thread_reactions (space_id, target_thread_id, actor_id, emoji);

create index if not exists idx_thread_reactions_thread_created
on public.thread_reactions (target_thread_id, created_at desc);

create or replace function public.can_access_thread_reaction(target_space_id uuid, target_thread_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_space_member(target_space_id)
    and (
      exists (
        select 1
        from public.wish_threads thread
        where thread.id::text = target_thread_key
          and thread.space_id = target_space_id
          and (thread.wish_id is null or public.can_access_wish(thread.wish_id))
      )
      or target_thread_key like 'thread-%'
    );
$$;

create policy "thread_reactions_select_visible"
on public.thread_reactions
for select
to authenticated
using (public.can_access_thread_reaction(space_id, target_thread_id));

create policy "thread_reactions_insert_self"
on public.thread_reactions
for insert
to authenticated
with check (
  actor_id = auth.uid()
  and public.can_access_thread_reaction(space_id, target_thread_id)
);

create policy "thread_reactions_delete_self"
on public.thread_reactions
for delete
to authenticated
using (
  actor_id = auth.uid()
  and public.can_access_thread_reaction(space_id, target_thread_id)
);
