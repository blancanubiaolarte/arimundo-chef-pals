ALTER TABLE public.usage_counters
  ADD COLUMN IF NOT EXISTS cycle_start timestamptz NOT NULL DEFAULT date_trunc('month', now()),
  ADD COLUMN IF NOT EXISTS cycle_end timestamptz NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month'),
  ADD COLUMN IF NOT EXISTS cycle_generated integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trial_generated integer NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS usage_counters_user_id_key ON public.usage_counters (user_id);