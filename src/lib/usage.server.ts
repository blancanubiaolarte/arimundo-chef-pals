/**
 * Control de consumo de recetas de IA por ciclo de facturación (solo backend).
 * Nunca se confía en el frontend: cada generación pasa por aquí.
 */
import { limitFor, type UsagePlanId, type UsageSummary } from "./usage-limits";

type Supa = { from: (t: string) => any };

/**
 * Cliente con permisos de servicio: el contador solo se escribe desde el
 * backend (los usuarios únicamente pueden leer su propia fila).
 */
async function admin(): Promise<Supa> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as Supa;
}

type Row = {
  id: string;
  plan: string;
  recipes_generated: number;
  month: number;
  year: number;
  daily_generated: number;
  daily_date: string;
  last_recipe_at: string | null;
  cycle_start: string;
  cycle_end: string;
  cycle_generated: number;
  trial_generated: number;
};

export type Entitlement = {
  plan: UsagePlanId;
  isTrial: boolean;
  /** Fin del ciclo vigente (renovación de Stripe o fin de prueba) */
  cycleStart: string;
  cycleEnd: string;
};

function addMonths(date: Date, months: number) {
  const d = new Date(date.getTime());
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

/**
 * Plan activo y ciclo vigente del usuario.
 * La fuente de verdad es la suscripción sincronizada desde Stripe.
 */
export async function resolveEntitlement(supabase: Supa, userId: string): Promise<Entitlement> {
  const now = new Date();

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan, status, current_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  const activeStatus = sub?.status === "active" || sub?.status === "trialing";
  if (activeStatus && sub?.plan && sub.plan !== "gratis") {
    // El ciclo lo marca Stripe (current_period_end). Si aún no llegó el dato,
    // usamos un ciclo mensual desde hoy.
    let cycleEnd = sub.current_period_end ? new Date(sub.current_period_end) : addMonths(now, 1);
    while (cycleEnd.getTime() <= now.getTime()) cycleEnd = addMonths(cycleEnd, 1);
    const cycleStart = addMonths(cycleEnd, -1);
    return {
      plan: sub.plan as UsagePlanId,
      isTrial: false,
      cycleStart: cycleStart.toISOString(),
      cycleEnd: cycleEnd.toISOString(),
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, trial_ends_at, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.trial_ends_at && new Date(profile.trial_ends_at) > now) {
    const end = new Date(profile.trial_ends_at);
    const start = profile.created_at ? new Date(profile.created_at) : addMonths(end, -1);
    return {
      plan: "trial",
      isTrial: true,
      cycleStart: start.toISOString(),
      cycleEnd: end.toISOString(),
    };
  }

  // Sin plan activo: ciclo mensual natural, límite 0.
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return {
    plan: "gratis",
    isTrial: false,
    cycleStart: start.toISOString(),
    cycleEnd: addMonths(start, 1).toISOString(),
  };
}

/** Compatibilidad con llamadas antiguas. */
export async function resolvePlan(supabase: Supa, userId: string): Promise<UsagePlanId> {
  return (await resolveEntitlement(supabase, userId)).plan;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

/** Lee (y crea si hace falta) el contador del usuario, reiniciándolo por ciclo. */
export async function loadUsage(
  supabase: Supa,
  userId: string,
  ent: Entitlement,
): Promise<{ row: Row; summary: UsageSummary }> {
  const now = new Date();

  const db = await admin();
  const { data } = await db
    .from("usage_counters")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  let row = data as Row | null;

  if (!row) {
    const { data: created } = await db
      .from("usage_counters")
      .insert({
        user_id: userId,
        plan: ent.plan,
        month: now.getUTCMonth() + 1,
        year: now.getUTCFullYear(),
        daily_date: today(),
        cycle_start: ent.cycleStart,
        cycle_end: ent.cycleEnd,
        cycle_generated: 0,
        trial_generated: 0,
      })
      .select("*")
      .maybeSingle();
    row = (created ?? {
      id: "",
      plan: ent.plan,
      recipes_generated: 0,
      month: now.getUTCMonth() + 1,
      year: now.getUTCFullYear(),
      daily_generated: 0,
      daily_date: today(),
      last_recipe_at: null,
      cycle_start: ent.cycleStart,
      cycle_end: ent.cycleEnd,
      cycle_generated: 0,
      trial_generated: 0,
    }) as Row;
  }

  const patch: Record<string, unknown> = {};

  // Reinicio sólo cuando el ciclo de facturación terminó.
  const cycleExpired = !row.cycle_end || new Date(row.cycle_end).getTime() <= now.getTime();
  if (cycleExpired) {
    row = { ...row, cycle_start: ent.cycleStart, cycle_end: ent.cycleEnd, cycle_generated: 0 };
    patch["cycle_start"] = ent.cycleStart;
    patch["cycle_end"] = ent.cycleEnd;
    patch["cycle_generated"] = 0;
  } else if (row.cycle_end !== ent.cycleEnd && !ent.isTrial) {
    // Cambio de plan dentro del ciclo: se conserva el consumo ya realizado.
    row = { ...row, cycle_start: ent.cycleStart, cycle_end: ent.cycleEnd };
    patch["cycle_start"] = ent.cycleStart;
    patch["cycle_end"] = ent.cycleEnd;
  }

  if (row.plan !== ent.plan) {
    row = { ...row, plan: ent.plan };
    patch["plan"] = ent.plan;
  }

  if (Object.keys(patch).length && row.id) {
    await db.from("usage_counters").update(patch).eq("id", row.id);
  }

  return { row, summary:
