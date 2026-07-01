
CREATE TABLE public.match_redirects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL UNIQUE REFERENCES public.matches(id) ON DELETE CASCADE,
  primary_url text,
  backup_url text,
  open_in_new_tab boolean NOT NULL DEFAULT true,
  enabled boolean NOT NULL DEFAULT true,
  click_count integer NOT NULL DEFAULT 0,
  clicks_today integer NOT NULL DEFAULT 0,
  last_clicked_at timestamptz,
  last_reset_date date NOT NULL DEFAULT CURRENT_DATE,
  -- Future-proofing columns
  country_overrides jsonb NOT NULL DEFAULT '{}'::jsonb,
  scheduled_switch_at timestamptz,
  scheduled_url text,
  provider text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.match_redirects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_redirects TO authenticated;
GRANT ALL ON public.match_redirects TO service_role;

ALTER TABLE public.match_redirects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Redirects public read"
  ON public.match_redirects FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins manage redirects"
  ON public.match_redirects FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER match_redirects_updated_at
  BEFORE UPDATE ON public.match_redirects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Atomic click increment with daily reset
CREATE OR REPLACE FUNCTION public.increment_redirect_click(_match_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.match_redirects
  SET
    click_count = click_count + 1,
    clicks_today = CASE WHEN last_reset_date < CURRENT_DATE THEN 1 ELSE clicks_today + 1 END,
    last_reset_date = CURRENT_DATE,
    last_clicked_at = now()
  WHERE match_id = _match_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_redirect_click(uuid) TO anon, authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.match_redirects;
