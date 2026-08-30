import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PlanId = "basico" | "familiar" | "pro" | "premium";

/** Indica si las variables de entorno de Stripe están configuradas (sin exponer valores). */
export const getStripeStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { stripeConfigStatus } = await import("@/lib/stripe.server");
  return stripeConfigStatus();
});

/** Crea la sesión de Checkout para el plan elegido y devuelve la URL de Stripe. */
export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { plan: PlanId }) => input)
  .handler(async ({ data, context }) => {
    const { createCheckout, ensureCustomer, MissingStripeConfigError } = await import(
      "@/lib/stripe.server"
    );
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { supabase, userId, claims } = context;

    try {
      // Lectura con el cliente del usuario (RLS: solo su propia fila).
      const { data: existing } = await supabase
        .from("subscriptions")
        .select("stripe_customer_id")
        .eq("user_id", userId)
        .maybeSingle();

      const email = (claims as { email?: string } | null)?.email ?? null;
      const customerId = await ensureCustomer({
        email,
        userId,
        existingCustomerId: existing?.stripe_customer_id ?? null,
      });

      const origin = new URL(getRequest().url).origin;
      const session = await createCheckout({
        customerId,
        plan: data.plan,
        userId,
        successUrl: `${origin}/perfil?checkout=exito`,
        cancelUrl: `${origin}/planes?checkout=cancelado`,
      });

      // Escritura con service role: la tabla es de solo lectura para el usuario.
      // No otorga plan: sólo guarda el customer para reutilizarlo y poder abrir el portal.
      await supabaseAdmin.from("subscriptions").upsert(
        {
          user_id: userId,
          plan: data.plan === "pro" ? "familiar" : data.plan,
          status: "incomplete",
          stripe_customer_id: customerId,
        },
        { onConflict: "user_id" },
      );

      if (!session.url) {
        return { ready: false as const, message: "Stripe no devolvió una URL de pago." };
      }
      return { ready: true as const, url: session.url, sessionId: session.id };
    } catch (error) {
      const message =
        error instanceof MissingStripeConfigError
          ? error.message
          : error instanceof Error
            ? error.message
            : "No se pudo iniciar el pago.";
      return { ready: false as const, message };
    }
  });

/** Abre el portal del cliente para gestionar o cancelar la suscripción. */
export const createCustomerPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { createPortal, MissingStripeConfigError } = await import("@/lib/stripe.server");
    const { supabase, userId } = context;
    try {
      const { data: existing } = await supabase
        .from("subscriptions")
        .select("stripe_customer_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!existing?.stripe_customer_id) {
        return {
          ready: false as const,
          message: "Todavía no tienes una suscripción activa para gestionar.",
        };
      }

      const origin = new URL(getRequest().url).origin;
      const session = await createPortal({
        customerId: existing.stripe_customer_id,
        returnUrl: `${origin}/perfil`,
      });
      return { ready: true as const, url: session.url };
    } catch (error) {
      const message =
        error instanceof MissingStripeConfigError
          ? error.message
          : error instanceof Error
            ? error.message
            : "No se pudo abrir el portal de suscripción.";
      return { ready: false as const, message };
    }
  });

/**
 * Verificación segura tras volver de Checkout: consulta el estado real en Stripe
 * y actualiza la base de datos si el webhook aún no ha llegado.
 * Nunca otorga un plan sin una suscripción confirmada por Stripe.
 */
export const syncSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    try {
      const { data: existing } = await supabase
        .from("subscriptions")
        .select("stripe_customer_id, plan, status, current_period_end")
        .eq("user_id", userId)
        .maybeSingle();

      if (!existing?.stripe_customer_id) {
        return { ready: true as const, plan: "gratis", status: "none" };
      }

      const { listCustomerSubscriptions, statusGrantsAccess } = await import(
        "@/lib/stripe.server"
      );
      const { applySubscriptionState, subscriptionToState } = await import(
        "@/lib/subscriptions.server"
      );

      const subs = await listCustomerSubscriptions(existing.stripe_customer_id);
      const active = subs.find((s) => statusGrantsAccess(s.status)) ?? subs[0];
      if (!active) {
        return { ready: true as const, plan: "gratis", status: "none" };
      }

      const state = subscriptionToState(active, userId);
      const plan = await applySubscriptionState(state);
      return { ready: true as const, plan, status: active.status };
    } catch (error) {
      return {
        ready: false as const,
        message: error instanceof Error ? error.message : "No se pudo verificar la suscripción.",
      };
    }
  });
