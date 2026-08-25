import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Chef IA — impulsado exclusivamente por OpenAI (API Responses).
 *
 * Reglas:
 * 1. La respuesta parte SIEMPRE de la biblioteca de recetas publicadas.
 * 2. Nunca sugiere ingredientes registrados como alergia o prohibidos.
 * 3. Nunca hace afirmaciones médicas; siempre incluye el aviso veterinario.
 * 4. La clave del modelo (OPENAI_API_KEY) vive solo en el backend.
 */

export const askChefIA = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { message: string; dogId?: string; pantry?: string[] }) => input)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { askChefWithOpenAI, VET_DISCLAIMER } = await import("./chef-ia.server");

    const { data: recipes } = await supabase
      .from("recipes")
      .select("id, title, slug, minutes, category")
      .eq("published", true)
      .limit(50);

    let blocked: string[] = [];
    let dogName: string | null = null;
    if (data.dogId) {
      const { data: dog } = await supabase
        .from("dogs")
        .select("name, allergies, forbidden_ingredients")
        .eq("id", data.dogId)
        .maybeSingle();
      dogName = dog?.name ?? null;
      blocked = [...(dog?.allergies ?? []), ...(dog?.forbidden_ingredients ?? [])];
    }

    try {
      const reply = await askChefWithOpenAI({
        message: data.message,
        candidates: recipes ?? [],
        blocked,
        pantry: data.pantry ?? [],
        dogName,
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
    const { supabase } = context;
    const { generateRecipeWithOpenAI, VET_DISCLAIMER } = await import("./chef-ia.server");

    let blocked: string[] = [];
    if (data.dogId) {
      const { data: dog } = await supabase
        .from("dogs")
        .select("allergies, forbidden_ingredients")
        .eq("id", data.dogId)
        .maybeSingle();
      blocked = [...(dog?.allergies ?? []), ...(dog?.forbidden_ingredients ?? [])];
    }

    try {
      const recipe = await generateRecipeWithOpenAI({
        prompt: data.prompt,
        blocked,
        pantry: data.pantry ?? [],
        maxMinutes: data.maxMinutes,
        noOven: data.noOven,
      });
      return { ok: true as const, recipe, disclaimer: VET_DISCLAIMER };
    } catch (error) {
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : "No se pudo generar la receta con OpenAI.",
        disclaimer: VET_DISCLAIMER,
      };
    }
  });
