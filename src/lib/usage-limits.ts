/**
 * Límites de generación de recetas personalizadas con Chef IA.
 * Módulo isomórfico: la validación real ocurre siempre en el backend.
 */

export type UsagePlanId = "gratis" | "basico" | "pro" | "premium" | "trial" | "familiar";

export type PlanLimit = {
  id: UsagePlanId;
  name: string;
  price: number;
  /** Recetas de IA permitidas por ciclo (mes de facturación o prueba completa) */
  perCycle: number;
  /** "ciclo" mensual de suscripción o "prueba" gratuita */
  period: "ciclo" | "prueba";
};

export const PLAN_LIMITS: Record<UsagePlanId, PlanLimit> = {
  gratis: { id: "gratis", name: "Sin plan activo", price: 0, perCycle: 0, period: "ciclo" },
  trial: { id: "trial", name: "Prueba gratuita", price: 0, perCycle: 5, period: "prueba" },
  basico: { id: "basico", name: "ARIMUNDO Chef Básico", price: 4.99, perCycle: 30, period: "ciclo" },
  pro: { id: "pro", name: "ARIMUNDO Chef Plus", price: 7.99, perCycle: 60, period: "ciclo" },
  familiar: {
    id: "familiar",
    name: "ARIMUNDO Chef Plus",
    price: 7.99,
    perCycle: 60,
    period: "ciclo",
  },
  premium: {
    id: "premium",
    name: "ARIMUNDO Chef Premium",
    price: 10.99,
    perCycle: 100,
    period: "ciclo",
  },
};

export function limitFor(plan: string | null | undefined): PlanLimit {
  return PLAN_LIMITS[(plan as UsagePlanId) ?? "gratis"] ?? PLAN_LIMITS.gratis;
}

export type UsageSummary = {
  plan: UsagePlanId;
  planName: string;
  /** Recetas de IA usadas en el ciclo (o durante la prueba) */
  used: number;
  limit: number;
  remaining: number;
  period: "ciclo" | "prueba";
  /** Fecha en que se reinicia el contador (ISO) — fin del ciclo de facturación */
  renewsAt: string;
  lastRecipeAt: string | null;
  isTrial: boolean;
};

export const LIMIT_REACHED_MESSAGE =
  "Has alcanzado el límite mensual de recetas personalizadas con IA de tu plan.";

export const LIMIT_REACHED_HELP =
  "Puedes esperar a la renovación de tu ciclo mensual o mejorar tu plan para obtener más recetas personalizadas.";

export const TRIAL_LIMIT_REACHED_MESSAGE =
  "Has utilizado las 5 recetas personalizadas incluidas en tu prueba gratuita.";

export const TRIAL_LIMIT_REACHED_HELP =
  "Elige un plan para seguir creando recetas personalizadas con Chef IA.";

export const NO_PLAN_MESSAGE =
  "Tu prueba gratuita terminó y no tienes una suscripción activa.";

/** Texto de consumo listo para mostrar en la interfaz. */
export function usageLabel(u: UsageSummary): string {
  if (u.isTrial) {
    return `Te quedan ${u.remaining} de ${u.limit} recetas de IA durante tu prueba gratuita.`;
  }
  return `${u.remaining} de ${u.limit} recetas de IA disponibles este mes`;
}
