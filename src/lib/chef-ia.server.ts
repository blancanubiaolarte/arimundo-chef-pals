import { createOpenAIImage, createOpenAIJson, createOpenAIResponse } from "./openai.server";
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
8. Cierra recordando que la información no reemplaza al veterinario.

Reglas de FORMATO (muy importantes, síguelas siempre):
- Usa Markdown real, con saltos de línea de verdad entre secciones (no todo en un solo párrafo seguido).
- Estructura la respuesta así, cada sección en su propio bloque separado por una línea en blanco:
  1. Un saludo breve de 1-2 líneas.
  2. "### " seguido del nombre de la receta.
  3. "**Ingredientes:**" en su propia línea, y cada ingrediente en una línea nueva empezando con "- ".
  4. "**Preparación:**" en su propia línea, y cada paso numerado en su propia línea ("1. ", "2. ", etc.).
  5. "**Porciones y cantidades:**" en su propia línea con el detalle.
  6. "**Tiempo total:**" en su propia línea.
- NUNCA pongas varias frases con títulos en negrita seguidas dentro del mismo párrafo sin salto de línea.`;

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

/** Detecta el título de receta ("### Título") dentro de una respuesta del chat. */
export function extractRecipeTitle(reply: string): string | null {
  const match = reply.match(/^###\s+(.+)$/m);
  return match?.[1]?.trim() || null;
}

/**
 * Extrae, de forma best-effort, los ingredientes y pasos de una respuesta
 * del chat en el formato Markdown que le pedimos al modelo (ver BASE_RULES).
 * Si no encuentra una sección, devuelve un arreglo vacío (la tabla tiene
 * valores por defecto para todo, así que nunca falla el guardado).
 */
function parseChatRecipe(reply: string): {
  ingredients: { name: string; quantity: string }[];
  steps: string[];
} {
  const lines = reply.split("\n");

  const collectSection = (headerRegex: RegExp, itemRegex: RegExp): string[] => {
    const start = lines.findIndex((l) => headerRegex.test(l.trim()));
    if (start === -1) return [];
    const items: string[] = [];
    for (let i = start + 1; i < lines.length; i++) {
      const line = lines[i] ?? "";
      if (line.trim() === "") {
        if (items.length > 0) break;
        continue;
      }
      const match = line.match(itemRegex);
      if (!match) break;
      items.push(match[1]?.trim() ?? "");
    }
    return items;
  };

  const ingredientLines = collectSection(/\*\*Ingredientes:?\*\*/i, /^\s*-\s+(.+)$/);
  const steps = collectSection(/\*\*Preparaci[oó]n:?\*\*/i, /^\s*\d+[.)]\s+(.+)$/);

  const ingredients = ingredientLines.map((line) => {
    // Intenta separar "Pollo (150g)" o "Pollo: 150g" en nombre + cantidad.
    const parenMatch = line.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
    if (parenMatch) return { name: parenMatch[1]!.trim(), quantity: parenMatch[2]!.trim() };
    const colonMatch = line.match(/^(.+?):\s*(.+)$/);
    if (colonMatch) return { name: colonMatch[1]!.trim(), quantity: colonMatch[2]!.trim() };
    return { name: line, quantity: "" };
  });

  return { ingredients, steps };
}

/**
 * Guarda en "generated_recipes" la receta detectada en una respuesta del
 * chat, usando el cliente autenticado del usuario (respeta RLS: cada quien
 * guarda solo lo suyo). Si algo falla, no rompe el chat: solo se registra.
 */
export async function saveChatRecipe(
  supabase: { from: (t: string) => any },
  userId: string,
  dogId: string | null,
  title: string,
  reply: string,
  imageUrl: string | null,
): Promise<void> {
  try {
    const { ingredients, steps } = parseChatRecipe(reply);
    await supabase.from("generated_recipes").insert({
      user_id: userId,
      dog_id: dogId,
      title,
      ingredients,
      steps,
      image_url: imageUrl,
    });
  } catch (err) {
    console.error("[chef-ia] error guardando receta del chat:", err);
  }
}

/** Normaliza un título para usarlo como clave de caché ("Sardinas al Horno " -> "sardinas al horno"). */
function normalizeTitleKey(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita acentos
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Genera una foto apetitosa de la receta y la sube al bucket "recipe-images".
 * Antes de generar, revisa la caché por título: si ya existe una imagen para
 * una receta con el mismo nombre (de este u otro usuario), la reutiliza en
 * vez de pagar por generar una nueva.
 * Devuelve la URL firmada, o null si algo falla (nunca debe romper el chat).
 */
export async function generateAndUploadRecipeImage(
  title: string,
  userId: string,
): Promise<string | null> {
  const titleKey = normalizeTitleKey(title);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const cache = supabaseAdmin as unknown as {
    from: (t: "recipe_image_cache") => {
      select: (cols: string) => {
        eq: (
          col: string,
          val: string,
        ) => { maybeSingle: () => Promise<{ data: { image_url: string } | null }> };
      };
      upsert: (row: {
        title_key: string;
        image_path: string;
        image_url: string;
      }) => Promise<{ error: unknown }>;
    };
  };

  try {
    const { data: cached } = await cache
      .from("recipe_image_cache")
      .select("image_url")
      .eq("title_key", titleKey)
      .maybeSingle();
    if (cached?.image_url) return cached.image_url;
  } catch (err) {
    console.error("[chef-ia] error leyendo caché de imagen:", err);
    // Si falla la lectura de caché, seguimos e intentamos generar igual.
  }

  try {
    const prompt = `Fotografía de comida realista y apetitosa, estilo editorial gastronómico, luz natural suave, fondo de madera clara: "${title}", un plato casero de comida para perro. Sin texto, sin marcas de agua, sin personas ni perros en la imagen, solo el plato servido.`;
    const b64 = await createOpenAIImage(prompt);

    const path = `ai/${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
    const bytes = Buffer.from(b64, "base64");

    const { error: uploadError } = await supabaseAdmin.storage
      .from("recipe-images")
      .upload(path, bytes, { contentType: "image/png", upsert: true });
    if (uploadError) {
      console.error("[chef-ia] error subiendo imagen:", uploadError);
      return null;
    }

    const { data: signed } = await supabaseAdmin.storage
      .from("recipe-images")
      .createSignedUrl(path, 60 * 60 * 24 * 365);
    const imageUrl = signed?.signedUrl ?? null;
    if (!imageUrl) return null;

    // Guardamos en caché para la próxima vez que alguien pida esta misma receta.
    await cache
      .from("recipe_image_cache")
      .upsert({ title_key: titleKey, image_path: path, image_url: imageUrl })
      .then(
        () => undefined,
        (err) => console.error("[chef-ia] error guardando caché de imagen:", err),
      );

    return imageUrl;
  } catch (err) {
    console.error("[chef-ia] error generando imagen:", err);
    return null;
  }
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
