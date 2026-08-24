import { INGREDIENTS, RECIPES } from "./mock-data";
import { isSafeFor, scoreRecipe } from "./planner";
import type {
  Dog,
  IngredientCategory,
  PantryItem,
  PreparedLogEntry,
  Recipe,
  RecipeIngredient,
} from "./types";

const norm = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export const PANTRY_UNITS = ["g", "kg", "ml", "l", "pza", "taza", "cda"] as const;

export const CATEGORY_META: Record<IngredientCategory, { emoji: string; label: string }> = {
  proteina: { emoji: "🥩", label: "Proteínas" },
  vegetal: { emoji: "🥕", label: "Verduras" },
  fruta: { emoji: "🍎", label: "Frutas" },
  cereal: { emoji: "🥣", label: "Cereales" },
  grasa: { emoji: "🥛", label: "Lácteos y grasas" },
  suplemento: { emoji: "🌿", label: "Otros" },
};

export const CATEGORY_ORDER: IngredientCategory[] = [
  "proteina",
  "vegetal",
  "fruta",
  "cereal",
  "grasa",
  "suplemento",
];

/** Categoría sugerida a partir del catálogo de ingredientes. */
export function guessCategory(name: string): IngredientCategory {
  const n = norm(name);
  const hit =
    INGREDIENTS.find((i) => norm(i.name) === n) ??
    INGREDIENTS.find((i) => norm(i.name).includes(n) || n.includes(norm(i.name)));
  return hit?.category ?? "suplemento";
}

/** Sugerencias del catálogo mientras el usuario escribe. */
export function suggestIngredients(query: string, exclude: string[], limit = 6) {
  const q = norm(query);
  const taken = exclude.map(norm);
  return INGREDIENTS.filter((i) => i.safety !== "evitar")
    .filter((i) => !taken.includes(norm(i.name)))
    .filter((i) => (q ? norm(i.name).includes(q) : true))
    .slice(0, limit);
}

/** ¿Este ingrediente de receta está cubierto por la alacena? */
export function isCovered(ing: RecipeIngredient, items: PantryItem[]): boolean {
  const target = norm(ing.name);
  return items.some((p) => {
    if (p.status !== "disponible") return false;
    const n = norm(p.name);
    return n === target || n.includes(target) || target.includes(n);
  });
}

export interface RecipeMatch {
  recipe: Recipe;
  percent: number;
  have: RecipeIngredient[];
  missing: RecipeIngredient[];
  level: "verde" | "amarillo" | "rojo";
}

export function matchRecipe(recipe: Recipe, items: PantryItem[]): RecipeMatch {
  const have = recipe.ingredients.filter((i) => isCovered(i, items));
  const missing = recipe.ingredients.filter((i) => !isCovered(i, items));
  const percent = recipe.ingredients.length
    ? Math.round((have.length / recipe.ingredients.length) * 100)
    : 0;
  const level = missing.length === 0 ? "verde" : missing.length <= 2 ? "amarillo" : "rojo";
  return { recipe, percent, have, missing, level };
}

/** Recetas compatibles con la alacena y el perfil del perro, ordenadas. */
export function matchesForPantry(
  items: PantryItem[],
  dog: Dog | null,
  opts: { minPercent?: number } = {},
): RecipeMatch[] {
  const min = opts.minPercent ?? 1;
  return RECIPES.filter((r) => r.published)
    .filter((r) => isSafeFor(r, dog))
    .map((r) => matchRecipe(r, items))
    .filter((m) => m.percent >= min)
    .sort(
      (a, b) => b.percent - a.percent || scoreRecipe(b.recipe, dog) - scoreRecipe(a.recipe, dog),
    );
}

export const LEVEL_META = {
  verde: { dot: "🟢", label: "Puedes prepararla completamente" },
  amarillo: { dot: "🟡", label: "Solo necesitas comprar 1 o 2 ingredientes" },
  rojo: { dot: "🔴", label: "Te faltan varios ingredientes" },
} as const;

/** Días restantes hasta el vencimiento (negativo si ya venció). */
export function daysToExpiry(item: PantryItem): number | null {
  if (!item.expiresAt) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(`${item.expiresAt}T00:00:00`);
  return Math.round((exp.getTime() - today.getTime()) / 86400000);
}

export function expiringSoon(items: PantryItem[], withinDays = 3): PantryItem[] {
  return items
    .filter((i) => i.status === "disponible")
    .filter((i) => {
      const d = daysToExpiry(i);
      return d !== null && d <= withinDays;
    })
    .sort((a, b) => (daysToExpiry(a) ?? 0) - (daysToExpiry(b) ?? 0));
}

export function expiryLabel(days: number): string {
  if (days < 0) return "venció";
  if (days === 0) return "vence hoy";
  if (days === 1) return "vence mañana";
  return `vence en ${days} días`;
}

export interface PantryStats {
  registered: number;
  available: number;
  used: number;
  expiring: number;
  recipesWithPantry: number;
  usagePercent: number;
}

export function pantryStats(
  items: PantryItem[],
  preparedLog: PreparedLogEntry[],
): PantryStats {
  const used = items.filter((i) => i.status === "consumido").length;
  const available = items.filter((i) => i.status === "disponible").length;
  const recipesWithPantry = preparedLog.filter((e) => e.usedPantry).length;
  return {
    registered: items.length,
    available,
    used,
    expiring: expiringSoon(items).length,
    recipesWithPantry,
    usagePercent: items.length ? Math.round((used / items.length) * 100) : 0,
  };
}
