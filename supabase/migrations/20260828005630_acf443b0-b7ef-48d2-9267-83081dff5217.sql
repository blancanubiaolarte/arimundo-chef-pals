DROP POLICY IF EXISTS usage_counters_own ON public.usage_counters;

CREATE POLICY usage_counters_select_own ON public.usage_counters
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

REVOKE INSERT, UPDATE, DELETE ON public.usage_counters FROM authenticated;
GRANT SELECT ON public.usage_counters TO authenticated;
GRANT ALL ON public.usage_counters TO service_role;