-- Probe rows related to temporary acceptance wishes and potential stat traces.
select id, title, owner_id, progress_current, progress_target, status, created_at, updated_at
from public.wishes
where title ilike '%Supabase写入验收%'
order by updated_at desc;

select id, owner_id, source_wish_id, source_step_id, claim_kind, quantity, star_coin_delta, title_snapshot, created_at
from public.reward_claims
where source_wish_id in (
  select id from public.wishes where title ilike '%Supabase写入验收%'
)
or title_snapshot ilike '%Supabase写入验收%'
order by created_at desc;

select id, wish_id, title, star_coin_value, is_done, created_at, updated_at
from public.wish_steps
where wish_id in (
  select id from public.wishes where title ilike '%Supabase写入验收%'
)
order by updated_at desc;

select id, wish_id, author_id, left(body, 80) as message_preview, created_at
from public.wish_comments
where wish_id in (
  select id from public.wishes where title ilike '%Supabase写入验收%'
)
order by created_at desc;