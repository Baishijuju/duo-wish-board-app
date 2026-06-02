-- 在 Supabase Dashboard 的 SQL Editor 中执行。
-- 目标：对比 admin 视角与 authenticated 视角下，owner 的 space_members 是否存在且可见。

begin;

do $$
declare
  target_email text := '1103475965@qq.com';
  target_user_id uuid;
begin
  select id
  into target_user_id
  from auth.users
  where email = target_email
  limit 1;

  if target_user_id is null then
    raise exception 'auth.users 中没有找到邮箱 % 对应的用户', target_email;
  end if;

  create temp table if not exists debug_target_user on commit drop as
  select target_user_id as user_id, target_email as email;
end
$$;

select 'admin-space-members-count' as step, count(*) as row_count
from public.space_members
where user_id = (select user_id from debug_target_user limit 1);

select
  'admin-space-members-rows' as step,
  space_id,
  user_id,
  display_name,
  role,
  joined_at
from public.space_members
where user_id = (select user_id from debug_target_user limit 1)
order by joined_at desc;

select
  'admin-owner-spaces' as step,
  id,
  name,
  invite_code,
  created_by,
  created_at
from public.spaces
where created_by = (select user_id from debug_target_user limit 1)
order by created_at desc;

do $$
declare
  target_user_id uuid := (select user_id from debug_target_user limit 1);
  target_email text := (select email from debug_target_user limit 1);
begin
  perform set_config('request.jwt.claim.sub', target_user_id::text, true);
  perform set_config('request.jwt.claim.email', target_email, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config(
    'request.jwt.claims',
    json_build_object(
      'sub', target_user_id::text,
      'email', target_email,
      'role', 'authenticated'
    )::text,
    true
  );
end
$$;

set local role authenticated;

select
  'auth-context' as step,
  current_user as current_role,
  auth.uid() as auth_uid,
  auth.jwt() ->> 'email' as auth_email;

select 'auth-space-members-count' as step, count(*) as row_count
from public.space_members
where user_id = auth.uid();

select
  'auth-space-members-rows' as step,
  space_id,
  user_id,
  display_name,
  role,
  joined_at,
  public.is_space_member(space_id) as can_self_resolve_membership,
  public.is_space_owner(space_id) as can_self_resolve_owner
from public.space_members
where user_id = auth.uid()
order by joined_at desc;

select
  'auth-visible-spaces' as step,
  id,
  name,
  invite_code,
  created_by,
  created_at
from public.spaces
where created_by = auth.uid()
order by created_at desc;

commit;