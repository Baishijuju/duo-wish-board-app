-- One-time data repair:
-- 1) Correct 2026-08-03 count progress for a specific wish to 5 units.
-- 2) Backfill daily progress snapshot table from count_star_coin claims.

DO $$
DECLARE
  v_target_wish_id uuid := '99a4b04f-2ed9-48bc-9e07-f986f3a3b725';
  v_target_date date := DATE '2026-08-03';
  v_expected_units integer := 5;

  v_existing_units integer := 0;
  v_units_delta integer := 0;
  v_owner_id uuid;
  v_space_id uuid;
  v_progress_star_coin_value numeric := 0;
BEGIN
  SELECT
    wish.owner_id,
    wish.space_id,
    coalesce(wish.progress_star_coin_value, 0)
  INTO
    v_owner_id,
    v_space_id,
    v_progress_star_coin_value
  FROM public.wishes wish
  WHERE wish.id = v_target_wish_id;

  IF FOUND THEN
    SELECT coalesce(sum(claim.quantity), 0)
    INTO v_existing_units
    FROM public.reward_claims claim
    WHERE claim.source_wish_id = v_target_wish_id
      AND claim.claim_kind = 'count_star_coin'::public.reward_claim_kind
      AND ((claim.created_at AT TIME ZONE 'utc') + interval '8 hour')::date = v_target_date;

    v_units_delta := v_existing_units - v_expected_units;

    DELETE FROM public.reward_claims claim
    WHERE claim.source_wish_id = v_target_wish_id
      AND claim.claim_kind = 'count_star_coin'::public.reward_claim_kind
      AND ((claim.created_at AT TIME ZONE 'utc') + interval '8 hour')::date = v_target_date;

    IF v_expected_units > 0 THEN
      INSERT INTO public.reward_claims (
        space_id,
        owner_id,
        reward_item_id,
        source_wish_id,
        source_step_id,
        claim_kind,
        quantity,
        title_snapshot,
        note_snapshot,
        star_coin_delta,
        created_at
      )
      VALUES (
        v_space_id,
        v_owner_id,
        null,
        v_target_wish_id,
        null,
        'count_star_coin'::public.reward_claim_kind,
        v_expected_units,
        (v_expected_units * v_progress_star_coin_value)::text || ' 星星币',
        '数字进度推进后自动获得星星币。',
        v_expected_units * v_progress_star_coin_value,
        (v_target_date::text || ' 12:00:00+08')::timestamptz
      );
    END IF;

    IF v_units_delta <> 0 THEN
      UPDATE public.wishes wish
      SET
        progress_current = greatest(coalesce(wish.progress_current, 0) - v_units_delta, 0),
        updated_at = timezone('utc', now())
      WHERE wish.id = v_target_wish_id;
    END IF;
  END IF;
END;
$$;

INSERT INTO public.wish_count_progress_daily (
  wish_id,
  space_id,
  owner_id,
  progress_date,
  progress_units,
  last_event_at,
  created_at,
  updated_at
)
SELECT
  claim.source_wish_id,
  claim.space_id,
  claim.owner_id,
  ((claim.created_at AT TIME ZONE 'utc') + interval '8 hour')::date AS progress_date,
  sum(claim.quantity)::integer AS progress_units,
  max(claim.created_at) AS last_event_at,
  timezone('utc', now()) AS created_at,
  timezone('utc', now()) AS updated_at
FROM public.reward_claims claim
WHERE claim.claim_kind = 'count_star_coin'::public.reward_claim_kind
  AND claim.source_wish_id IS NOT NULL
GROUP BY
  claim.source_wish_id,
  claim.space_id,
  claim.owner_id,
  ((claim.created_at AT TIME ZONE 'utc') + interval '8 hour')::date
ON CONFLICT (wish_id, progress_date)
DO UPDATE SET
  progress_units = excluded.progress_units,
  space_id = excluded.space_id,
  owner_id = excluded.owner_id,
  last_event_at = excluded.last_event_at,
  updated_at = timezone('utc', now());
