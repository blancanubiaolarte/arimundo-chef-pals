ALTER TABLE public.dogs
  ADD COLUMN IF NOT EXISTS is_neutered boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS health_conditions text[] NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS public.generated_recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dog_id uuid REFERENCES public.dogs(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category recipe_category NOT NULL DEFAULT 'principal',
  ingredients jsonb NOT NULL DEFAULT '[]'::jsonb,
  steps text[] NOT NULL DEFAULT '{}',
  minutes integer NOT NULL DEFAULT 0,
  servings integer NOT NULL DEFAULT 1,
  benefits text NOT NULL DEFAULT '',
  storage text NOT NULL DEFAULT '',
  warnings text NOT NULL DEFAULT '',
  difficulty text NOT NULL DEFAULT 'facil',
  calories integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.generated_recipes TO authenticated;
GRANT ALL ON public.generated_recipes TO service_role;

ALTER TABLE public.generated_recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "generated_recipes_own" ON public.generated_recipes
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER generated_recipes_updated_at
  BEFORE UPDATE ON public.generated_recipes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS generated_recipes_dog_idx ON public.generated_recipes (dog_id, created_at DESC);