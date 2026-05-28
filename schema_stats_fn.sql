-- ================================================================
-- Stats RPC Function: get_collection_value_history
-- ================================================================
-- Returns the total market value of a user's collection for each
-- of the last 12 calendar months, ordered from oldest to newest.
--
-- Strategy (all in one SQL round-trip):
--   1. Generate the 12 month boundaries using generate_series.
--   2. Cross-join them with the user's inventory items, keeping only
--      items the user had BEFORE the end of each month.
--   3. For every (month, game, condition, region) combo, find the
--      most recent price recorded on or before the month's end date
--      using DISTINCT ON + ORDER BY recorded_date DESC.
--   4. Sum all matched prices per month. Months with no price data
--      yet return 0.00 so the chart always renders 12 data points.
--
-- Run this file once against your Supabase project to register the function.
-- Usage from the app:  supabase.rpc('get_collection_value_history', { p_user_id: '...' })
-- ================================================================

CREATE OR REPLACE FUNCTION public.get_collection_value_history(p_user_id UUID)
RETURNS TABLE(month_start DATE, valor_total NUMERIC)
LANGUAGE sql
SECURITY DEFINER   -- runs as owner so it can read user_collection bypassing RLS
STABLE             -- same inputs always give same outputs within a transaction
AS $$
  WITH
  -- ── 1. Generate the last 12 complete calendar months ──────────────────────
  month_series AS (
    SELECT
      date_trunc('month', CURRENT_DATE - (gs.n || ' months')::INTERVAL)::DATE AS month_start,
      -- Last day of this month (works correctly for months of any length)
      (date_trunc('month', CURRENT_DATE - (gs.n || ' months')::INTERVAL)
        + INTERVAL '1 month' - INTERVAL '1 day')::DATE                         AS month_end
    FROM generate_series(11, 0, -1) AS gs(n)
    -- 11 months ago → this month, so the final ORDER is oldest-first
  ),

  -- ── 2. Items the user owned at some point ─────────────────────────────────
  user_items AS (
    SELECT
      game_id,
      condition_state,
      region,
      acquired_at::DATE AS acquired_date
    FROM public.user_collection
    WHERE user_id = p_user_id
  ),

  -- ── 3. Explode: one row per (month × item) that existed by month_end ──────
  monthly_combos AS (
    SELECT
      ms.month_start,
      ms.month_end,
      ui.game_id,
      ui.condition_state,
      ui.region
    FROM month_series ms
    CROSS JOIN user_items ui
    -- Only include items the user already had before the month ended
    WHERE ui.acquired_date <= ms.month_end
  ),

  -- ── 4. Resolve the closest available price for each combo ─────────────────
  -- DISTINCT ON picks the first row per group after ORDER BY.
  -- Ordering by recorded_date DESC means we get the most recent price
  -- that is still <= month_end (i.e., what was known at that point in time).
  latest_prices AS (
    SELECT DISTINCT ON (mc.month_start, mc.game_id, mc.condition_state, mc.region)
      mc.month_start,
      hp.market_price_cleaned
    FROM monthly_combos mc
    LEFT JOIN public.historical_prices hp ON
      hp.game_id        = mc.game_id        AND
      hp.condition_state = mc.condition_state AND
      hp.region          = mc.region          AND
      hp.recorded_date  <= mc.month_end
    ORDER BY
      mc.month_start,
      mc.game_id,
      mc.condition_state,
      mc.region,
      hp.recorded_date DESC NULLS LAST  -- NULL last: items with no price yet keep the row but contribute 0
  )

  -- ── 5. Aggregate per month ────────────────────────────────────────────────
  SELECT
    ms.month_start,
    COALESCE(SUM(lp.market_price_cleaned), 0)::NUMERIC(10, 2) AS valor_total
  FROM month_series ms
  LEFT JOIN latest_prices lp ON lp.month_start = ms.month_start
  GROUP BY ms.month_start
  ORDER BY ms.month_start;
$$;

-- Grant execute to authenticated users so the JS client can call it via RPC.
-- The SECURITY DEFINER already handles the internal table access.
GRANT EXECUTE ON FUNCTION public.get_collection_value_history(UUID)
  TO authenticated;
