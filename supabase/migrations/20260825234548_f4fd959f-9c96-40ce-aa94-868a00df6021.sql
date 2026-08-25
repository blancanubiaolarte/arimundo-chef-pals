ALTER TYPE public.plan_id ADD VALUE IF NOT EXISTS 'gratis';
ALTER TYPE public.plan_id ADD VALUE IF NOT EXISTS 'pro';

CREATE TABLE IF NOT EXISTS public.usage_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'gratis',
  recipes_generated integer NOT NULL DEFAULT 0,
  month integer NOT NULL,
  year integer NOT NULL,
  daily_generated integer NOT NULL DEFAULT 0,
  daily_date date NOT NULL DEFAULT current_date,
  last_recipe_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.usage_counters TO authenticated;
GRANT ALL ON public.usage_counters TO service_role;

ALTER TABLE public.usage_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usage_counters_own" ON public.usage_counters
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER usage_counters_updated_at
  BEFORE UPDATE ON public.usage_counters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();