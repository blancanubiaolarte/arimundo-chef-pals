import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Arquitectura lista para Chef IA (todavía NO conectado a un modelo).
 *
 * Reglas que debe respetar la implementación futura:
 * 1. La respuesta parte SIEMPRE de la biblioteca de recetas publicadas.
 * 2. Nunca sugiere ingredientes registrados como alergia o prohibidos.
 * 3. Nunca hace afirmaciones médicas; siempre incluye el aviso veterinario.
 * 4. La clave del modelo vive solo en el backend, jamás en el frontend.
 */

export const askChefIA = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { message: string; dogId?: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: recipes } = await supabase
      .from("recipes")
      .select("id, title, slug, minutes, category")
      .eq("published", true)
      .limit(50);

    let blocked: string[] = [];
    if (data.dogId) {
      const { data: dog } = await supabase
        .from("dogs")
        .select("allergies, forbidden_ingredients")
        .eq("id", data.dogId)
        .maybeSingle();
      blocked = [...(dog?.allergies ?? []), ...(dog?.forbidden_ingredients ?? [])];
    }

    return {
      ready: false as const,
      message: data.message,
      candidates: recipes ?? [],
      blocked,
      disclaimer:
        "Esta información es orientativa y no reemplaza el consejo de un veterinario.",
    };
  });
