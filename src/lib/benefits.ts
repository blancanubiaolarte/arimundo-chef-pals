import { INGREDIENTS } from "./mock-data";
import type { IngredientCategory, Recipe } from "./types";

/**
 * Beneficios generales y no médicos de los ingredientes de una receta.
 * Redacción siempre orientativa: nunca afirma efectos de salud.
 */
const BY_CATEGORY: Record<IngredientCategory, { emoji: string; text: string }> = {
  proteina: { emoji: "🥩", text: "Fuente de proteína." },
  vegetal: { emoji: "🥕", text: "Aporta fibra." },
  cereal: { emoji: "🍚", text: "Fuente de energía." },
  fruta: { emoji: "🍎", text: "Aporta frescura natural." },
  grasa: { emoji: "🥑", text: "Aporta grasas de origen natural." },
  suplemento: { emoji: "✨", text: "Complemento en pequeñas cantidades." },
};

export function benefitsFor(recipe: Recipe): { emoji: string; text: string }[] {
  const seen = new Set<string>();
  const list: { emoji: string; text: string }[] = [];

  for (const ing of recipe.ingredients) {
    const known = INGREDIENTS.find(
      (i) => i.name.toLowerCase() === ing.name.trim().toLowerCase(),
    );
    const category = known?.category ?? "proteina";
    if (seen.has(category)) continue;
    seen.add(category);
    list.push(BY_CATEGORY[category]);
  }

  if (recipe.category === "hidratacion") {
    list.push({ emoji: "💧", text: "Ayuda a mantener una buena hidratación cuando corresponde." });
  }
  if (recipe.minutes <= 10) {
    list.push({ emoji: "⏱", text: "Preparación rápida para el día a día." });
  }
  return list;
}
