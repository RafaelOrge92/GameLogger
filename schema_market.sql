
























CREATE TABLE IF NOT EXISTS public.user_collection (
    id              BIGINT          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    
    user_id         UUID            NOT NULL
                        REFERENCES auth.users (id) ON DELETE CASCADE,

    
    game_id         INTEGER         NOT NULL,

    
    
    
    
    condition_state TEXT            NOT NULL
                        CHECK (condition_state IN ('loose', 'cib', 'sealed')),

    
    
    region          TEXT            NOT NULL,

    
    purchase_price  NUMERIC(10, 2),

    
    acquired_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);




ALTER TABLE public.user_collection ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_collection: select own rows"
    ON public.user_collection
    FOR SELECT
    USING (auth.uid() = user_id);


CREATE POLICY "user_collection: insert own rows"
    ON public.user_collection
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);


CREATE POLICY "user_collection: update own rows"
    ON public.user_collection
    FOR UPDATE
    USING (auth.uid() = user_id);


CREATE POLICY "user_collection: delete own rows"
    ON public.user_collection
    FOR DELETE
    USING (auth.uid() = user_id);





CREATE INDEX IF NOT EXISTS idx_user_collection_user_id
    ON public.user_collection (user_id);


CREATE INDEX IF NOT EXISTS idx_user_collection_game_id
    ON public.user_collection (game_id);











CREATE TABLE IF NOT EXISTS public.historical_prices (
    id                      BIGINT          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    
    game_id                 INTEGER         NOT NULL,

    
    condition_state         TEXT            NOT NULL
                                CHECK (condition_state IN ('loose', 'cib', 'sealed')),

    
    region                  TEXT            NOT NULL,

    
    market_price_cleaned    NUMERIC(10, 2)  NOT NULL,

    
    recorded_date           DATE            NOT NULL DEFAULT CURRENT_DATE
);







ALTER TABLE public.historical_prices
    ADD CONSTRAINT uq_historical_prices_segment_date
    UNIQUE (game_id, condition_state, region, recorded_date);











CREATE INDEX IF NOT EXISTS idx_historical_prices_segment_date
    ON public.historical_prices (game_id, condition_state, region, recorded_date);







ALTER TABLE public.historical_prices ENABLE ROW LEVEL SECURITY;


CREATE POLICY "historical_prices: public read"
    ON public.historical_prices
    FOR SELECT
    USING (true);



































