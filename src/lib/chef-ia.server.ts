import { createOpenAIJson, createOpenAIResponse } from "./openai.server";

export const VET_DISCLAIMER =
  "Esta información es orientativa y no reemplaza el consejo de un veterinario.";

const BASE_RULES = `Eres "Chef IA" de ARIMUNDO MASCOTAS, un asistente de cocina casera para perros.
Reglas obligatorias:
1. Responde SIEMPRE en español, con tono cálido, breve y práctico.
2. Prioriza SIEMPRE las recetas de la biblioteca que se te entrega. Solo propón algo nuevo si ninguna encaja.
3. NUNCA sugieras ingredientes marcados como alergia o prohibidos.
4. NUNCA hagas afirmaciones médicas ni diagnósticos.
5. Cierra recordando que la información no reemplaza al veterinario.`;

export type RecipeCandidate = {
  id: string;
  title: string;
  slug: string;
  minutes: number | null;
  category: string | null;
};

export async function askChefWithOpenAI(params: {
  message: string;
  candidates: RecipeCandidate[];
  blocked: string[];
  pantry?: string[] | undefined;
  dogName?: string | null | undefined;
}): Promise<string> {
  const library = params.candidates
    .map((r) => `- ${r.title} (${r.minutes ?? "?"} min, ${r.category ?? "general"})`)
    .join("\n");

  const input = [
    params.dogName ? `Perro: ${params.dogName}` : null,
    params.blocked.length
      ? `Ingredientes PROHIBIDOS / alergias: ${params.blocked.join(", ")}`
      : "Sin alergias registradas.",
    params.pantry?.length ? `Alacena disponible: ${params.pantry.join(", ")}` : null,
    `Biblioteca de recetas publicadas:\n${library || "(vacía)"}`,
    `Mensaje del usuario: ${params.message}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  return createOpenAIResponse({
    instructions: BASE_RULES,
    input,
    temperature: 0.6,
    maxOutputTokens: 700,
  });
}

export type GeneratedRecipe = {
  title: string;
  minutes: number;
  servings: number;
  ingredients: { name: string; quantity: string }[];
  steps: string[];
  storage: string;
  benefit: string;
};

const RECIPE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "minutes", "servings", "ingredients", "steps", "storage", "benefit"],
  properties: {
    title: { type: "string" },
    minutes: { type: "integer" },
    servings: { type: "integer" },
    ingredients: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "quantity"],
        properties: { name: { type: "string" }, quantity: { type: "string" } },
      },
    },
    steps: { type: "array", items: { type: "string" } },
    storage: { type: "string" },
    benefit: { type: "string" },
  },
} as const;

export async function generateRecipeWithOpenAI(params: {
  prompt: string;
  blocked: string[];
  pantry?: string[] | undefined;
  maxMinutes?: number | undefined;
  noOven?: boolean | undefined;
}): Promise<GeneratedRecipe> {
  const input = [
    `Petición: ${params.prompt}`,
    params.blocked.length
      ? `Ingredientes PROHIBIDOS (nunca usar): ${params.blocked.join(", ")}`
      : "Sin ingredientes prohibidos.",
    params.pantry?.length ? `Prefiere estos ingredientes disponibles: ${params.pantry.join(", ")}` : null,
    params.maxMinutes ? `Tiempo máximo: ${params.maxMinutes} minutos.` : null,
    params.noOven ? "La receta NO puede usar horno." : null,
  ]
    .filter(Boolean)
    .join("\n");

  return createOpenAIJson<GeneratedRecipe>({
    instructions: `${BASE_RULES}\nDevuelve una única receta casera para perro, con cantidades claras y sin afirmaciones médicas. El campo "benefit" describe un beneficio general, nunca terapéutico.`,
    input,
    temperature: 0.7,
    maxOutputTokens: 900,
    jsonSchema: { name: "dog_recipe", schema: RECIPE_SCHEMA as unknown as Record<string, unknown> },
  });
}
