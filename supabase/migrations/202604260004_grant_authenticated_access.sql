grant usage on schema public to authenticated;

grant usage on type public.space_role to authenticated;
grant usage on type public.wish_scope to authenticated;
grant usage on type public.wish_status to authenticated;
grant usage on type public.wish_priority to authenticated;

grant select, insert, update on table public.spaces to authenticated;
grant select, update, delete on table public.space_members to authenticated;
grant select, insert, update, delete on table public.wishes to authenticated;
grant select, insert, update, delete on table public.wish_comments to authenticated;

grant execute on function public.is_space_member(uuid) to authenticated;
grant execute on function public.is_space_owner(uuid) to authenticated;
grant execute on function public.can_access_wish(uuid) to authenticated;
grant execute on function public.join_space_by_invite(text, text) to authenticated;