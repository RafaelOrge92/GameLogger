-- ================================================================
-- GameLogger Retro Market - Pricing & Collection Schema
-- ================================================================
-- This migration adds market valuation capabilities to the project.
-- It is designed to complement the existing schema.sql.
--
-- Run this file AFTER schema.sql has been applied.
-- Compatible with: PostgreSQL 15+ / Supabase
-- ================================================================


-- ----------------------------------------------------------------
-- SECTION 1: HELPER TYPE
-- ----------------------------------------------------------------
-- Reusable domain for condition_state across both tables.
-- Using a CHECK constraint instead of a PG ENUM so that adding
-- new states in the future is a simple ALTER TABLE, not an ALTER TYPE.

-- ----------------------------------------------------------------
-- SECTION 2: user_collection
-- ----------------------------------------------------------------
-- Stores each physical item a user owns with its condition and region.
-- This is separate from the existing `collections` table which tracks
-- play status — here the focus is on market/valuation data.

CREATE TABLE IF NOT EXISTS public.user_collection (
    id              BIGINT          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    -- Owner reference — CASCADE on delete so orphan rows are never left behind
    user_id         UUID            NOT NULL
                        REFERENCES auth.users (id) ON DELETE CASCADE,

    -- Game identifier from the IGDB API (numeric)
    game_id         INTEGER         NOT NULL,

    -- Physical condition of the item
    -- 'loose'  = cartridge / disc only, no box or manual
    -- 'cib'    = Complete In Box (game + box + manual)
    -- 'sealed' = factory sealed, never opened
    condition_state TEXT            NOT NULL
                        CHECK (condition_state IN ('loose', 'cib', 'sealed')),

    -- Market region that determines price tier
    -- Examples: 'PAL-ES', 'PAL-UK', 'NTSC-U', 'NTSC-J'
    region          TEXT            NOT NULL,

    -- What the user actually paid (optional, personal tracking)
    purchase_price  NUMERIC(10, 2),

    -- When the item was added to the collection
    acquired_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- RLS for user_collection
-- ----------------------------------------------------------------
ALTER TABLE public.user_collection ENABLE ROW LEVEL SECURITY;

-- Users can only read their own items
CREATE POLICY "user_collection: select own rows"
    ON public.user_collection
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can only insert items for themselves
CREATE POLICY "user_collection: insert own rows"
    ON public.user_collection
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can only update their own items
CREATE POLICY "user_collection: update own rows"
    ON public.user_collection
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can only delete their own items
CREATE POLICY "user_collection: delete own rows"
    ON public.user_collection
    FOR DELETE
    USING (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- Indexes for user_collection
-- ----------------------------------------------------------------
-- Quickly fetch all items for a given user
CREATE INDEX IF NOT EXISTS idx_user_collection_user_id
    ON public.user_collection (user_id);

-- Quickly fetch all users who own a specific game (e.g. to show community stats)
CREATE INDEX IF NOT EXISTS idx_user_collection_game_id
    ON public.user_collection (game_id);


-- ----------------------------------------------------------------
-- SECTION 3: historical_prices
-- ----------------------------------------------------------------
-- Stores the cleaned market price for each (game, condition, region)
-- combination, recorded once per day by the daily pricing script.
--
-- The IQR-filtered price is stored so queries can go directly to
-- chart rendering without needing to post-process outliers.

CREATE TABLE IF NOT EXISTS public.historical_prices (
    id                      BIGINT          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    -- Game identifier from the IGDB API (numeric)
    game_id                 INTEGER         NOT NULL,

    -- Physical condition segment
    condition_state         TEXT            NOT NULL
                                CHECK (condition_state IN ('loose', 'cib', 'sealed')),

    -- Market region segment (e.g. 'PAL-ES', 'NTSC-U', 'NTSC-J')
    region                  TEXT            NOT NULL,

    -- Final price after IQR outlier filtering (in EUR or configured currency)
    market_price_cleaned    NUMERIC(10, 2)  NOT NULL,

    -- The calendar day this snapshot was taken (one row per day per segment)
    recorded_date           DATE            NOT NULL DEFAULT CURRENT_DATE
);

-- ----------------------------------------------------------------
-- Unique constraint on historical_prices
-- ----------------------------------------------------------------
-- Prevents the daily script from accidentally inserting duplicate
-- snapshots for the same (game, condition, region, date) combination.
-- The script can use ON CONFLICT DO UPDATE to upsert safely.
ALTER TABLE public.historical_prices
    ADD CONSTRAINT uq_historical_prices_segment_date
    UNIQUE (game_id, condition_state, region, recorded_date);

-- ----------------------------------------------------------------
-- Composite index for historical_prices (chart queries)
-- ----------------------------------------------------------------
-- This index covers the exact WHERE + ORDER BY pattern used when
-- fetching a time-series for a chart:
--   WHERE game_id = $1 AND condition_state = $2 AND region = $3
--   ORDER BY recorded_date ASC
--
-- Because recorded_date is the last column, range scans and ordering
-- are both served from this single index — no extra sort step needed.
CREATE INDEX IF NOT EXISTS idx_historical_prices_segment_date
    ON public.historical_prices (game_id, condition_state, region, recorded_date);

-- ----------------------------------------------------------------
-- RLS for historical_prices
-- ----------------------------------------------------------------
-- Price history is public read-only data (no user_id column).
-- Write access is intentionally left to service-role only so
-- only the server-side daily script can insert/update prices.
ALTER TABLE public.historical_prices ENABLE ROW LEVEL SECURITY;

-- Anyone (authenticated or anonymous) can read price history
CREATE POLICY "historical_prices: public read"
    ON public.historical_prices
    FOR SELECT
    USING (true);

-- INSERT / UPDATE / DELETE are blocked for all non-service-role callers.
-- The daily script must use the Supabase service-role key (bypasses RLS).


-- ================================================================
-- DAILY SCRIPT UPSERT PATTERN (reference for the pricing script)
-- ================================================================
--
-- Use ON CONFLICT with the unique constraint to make the daily run
-- idempotent — safe to re-run without creating duplicate rows:
--
--   INSERT INTO public.historical_prices
--       (game_id, condition_state, region, market_price_cleaned, recorded_date)
--   VALUES
--       ($1, $2, $3, $4, CURRENT_DATE)
--   ON CONFLICT ON CONSTRAINT uq_historical_prices_segment_date
--   DO UPDATE SET
--       market_price_cleaned = EXCLUDED.market_price_cleaned;
--
--
-- CHART QUERY PATTERN (reference for the frontend)
-- ================================================================
--
-- Fetch 1 year of daily prices for a specific game segment:
--
--   SELECT recorded_date, market_price_cleaned
--   FROM   public.historical_prices
--   WHERE  game_id        = $1           -- e.g. 119133
--     AND  condition_state = $2          -- e.g. 'cib'
--     AND  region         = $3           -- e.g. 'PAL-ES'
--     AND  recorded_date  >= CURRENT_DATE - INTERVAL '1 year'
--   ORDER  BY recorded_date ASC;
--
-- ================================================================
