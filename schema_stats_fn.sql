



















CREATE OR REPLACE FUNCTION public.get_collection_value_history(p_user_id UUID)
RETURNS TABLE(month_start DATE, valor_total NUMERIC)
LANGUAGE sql
SECURITY DEFINER   
STABLE             
AS $$
  WITH
  
  month_series AS (
    SELECT
      date_trunc('month', CURRENT_DATE - (gs.n || ' months')::INTERVAL)::DATE AS month_start,
      
      (date_trunc('month', CURRENT_DATE - (gs.n || ' months')::INTERVAL)
        + INTERVAL '1 month' - INTERVAL '1 day')::DATE                         AS month_end
    FROM generate_series(11, 0, -1) AS gs(n)
    
  ),

  
  user_items AS (
    SELECT
      game_id,
      condition_state,
      region,
      acquired_at::DATE AS acquired_date
    FROM public.user_collection
    WHERE user_id = p_user_id
  ),

  
  monthly_combos AS (
    SELECT
      ms.month_start,
      ms.month_end,
      ui.game_id,
      ui.condition_state,
      ui.region
    FROM month_series ms
    CROSS JOIN user_items ui
    
    WHERE ui.acquired_date <= ms.month_end
  ),

  
  
  
  
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
      hp.recorded_date DESC NULLS LAST  
  )

  
  SELECT
    ms.month_start,
    COALESCE(SUM(lp.market_price_cleaned), 0)::NUMERIC(10, 2) AS valor_total
  FROM month_series ms
  LEFT JOIN latest_prices lp ON lp.month_start = ms.month_start
  GROUP BY ms.month_start
  ORDER BY ms.month_start;
$$;



GRANT EXECUTE ON FUNCTION public.get_collection_value_history(UUID)
  TO authenticated;
