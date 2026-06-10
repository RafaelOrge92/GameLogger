




CREATE TYPE collection_status AS ENUM ('playing', 'completed', 'plan_to_play', 'dropped', 'owned');
CREATE TYPE item_condition AS ENUM ('sealed', 'cib', 'box_and_game', 'loose', 'digital');


CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile."
  ON public.profiles FOR UPDATE USING (auth.uid() = id);


CREATE TABLE public.collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  
  game_id TEXT NOT NULL, 
  title TEXT NOT NULL,   
  cover_url TEXT,        
  platform TEXT,         
  
  
  status collection_status DEFAULT 'owned',
  condition item_condition DEFAULT 'cib', 
  purchase_price DECIMAL(10, 2),          
  currency TEXT DEFAULT 'EUR',
  edition TEXT,                           
  notes TEXT,                             
  
  
  added_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Users can view their own collections."
  ON public.collections FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their own collections."
  ON public.collections FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections."
  ON public.collections FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own collections."
  ON public.collections FOR DELETE USING (auth.uid() = user_id);


CREATE INDEX idx_collections_user_id ON public.collections(user_id);
CREATE INDEX idx_collections_game_id ON public.collections(game_id);


CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();






CREATE TYPE offer_type_enum      AS ENUM ('sell', 'trade', 'both');
CREATE TYPE offer_status_enum    AS ENUM ('active', 'sold', 'cancelled');
CREATE TYPE condition_state_enum AS ENUM ('loose', 'cib', 'sealed');

CREATE TABLE public.marketplace_offers (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID        REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  game_id         BIGINT      NOT NULL,                  
  condition_state condition_state_enum NOT NULL,
  region          TEXT        NOT NULL,
  offer_type      offer_type_enum      NOT NULL,
  price_wanted    DECIMAL(10, 2),                        
  status          offer_status_enum    NOT NULL DEFAULT 'active',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);


ALTER TABLE public.marketplace_offers ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Active offers are viewable by everyone."
  ON public.marketplace_offers FOR SELECT USING (true);

CREATE POLICY "Users can insert their own offers."
  ON public.marketplace_offers FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own offers."
  ON public.marketplace_offers FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own offers."
  ON public.marketplace_offers FOR DELETE USING (auth.uid() = user_id);


CREATE INDEX idx_marketplace_offers_user_id    ON public.marketplace_offers(user_id);
CREATE INDEX idx_marketplace_offers_game_id    ON public.marketplace_offers(game_id);
CREATE INDEX idx_marketplace_offers_status     ON public.marketplace_offers(status);
CREATE INDEX idx_marketplace_offers_offer_type ON public.marketplace_offers(offer_type);
CREATE INDEX idx_marketplace_offers_created_at ON public.marketplace_offers(created_at DESC);


CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER marketplace_offers_updated_at
  BEFORE UPDATE ON public.marketplace_offers
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

