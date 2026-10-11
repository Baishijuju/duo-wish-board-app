do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'shared_boards'
  ) then
    alter publication supabase_realtime add table public.shared_boards;
  end if;
end
$$;