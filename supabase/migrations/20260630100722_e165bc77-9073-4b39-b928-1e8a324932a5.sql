
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users see own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins see all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Match status enum
CREATE TYPE public.match_status AS ENUM ('upcoming', 'live', 'finished', 'replay');

-- Sports
CREATE TABLE public.sports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  icon text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sports TO anon, authenticated;
GRANT ALL ON public.sports TO service_role;
ALTER TABLE public.sports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sports public read" ON public.sports FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage sports" ON public.sports FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Matches
CREATE TABLE public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_key text NOT NULL REFERENCES public.sports(key) ON DELETE CASCADE,
  competition text,
  home_team text NOT NULL,
  away_team text NOT NULL,
  home_flag text, -- ISO alpha-2 code
  away_flag text,
  kickoff_at timestamptz NOT NULL,
  venue text,
  city text,
  referee text,
  status public.match_status NOT NULL DEFAULT 'upcoming',
  home_score int NOT NULL DEFAULT 0,
  away_score int NOT NULL DEFAULT 0,
  minute int,
  possession_home int,
  shots_home int,
  shots_away int,
  corners_home int,
  corners_away int,
  yellow_home int DEFAULT 0,
  yellow_away int DEFAULT 0,
  red_home int DEFAULT 0,
  red_away int DEFAULT 0,
  stream_url text,
  replay_url text,
  viewer_count int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.matches TO anon, authenticated;
GRANT ALL ON public.matches TO service_role;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Matches public read" ON public.matches FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage matches" ON public.matches FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER matches_updated_at BEFORE UPDATE ON public.matches FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX matches_sport_kickoff_idx ON public.matches(sport_key, kickoff_at);
CREATE INDEX matches_status_idx ON public.matches(status);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;

-- Seed sports
INSERT INTO public.sports (key, name, icon, sort_order) VALUES
  ('fifa-wc', 'FIFA World Cup', '⚽', 1),
  ('mlb', 'MLB', '⚾', 2),
  ('nba', 'NBA', '🏀', 3),
  ('nfl', 'NFL', '🏈', 4),
  ('ufc', 'UFC', '🥊', 5);

-- Seed FIFA World Cup 2026 matches (Round of 32 + selected later rounds)
-- Times are ET; stored as UTC (ET = UTC-4 in summer)
INSERT INTO public.matches (sport_key, competition, home_team, away_team, home_flag, away_flag, kickoff_at, venue, city, status) VALUES
  ('fifa-wc','Round of 32','Ivory Coast','Norway','ci','no','2026-06-30 17:00:00+00','Dallas Stadium','Arlington, TX','upcoming'),
  ('fifa-wc','Round of 32','France','Sweden','fr','se','2026-06-30 21:00:00+00','New York/New Jersey Stadium','East Rutherford, NJ','upcoming'),
  ('fifa-wc','Round of 32','Mexico','Ecuador','mx','ec','2026-07-01 01:00:00+00','Mexico City Stadium','Mexico City, Mexico','upcoming'),
  ('fifa-wc','Round of 32','England','Congo DR','gb-eng','cd','2026-07-01 16:00:00+00','Atlanta Stadium','Atlanta, GA','upcoming'),
  ('fifa-wc','Round of 32','Belgium','Senegal','be','sn','2026-07-01 20:00:00+00','Seattle Stadium','Seattle, WA','upcoming'),
  ('fifa-wc','Round of 32','United States','Bosnia-Herzegovina','us','ba','2026-07-02 00:00:00+00','San Francisco Bay Area Stadium','Santa Clara, CA','upcoming'),
  ('fifa-wc','Round of 32','Spain','Austria','es','at','2026-07-02 19:00:00+00','Los Angeles Stadium','Inglewood, CA','upcoming'),
  ('fifa-wc','Round of 32','Portugal','Croatia','pt','hr','2026-07-02 23:00:00+00','Toronto Stadium','Toronto, Canada','upcoming'),
  ('fifa-wc','Round of 32','Switzerland','Algeria','ch','dz','2026-07-03 03:00:00+00','BC Place','Vancouver, Canada','upcoming'),
  ('fifa-wc','Round of 32','Australia','Egypt','au','eg','2026-07-03 18:00:00+00','Dallas Stadium','Arlington, TX','upcoming'),
  ('fifa-wc','Round of 32','Argentina','Cape Verde','ar','cv','2026-07-03 22:00:00+00','Miami Stadium','Miami Gardens, FL','upcoming'),
  ('fifa-wc','Round of 32','Colombia','Ghana','co','gh','2026-07-04 01:30:00+00','Kansas City Stadium','Kansas City, MO','upcoming');
