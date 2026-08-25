/**
 * Control de consumo mensual/diario de recetas (solo backend).
 * Nunca se confía en el frontend: cada generación pasa por aquí.
 */
import { limitFor, renewalDate, type UsagePlanId, type UsageSummary } from "./usage-limits";

type Supa = { from: (t: string) => any };

type Row = {
  id: string;
  plan: string;
  recipes_generated: number;
  month: number;
  year: number;
  daily_generated: number;
  daily_date: string;
  last_recipe_at: string | null;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

/** Lee (y crea si hace falta) el contador del usuario, reiniciándolo por mes/día. */
export async function loadUsage(
  supabase: Supa,
  userId: string,
  plan: UsagePlanId,
): Promise<{ row: Row; summary: UsageSummary }> {
  const now = new Date();
  const month = now.getUTCMonth() + 1;
  const year = now.getUTCFullYear();

  const { data } = await supabase
    .from("usage_counters")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  let row = data as Row | null;

  if (!row) {
    const { data: created } = await supabase
      .from("usage_counters")
      .insert({ user_id: userId, plan, month, year, daily_date: today() })
      .select("*")
      .maybeSingle();
    row = (created ?? {
      id: "",
      plan,
      recipes_generated: 0,
      month,
      year,
      daily_generated: 0,
      daily_date: today(),
      last_recipe_at: null,
    }) as Row;
  }

  // Reinicio automático de contadores
  const patch: Record<string, unknown> = {};
  if (row.month !== month || row.year !== year) {
    row = { ...row, month, year, recipes_generated: 0 };
    patch["month"] = month;
    patch["year"] = year;
    patch["recipes_generated"] = 0;
  }
  if (row.daily_date !== today()) {
    row = { ...row, daily_date: today(), daily_generated: 0 };
    patch["daily_date"] = today();
    patch["daily_generated"] = 0;
  }
  if (row.plan !== plan) {
    row = { ...row, plan };
    patch["plan"] = plan;
  }
  if (Object.keys(patch).length && row.id) {
    await supabase.from("usage_counters").update(patch).eq("id", row.id);
  }

  return { row, summary: summarize(row, plan) };
}

export function summarize(row: Row, plan: UsagePlanId): UsageSummary {
  const cfg = limitFor(plan);
  const period: "dia" | "mes" = cfg.daily !== null ? "dia" : "mes";
  const limit = (period === "dia" ? cfg.daily : cfg.monthly) ?? 0;
  const used = period === "dia" ? row.daily_generated : row.recipes_generated;
  return {
    plan,
    planName: cfg.name,
    used,
    limit,
    remaining: Math.max(0, limit - used),
    period,
    renewsAt: renewalDate(period),
    lastRecipeAt: row.last_recipe_at,
    month: row.month,
    year: row.year,
  };
}

/** Verifica el límite ANTES de llamar a OpenAI. */
export async function checkQuota(supabase: Supa, userId: string, plan: UsagePlanId) {
  const { row, summary } = await loadUsage(supabase, userId, plan);
  return { allowed: summary.remaining > 0, row, summary };
}

/** Registra una receta generada. */
export async function consumeQuota(
  supabase: Supa,
  row: Row,
  plan: UsagePlanId,
): Promise<UsageSummary> {
  const next: Row = {
    ...row,
    recipes_generated: row.recipes_generated + 1,
    daily_generated: row.daily_generated + 1,
    last_recipe_at: new Date().toISOString(),
  };
  if (row.id) {
    await supabase
      .from("usage_counters")
      .update({
        recipes_generated: next.recipes_generated,
        daily_generated: next.daily_generated,
        last_recipe_at: next.last_recipe_at,
      })
      .eq("id", row.id);
  }
  return summarize(next, plan);
}

/** Plan activo del usuario (perfil + suscripción Stripe cuando exista). */
export async function resolvePlan(supabase: Supa, userId: string): Promise<UsagePlanId> {
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("user_id", userId)
    .maybeSingle();
  if (sub?.status === "active" && sub.plan) return sub.plan as UsagePlanId;

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, trial_ends_at")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.trial_ends_at && new Date(profile.trial_ends_at) > new Date()) return "trial";
  return ((profile?.plan as UsagePlanId) ?? "gratis") satisfies UsagePlanId;
}
