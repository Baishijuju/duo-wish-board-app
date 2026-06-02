-- 在 Supabase Dashboard 的 SQL Editor 中执行。
-- 目标：直接以 authenticated + 真实邮箱 claim 模拟 owner，验证数据库对象本身是否正常。
-- 当前前端与脚本指向的项目是 cimwhpatnazndnnvvfoz。

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
  current_user as current_role,
  auth.uid() as auth_uid,
  auth.jwt() ->> 'email' as auth_email;

select
  to_regclass('public.space_email_bindings') is not null as has_space_email_bindings,
  exists (
    select 1
    from pg_proc proc
    join pg_namespace namespace on namespace.oid = proc.pronamespace
    where namespace.nspname = 'public'
      and proc.proname = 'create_personal_space'
  ) as has_create_personal_space,
  exists (
    select 1
    from pg_proc proc
    join pg_namespace namespace on namespace.oid = proc.pronamespace
    where namespace.nspname = 'public'
      and proc.proname = 'ensure_bound_space_memberships'
  ) as has_ensure_bound_space_memberships;

select
  has_function_privilege('authenticated', 'public.create_personal_space(text, text, text)', 'execute') as can_exec_create_personal_space,
  has_function_privilege('authenticated', 'public.ensure_bound_space_memberships(text)', 'execute') as can_exec_ensure_bound_space_memberships,
  has_table_privilege('authenticated', 'public.space_members', 'select') as can_select_space_members,
  has_table_privilege('authenticated', 'public.spaces', 'select') as can_select_spaces;

select *
from public.ensure_bound_space_memberships('1103475965@qq.com');

select public.create_personal_space(
  'AI SQL Probe ' || to_char(timezone('utc', now()), 'YYYY-MM-DD'),
  'AI' || upper(substr(md5(random()::text), 1, 8)),
  '1103475965'
);

select
  space_id,
  user_id,
  display_name,
  role,
  joined_at
from public.space_members
where user_id = auth.uid()
order by joined_at desc;

select
  id,
  name,
  invite_code,
  created_by,
  created_at
from public.spaces
where created_by = auth.uid()
order by created_at desc;

commit;