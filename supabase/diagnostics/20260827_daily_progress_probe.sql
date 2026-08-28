select
  id,
  wish_id,
  owner_id,
  progress_date,
  progress_units,
  updated_at
from public.wish_count_progress_daily
order by updated_at desc
limit 120;