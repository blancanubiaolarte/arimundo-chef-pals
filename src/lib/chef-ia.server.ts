import { createOpenAIJson, createOpenAIResponse } from "./openai.server";
import { TOXIC_LIST } from "./dog-safety";

export const VET_DISCLAIMER =
  "Esta información es orientativa y no reemplaza el consejo de un veterinario.";

const BASE_RULES = `Eres "Chef IA" de ARIMUNDO MASCOTAS: un nutricionista especializado en alimentación canina casera.
Reglas obligatorias:
1. Responde SIEMPRE en español, con tono cálido, claro y práctico.
2. Analiza SIEMPRE el perfil completo del perro (edad, peso, raza, sexo, actividad, esterilización, alergias, condiciones de salud, objetivo, ingredientes prohibidos y favoritos) antes de proponer nada.
3. Ajusta porciones y calorías al peso y al nivel de actividad del perro.
4. NUNCA uses ingredientes tóxicos para perros: ${TOXIC_LIST}.
5. NUNCA uses ingredientes marcados como alergia o prohibidos. Si el usuario los pide, ofrece un sustituto seguro.
6. NUNCA hagas diagnósticos ni afirmaciones médicas; usa "advertencias" solo como precauciones generales.
7. No repitas recetas del historial que se te entrega: propón siempre algo distinto.
8. Cierra recordando que la información no reemplaza al veterinario.`;

export type DogProfileContext = {
  name?: string | null;
  sex?: string | null;
  ageYears?: number | null;
  breed?: string | null;
  weight?: number | null;
  weightUnit?: string | null;
  activityLevel?: string | null;
  isNeutered?: boolean | null;
  goal?: string | null;
  allergies?: string[];
  healthConditions?: string[];
  forbidden?: string[];
  favorites?: string[];
  disliked?: string[];
  cookingTime?: string | null;
  hasOven?: boolean | null;
};

export function describeDog(dog: DogProfileContext | null): string {
  if (!dog) return "No hay perfil de perro seleccionado.";
  const lines = [
    `Nombre: ${dog.name ?? "sin nombre"}`,
    `Sexo: ${dog.sex ?? "no indicado"}`,
    `Edad: ${dog.ageYears ?? "?"} años`,
    `Raza: ${dog.breed ?? "mestizo"}`,
    `Peso: ${dog.weight ?? "?"} ${dog.weightUnit ?? "kg"}`,
    `Nivel de actividad: ${dog.activityLevel ?? "moderado"}`,
    `Esterilizado: ${dog.isNeutered ? "sí" : "no"}`,
    `Objetivo nutricional: ${dog.goal ?? "mantenimiento"}`,
    `Alergias: ${dog.allergies?.length ? dog.allergies.join(", ") : "ninguna registrada"}`,
    `Condiciones de salud: ${dog.healthConditions?.length ? dog.healthConditions.join(", ") : "ninguna registrada"}`,
    `Ingredientes prohibidos: ${dog.forbidden?.length ? dog.forbidden.join(", ") : "ninguno"}`,
    `Ingredientes favoritos: ${dog.favorites?.length ? dog.favorites.join(", ") : "sin preferencias"}`,
    `Ingredientes que no le gustan: ${dog.disliked?.length ? dog.disliked.join(", ") : "ninguno"}`,
    `Tiempo de cocina disponible: ${dog.cookingTime ?? "flexible"}`,
    `Horno disponible: ${dog.hasOven ? "sí" : "no"}`,
  ];
  return lines.join("\n");
}

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
  dog?: DogProfileContext | null | undefined;
  history?: string[] | undefined;
}): Promise<string> {
  const library = params.candidates
    .map((r) => `- ${r.title} (${r.minutes ?? "?"} min, ${r.category ?? "general"})`)
    .join("\n");

  const input = [
    `PERFIL DEL PERRO:\n${describeDog(params.dog ?? null)}`,
    params.blocked.length
      ? `Ingredientes PROHIBIDOS / alergias: ${params.blocked.join(", ")}`
      : "Sin alergias registradas.",
    params.history?.length
      ? `Recetas ya generadas o preparadas para este perro (NO las repitas): ${params.history.join(", ")}`
      : null,
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
    maxOutputTokens: 900,
  });
}

export type GeneratedRecipe = {
  title: string;
  description: string;
  category: string;
  minutes: number;
  servings: number;
  difficulty: string;
  calories: number;
  ingredients: { name: string; quantity: string }[];
  steps: string[];
  benefits: string;
  storage: string;
  warnings: string;
};

const RECIPE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "description",
    "category",
    "minutes",
    "servings",
    "difficulty",
    "calories",
    "ingredients",
    "steps",
    "benefits",
    "storage",
    "warnings",
  ],
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    category: { type: "string", enum: ["desayuno", "principal", "snack", "premio", "hidratacion"] },
    minutes: { type: "integer" },
    servings: { type: "integer" },
    difficulty: { type: "string", enum: ["facil", "media", "avanzada"] },
    calories: { type: "integer", description: "Calorías aproximadas por porción" },
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
    benefits: { type: "string" },
    storage: { type: "string" },
    warnings: { type: "string" },
  },
} as const;

export async function generateRecipeWithOpenAI(params: {
  prompt: string;
  blocked: string[];
  dog?: DogProfileContext | null | undefined;
  history?: string[] | undefined;
  pantry?: string[] | undefined;
  maxMinutes?: number | undefined;
  noOven?: boolean | undefined;
}): Promise<GeneratedRecipe> {
  const input = [
    `PERFIL DEL PERRO:\n${describeDog(params.dog ?? null)}`,
    `Petición: ${params.prompt}`,
    params.blocked.length
      ? `Ingredientes PROHIBIDOS (nunca usar): ${params.blocked.join(", ")}`
      : "Sin ingredientes prohibidos.",
    params.history?.length
      ? `Recetas ya creadas para este perro (crea una DIFERENTE, no repitas título ni base principal): ${params.history.join(", ")}`
      : null,
    params.pantry?.length ? `Prefiere estos ingredientes disponibles: ${params.pantry.join(", ")}` : null,
    params.maxMinutes ? `Tiempo máximo: ${params.maxMinutes} minutos.` : null,
    params.noOven ? "La receta NO puede usar horno." : null,
  ]
    .filter(Boolean)
    .join("\n");

  return createOpenAIJson<GeneratedRecipe>({
    instructions: `${BASE_RULES}
Devuelve UNA única receta casera para perro con este formato completo: título, descripción, ingredientes con cantidades exactas, preparación paso a paso, tiempo, porciones, beneficios nutricionales, conservación, advertencias veterinarias cuando sean necesarias, nivel de dificultad y calorías aproximadas por porción.
Ajusta las porciones y las calorías al peso, edad, esterilización y nivel de actividad del perro.
El campo "benefits" describe beneficios nutricionales generales, nunca terapéuticos ni diagnósticos.
El campo "warnings" contiene precauciones generales (introducir gradualmente, consultar al veterinario ante condiciones de salud); deja una cadena vacía si no aplica.`,
    input,
    temperature: 0.8,
    maxOutputTokens: 1400,
    jsonSchema: { name: "dog_recipe", schema: RECIPE_SCHEMA as unknown as Record<string, unknown> },
  });
}
