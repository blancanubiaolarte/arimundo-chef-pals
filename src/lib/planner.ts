import { INGREDIENTS, RECIPES } from "./mock-data";
import type { Dog, Recipe, ShoppingItem, WeeklyPlanDay } from "./types";

export const WEEK_DAYS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

const norm = (s: string) => s.trim().toLowerCase();

/** Ingredientes que el perro no debe recibir (alergias + prohibidos). */
export function blockedFor(dog: Dog | null): string[] {
  if (!dog) return [];
  return [...dog.allergies, ...dog.forbiddenIngredients].map(norm).filter(Boolean);
}

/** Una receta es apta si no contiene ingredientes bloqueados ni requiere horno sin tenerlo. */
export function isSafeFor(recipe: Recipe, dog: Dog | null): boolean {
  const blocked = blockedFor(dog);
  const clash = recipe.ingredients.some((i) => blocked.some((b) => norm(i.name).includes(b)));
  if (clash) return false;
  if (dog && !dog.hasOven && recipe.needsOven) return false;
  return true;
}

/** Puntuación según perfil del perro: gustos, tiempo, objetivo, actividad y edad. */
export function scoreRecipe(recipe: Recipe, dog: Dog | null): number {
  if (!dog) return recipe.views / 1000;
  let score = 0;
  const favs = dog.favoriteIngredients.map(norm).filter(Boolean);
  const disliked = dog.dislikedIngredients.map(norm).filter(Boolean);

  for (const ing of recipe.ingredients) {
    const name = norm(ing.name);
    if (favs.some((f) => name.includes(f))) score += 3;
    if (disliked.some((d) => name.includes(d))) score -= 4;
  }

  const maxMinutes = dog.cookingTime === "30+" ? 999 : Number(dog.cookingTime);
  if (recipe.minutes <= maxMinutes) score += 2;
  else score -= 2;

  const goal = norm(dog.goal);
  if (goal.includes("peso") || goal.includes("adelgaz")) {
    if (recipe.category === "premio" || recipe.category === "snack") score -= 1.5;
    if (recipe.category === "hidratacion") score += 1;
  }
  if (goal.includes("energ") || dog.activityLevel === "alto") {
    if (recipe.category === "principal") score += 1.5;
  }
  if (dog.activityLevel === "bajo" && recipe.category === "principal") score += 0.5;
  if (dog.ageYears < 1 || dog.ageYears > 8) {
    if (recipe.minutes <= 20 && !recipe.needsOven) score += 1;
  }
  if (dog.weight > 25 && recipe.servings >= 3) score += 0.5;

  return score + recipe.views / 5000;
}

/** Recetas publicadas, seguras y ordenadas por afinidad con el perro. */
export function rankedRecipes(dog: Dog | null): Recipe[] {
  return RECIPES.filter((r) => r.published)
    .filter((r) => isSafeFor(r, dog))
    .sort((a, b) => scoreRecipe(b, dog) - scoreRecipe(a, dog));
}

/** Genera 7 días sin repetir recetas mientras haya variedad disponible. */
export function generateWeek(dog: Dog | null, seed = 0): WeeklyPlanDay[] {
  const ranked = rankedRecipes(dog);
  const pool = ranked.length ? ranked : RECIPES.filter((r) => r.published);
  const rotated = pool.map((r, i) => pool[(i + seed) % pool.length]!);
  const used: string[] = [];
  return WEEK_DAYS.map((day, i) => {
    const available = rotated.filter((r) => !used.includes(r.id));
    const list = available.length ? available : rotated;
    const recipe = list[i % list.length]!;
    used.push(recipe.id);
    return { day, recipeId: recipe.id };
  });
}

function categoryOf(name: string): ShoppingItem["category"] {
  return INGREDIENTS.find((i) => norm(i.name) === norm(name))?.category ?? "proteina";
}

/** Agrupa ingredientes iguales y suma cantidades conservando el estado previo. */
export function buildShoppingList(
  plan: WeeklyPlanDay[],
  previous: ShoppingItem[],
): ShoppingItem[] {
  const map = new Map<string, ShoppingItem>();
  for (const day of plan) {
    const recipe = RECIPES.find((r) => r.id === day.recipeId);
    if (!recipe) continue;
    for (const ing of recipe.ingredients) {
      const existing = map.get(ing.ingredientId);
      if (existing) {
        existing.quantity += ing.quantity;
        continue;
      }
      const prev = previous.find((p) => p.id === ing.ingredientId);
      map.set(ing.ingredientId, {
        id: ing.ingredientId,
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        category: categoryOf(ing.name),
        owned: prev?.owned ?? false,
        bought: prev?.bought ?? false,
      });
    }
  }
  return [...map.values()];
}

/** Racha de días consecutivos (hasta hoy o ayer) con al menos una receta preparada. */
export function streakFromLog(dates: string[]): number {
  const days = new Set(dates.map((d) => new Date(d).toDateString()));
  if (days.size === 0) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let cursor = new Date(today);
  if (!days.has(cursor.toDateString())) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(cursor.toDateString())) return 0;
  }
  let streak = 0;
  while (days.has(cursor.toDateString())) {
    streak += 1;
    cursor = new Date(cursor.getTime() - 86400000);
  }
  return streak;
}
