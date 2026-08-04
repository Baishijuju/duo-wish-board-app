-- Ensure authenticated space members can read daily count progress rows.
-- Without this policy, frontend queries return empty rows under RLS and
-- thread copy falls back to stale per-thread quantity values.

alter table public.wish_count_progress_daily enable row level security;

grant select on table public.wish_count_progress_daily to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'wish_count_progress_daily'
      and policyname = 'wish_count_progress_daily_select_member'
  ) then
    create policy wish_count_progress_daily_select_member
      on public.wish_count_progress_daily
      for select
      to authenticated
      using (is_space_member(space_id));
  end if;
end
$$;
