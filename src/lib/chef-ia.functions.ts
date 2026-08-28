import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Chef IA — nutricionista canino impulsado por OpenAI (API Responses).
 *
 * 1. Lee automáticamente el perfil completo del perro desde la base de datos.
 * 2. Considera el historial para no repetir recetas.
 * 3. Valida y sustituye ingredientes tóxicos o prohibidos antes de responder.
 * 4. Guarda cada receta generada y actualiza el historial del perro.
 * 5. La clave del modelo (OPENAI_API_KEY) vive solo en el backend.
 */

const DOG_COLUMNS =
  "id, name, sex, age_years, breed, weight, weight_unit, activity_level, is_neutered, goal, allergies, health_conditions, forbidden_ingredients, favorite_ingredients, disliked_ingredients, cooking_time, has_oven";

type DogRow = {
  id: string;
  name: string;
  sex: string | null;
  age_years: number | null;
  breed: string | null;
  weight: number | null;
  weight_unit: string | null;
  activity_level: string | null;
  is_neutered: boolean | null;
  goal: string | null;
  allergies: string[] | null;
  health_conditions: string[] | null;
  forbidden_ingredients: string[] | null;
  favorite_ingredients: string[] | null;
  disliked_ingredients: string[] | null;
  cooking_time: string | null;
  has_oven: boolean | null;
};

function toContext(dog: DogRow | null) {
  if (!dog) return null;
  return {
    name: dog.name,
    sex: dog.sex,
    ageYears: dog.age_years,
    breed: dog.breed,
    weight: dog.weight,
    weightUnit: dog.weight_unit,
    activityLevel: dog.activity_level,
    isNeutered: dog.is_neutered,
    goal: dog.goal,
    allergies: dog.allergies ?? [],
    healthConditions: dog.health_conditions ?? [],
    forbidden: dog.forbidden_ingredients ?? [],
    favorites: dog.favorite_ingredients ?? [],
    disliked: dog.disliked_ingredients ?? [],
    cookingTime: dog.cooking_time,
    hasOven: dog.has_oven,
  };
}

type Supa = { from: (t: string) => any };

async function loadDog(supabase: Supa, dogId: string | undefined, userId: string) {
  const query = supabase.from("dogs").select(DOG_COLUMNS).eq("user_id", userId).limit(1);
  const { data } = dogId
    ? await supabase.from("dogs").select(DOG_COLUMNS).eq("id", dogId).maybeSingle()
    : await query.maybeSingle();
  return (data ?? null) as DogRow | null;
}

/** Títulos de recetas ya generadas o preparadas para ese perro. */
async function loadHistory(supabase: Supa, dogId: string | undefined, userId: string) {
  if (!dogId) return [] as string[];
  const [generated, prepared] = await Promise.all([
    supabase
      .from("generated_recipes")
      .select("title")
      .eq("dog_id", dogId)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("prepared_recipes")
      .select("recipe:recipes(title)")
      .eq("dog_id", dogId)
      .order("prepared_at", { ascending: false })
      .limit(20),
  ]);
  const titles = [
    ...((generated.data ?? []) as { title: string }[]).map((r) => r.title),
    ...((prepared.data ?? []) as { recipe: { title: string } | null }[])
      .map((r) => r.recipe?.title)
      .filter((t): t is string => Boolean(t)),
  ];
  void userId;
  return Array.from(new Set(titles)).slice(0, 30);
}

export const askChefIA = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { message: string; dogId?: string; pantry?: string[] }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { askChefWithOpenAI, VET_DISCLAIMER } = await import("./chef-ia.server");

    const { data: recipes } = await supabase
      .from("recipes")
      .select("id, title, slug, minutes, category")
      .eq("published", true)
      .limit(50);

    const dog = await loadDog(supabase as unknown as Supa, data.dogId, userId);
    const history = await loadHistory(supabase as unknown as Supa, dog?.id, userId);
    const blocked = [...(dog?.allergies ?? []), ...(dog?.forbidden_ingredients ?? [])];

    try {
      const reply = await askChefWithOpenAI({
        message: data.message,
        candidates: recipes ?? [],
        blocked,
        pantry: data.pantry ?? [],
        dog: toContext(dog),
        history,
      });
      return {
        ready: true as const,
        reply,
        message: data.message,
        candidates: recipes ?? [],
        blocked,
        disclaimer: VET_DISCLAIMER,
      };
    } catch (error) {
      return {
        ready: false as const,
        reply: error instanceof Error ? error.message : "No se pudo contactar con OpenAI.",
        message: data.message,
        candidates: recipes ?? [],
        blocked,
        disclaimer: VET_DISCLAIMER,
      };
    }
  });

export const generateRecipeIA = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { prompt: string; dogId?: string; pantry?: string[]; maxMinutes?: number; noOven?: boolean }) =>
      input,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { generateRecipeWithOpenAI, VET_DISCLAIMER } = await import("./chef-ia.server");
    const { sanitizeIngredients, sanitizeSteps } = await import("./dog-safety");
    const { checkQuota, consumeQuota, resolveEntitlement } = await import("./usage.server");
    const { LIMIT_REACHED_MESSAGE, LIMIT_REACHED_HELP, TRIAL_LIMIT_REACHED_MESSAGE, TRIAL_LIMIT_REACHED_HELP, NO_PLAN_MESSAGE } =
      await import("./usage-limits");

    // Validación de límite SIEMPRE en el backend, antes de llamar a OpenAI.
    const supa = supabase as unknown as { from: (t: string) => any };
    const ent = await resolveEntitlement(supa, userId);
    const quota = await checkQuota(supa, userId, ent);
    if (!quota.allowed) {
      const noPlan = ent.plan === "gratis";
      return {
        ok: false as const,
        error: noPlan
          ? NO_PLAN_MESSAGE
          : ent.isTrial
            ? TRIAL_LIMIT_REACHED_MESSAGE
            : LIMIT_REACHED_MESSAGE,
        help: ent.isTrial || noPlan ? TRIAL_LIMIT_REACHED_HELP : LIMIT_REACHED_HELP,
        limitReached: true as const,
        usage: quota.summary,
        disclaimer: VET_DISCLAIMER,
      };
    }

    const dog = await loadDog(supabase as unknown as Supa, data.dogId, userId);
    const history = await loadHistory(supabase as unknown as Supa, dog?.id, userId);
    const blocked = [...(dog?.allergies ?? []), ...(dog?.forbidden_ingredients ?? [])];

    try {
      const raw = await generateRecipeWithOpenAI({
        prompt: data.prompt,
        blocked,
        dog: toContext(dog),
        history,
        pantry: data.pantry ?? [],
        maxMinutes: data.maxMinutes,
        noOven: data.noOven ?? (dog?.has_oven === false ? true : undefined),
      });

      // Validación de seguridad: sustituye tóxicos/prohibidos por alternativas seguras.
      const { ingredients, warnings } = sanitizeIngredients(raw.ingredients ?? [], blocked);
      const steps = sanitizeSteps(raw.steps ?? [], ingredients);
      const recipe = {
        ...raw,
        ingredients: ingredients.map((i) => ({ name: i.name, quantity: i.quantity })),
        steps,
        warnings: [raw.warnings, ...warnings].filter(Boolean).join(" "),
      };

      // Guardado automático + actualización del historial del perro.
      const { data: saved } = await supabase
        .from("generated_recipes")
        .insert({
          user_id: userId,
          dog_id: dog?.id ?? null,
          title: recipe.title,
          description: recipe.description ?? "",
          category: (recipe.category ?? "principal") as never,
          ingredients: recipe.ingredients as never,
          steps: recipe.steps,
          minutes: recipe.minutes ?? 0,
          servings: recipe.servings ?? 1,
          benefits: recipe.benefits ?? "",
          storage: recipe.storage ?? "",
          warnings: recipe.warnings ?? "",
          difficulty: recipe.difficulty ?? "facil",
          calories: recipe.calories ?? 0,
        })
        .select("id, created_at")
        .maybeSingle();

      const usage = await consumeQuota(supa, quota.row, plan);

      return {
        ok: true as const,
        recipe,
        usage,
        id: saved?.id ?? null,
        createdAt: saved?.created_at ?? null,
        replaced: ingredients.filter((i) => i.replaced).map((i) => i.replaced as string),
        disclaimer: VET_DISCLAIMER,
      };
    } catch (error) {
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : "No se pudo generar la receta con OpenAI.",
        limitReached: false as const,
        disclaimer: VET_DISCLAIMER,
      };
    }
  });

/** Historial de recetas generadas por IA para un perro. */
export const listGeneratedRecipes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { dogId?: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let q = supabase
      .from("generated_recipes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data.dogId) q = q.eq("dog_id", data.dogId);
    const { data: rows } = await q;
    return { recipes: rows ?? [] };
  });
