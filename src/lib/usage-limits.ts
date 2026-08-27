/**
 * Límites de generación de recetas por plan.
 * Módulo isomórfico: la validación real ocurre siempre en el backend.
 */

export type UsagePlanId = "gratis" | "basico" | "pro" | "premium" | "trial" | "familiar";

export type PlanLimit = {
  id: UsagePlanId;
  name: string;
  price: number;
  /** Recetas por mes (null si el límite es diario) */
  monthly: number | null;
  /** Recetas por día (null si el límite es mensual) */
  daily: number | null;
};

export const PLAN_LIMITS: Record<UsagePlanId, PlanLimit> = {
  gratis: { id: "gratis", name: "Gratis", price: 0, monthly: null, daily: 1 },
  basico: { id: "basico", name: "Básico", price: 4.99, monthly: 30, daily: null },
  pro: { id: "pro", name: "Pro", price: 7.99, monthly: 100, daily: null },
  premium: { id: "premium", name: "Premium", price: 10.99, monthly: 200, daily: null },
  // Compatibilidad con los planes históricos de la app
  trial: { id: "trial", name: "Prueba gratuita", price: 0, monthly: 200, daily: null },
  familiar: { id: "familiar", name: "Plus", price: 7.99, monthly: 100, daily: null },
};

export function limitFor(plan: string | null | undefined): PlanLimit {
  return PLAN_LIMITS[(plan as UsagePlanId) ?? "gratis"] ?? PLAN_LIMITS.gratis;
}

export type UsageSummary = {
  plan: UsagePlanId;
  planName: string;
  /** Usadas en el periodo vigente (mes, o día en el plan gratis) */
  used: number;
  limit: number;
  remaining: number;
  /** "dia" | "mes" */
  period: "dia" | "mes";
  /** Fecha en que se reinicia el contador (ISO) */
  renewsAt: string;
  lastRecipeAt: string | null;
  month: number;
  year: number;
};

/** Fecha de renovación: mañana para el plan diario, primer día del próximo mes para el resto. */
export function renewalDate(period: "dia" | "mes", now = new Date()): string {
  if (period === "dia") {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    return d.toISOString();
  }
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString();
}

export const LIMIT_REACHED_MESSAGE =
  "Alcanzaste el límite de recetas de tu plan. Actualiza tu suscripción para seguir creando recetas con el Chef IA.";
