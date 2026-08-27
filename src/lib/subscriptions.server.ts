/**
 * Sincronización del estado de suscripción entre Stripe y la base de datos.
 * Solo backend: usa el cliente service role y nunca se importa desde el frontend.
 */
import {
  planFromPriceId,
  periodEndIso,
  statusGrantsAccess,
  type StripeSubscription,
} from "@/lib/stripe.server";

export type DbPlan = "gratis" | "basico" | "familiar" | "premium";

function normalizePlan(plan: string | null): DbPlan {
  if (plan === "pro") return "familiar";
  if (plan === "basico" || plan === "familiar" || plan === "premium") return plan;
  return "gratis";
}

/**
 * Guarda la suscripción y deja `profiles.plan` en el plan correcto.
 * Si Stripe ya no otorga acceso (cancelada/expirada), el perfil vuelve a `gratis`.
 */
export async function applySubscriptionState(opts: {
  userId: string;
  plan: string | null;
  status: string;
  customerId: string | null;
  subscriptionId: string | null;
  currentPeriodEnd: string | null;
}): Promise<DbPlan> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const plan = normalizePlan(opts.plan);
  const hasAccess = statusGrantsAccess(opts.status);

  await supabaseAdmin.from("subscriptions").upsert(
    {
      user_id: opts.userId,
      plan,
      status: opts.status,
      stripe_customer_id: opts.customerId,
      stripe_subscription_id: opts.subscriptionId,
      current_period_end: opts.currentPeriodEnd,
    },
    { onConflict: "user_id" },
  );

  // El perfil refleja el acceso real: plan pagado sólo si Stripe lo confirma.
  const profilePlan: DbPlan = hasAccess ? plan : "gratis";
  await supabaseAdmin.from("profiles").update({ plan: profilePlan }).eq("id", opts.userId);

  return profilePlan;
}

/** Traduce una suscripción de Stripe al estado que guardamos. */
export function subscriptionToState(sub: StripeSubscription, userId: string) {
  return {
    userId,
    plan: planFromPriceId(sub.items?.data?.[0]?.price?.id),
    status: sub.status,
    customerId: typeof sub.customer === "string" ? sub.customer : null,
    subscriptionId: sub.id,
    currentPeriodEnd: periodEndIso(sub),
  };
}
