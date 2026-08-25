/**
 * Validación de ingredientes tóxicos para perros.
 * Isomórfico (sin dependencias de servidor). Solo lógica, no toca la UI.
 */

export type ToxicRule = {
  /** Palabras clave que identifican al ingrediente peligroso */
  match: string[];
  /** Nombre legible del ingrediente peligroso */
  label: string;
  /** Reemplazo seguro sugerido */
  safe: string;
  reason: string;
};

export const TOXIC_INGREDIENTS: ToxicRule[] = [
  { match: ["chocolate", "cacao", "cocoa"], label: "chocolate", safe: "algarroba (carob)", reason: "la teobromina es tóxica para perros" },
  { match: ["uva", "uvas", "pasa", "pasas", "raisin"], label: "uvas o pasas", safe: "arándanos", reason: "pueden dañar los riñones" },
  { match: ["cebolla", "cebollin", "cebollín", "cebolleta", "puerro", "chalota"], label: "cebolla", safe: "calabaza", reason: "daña los glóbulos rojos" },
  { match: ["ajo"], label: "ajo", safe: "perejil fresco (poca cantidad)", reason: "daña los glóbulos rojos" },
  { match: ["aguacate", "palta"], label: "aguacate", safe: "calabacín", reason: "contiene persina" },
  { match: ["xilitol", "xylitol", "edulcorante"], label: "xilitol", safe: "puré de manzana sin azúcar", reason: "provoca hipoglucemia grave" },
  { match: ["macadamia"], label: "nuez de macadamia", safe: "semillas de calabaza molidas", reason: "es tóxica para perros" },
  { match: ["nuez moscada"], label: "nuez moscada", safe: "canela en muy poca cantidad", reason: "contiene miristicina" },
  { match: ["alcohol", "cerveza", "vino", "licor"], label: "alcohol", safe: "caldo de pollo sin sal", reason: "es tóxico incluso en dosis bajas" },
  { match: ["café", "cafe ", "cafeína", "cafeina", "té negro", "te negro"], label: "cafeína", safe: "agua o caldo sin sal", reason: "la cafeína es tóxica" },
  { match: ["masa cruda", "levadura"], label: "masa cruda con levadura", safe: "avena cocida", reason: "fermenta en el estómago" },
  { match: ["hueso cocido", "huesos cocidos"], label: "huesos cocidos", safe: "carne magra deshuesada", reason: "se astillan" },
  { match: ["sal ", "sal,", "sal.", "salado"], label: "sal añadida", safe: "hierbas frescas sin sal", reason: "el exceso de sodio es dañino" },
  { match: ["azúcar", "azucar"], label: "azúcar", safe: "puré de plátano maduro", reason: "no aporta valor nutricional al perro" },
  { match: ["cafeina"], label: "cafeína", safe: "agua", reason: "es tóxica" },
];

export function findToxic(name: string): ToxicRule | null {
  const n = ` ${name.toLowerCase().trim()} `;
  for (const rule of TOXIC_INGREDIENTS) {
    if (rule.match.some((m) => n.includes(m.toLowerCase()))) return rule;
  }
  return null;
}

/** Lista plana de nombres tóxicos, para inyectarla en el prompt. */
export const TOXIC_LIST = TOXIC_INGREDIENTS.map((r) => r.label).join(", ");

export type SanitizedIngredient = { name: string; quantity: string; replaced?: string };

/**
 * Sustituye automáticamente cualquier ingrediente tóxico o bloqueado
 * (alergias / prohibidos) por una alternativa segura.
 */
export function sanitizeIngredients(
  ingredients: { name: string; quantity: string }[],
  blocked: string[] = [],
): { ingredients: SanitizedIngredient[]; warnings: string[] } {
  const blockedLower = blocked.map((b) => b.toLowerCase().trim()).filter(Boolean);
  const warnings: string[] = [];

  const result = ingredients.map((ing) => {
    const toxic = findToxic(ing.name);
    if (toxic) {
      warnings.push(
        `Se reemplazó "${ing.name}" por ${toxic.safe} porque ${toxic.reason}.`,
      );
      return { name: toxic.safe, quantity: ing.quantity, replaced: ing.name };
    }
    const hit = blockedLower.find((b) => b.length > 2 && ing.name.toLowerCase().includes(b));
    if (hit) {
      warnings.push(
        `Se reemplazó "${ing.name}" por calabaza cocida porque está en la lista de alergias o ingredientes prohibidos.`,
      );
      return { name: "calabaza cocida", quantity: ing.quantity, replaced: ing.name };
    }
    return { name: ing.name, quantity: ing.quantity };
  });

  return { ingredients: result, warnings };
}

/** Limpia menciones de ingredientes tóxicos en los pasos de preparación. */
export function sanitizeSteps(steps: string[], replacements: SanitizedIngredient[]): string[] {
  let out = steps;
  for (const r of replacements) {
    if (!r.replaced) continue;
    const from = r.replaced;
    out = out.map((s) => s.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), r.name));
  }
  return out;
}
