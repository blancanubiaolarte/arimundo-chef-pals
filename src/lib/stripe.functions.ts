import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Arquitectura lista para Stripe (todavía NO conectado).
 *
 * Cuando se active el pago, solo hay que rellenar estos handlers con las
 * llamadas a la API de Stripe usando STRIPE_SECRET_KEY (secreto del backend).
 * El frontend nunca debe ver claves.
 */

export type PlanId = "basico" | "familiar" | "premium";

export const PLAN_PRICES: Record<PlanId, number> = {
  basico: 2.99,
  familiar: 5.99,
  premium: 9.99,
};

/** Crea la sesión de Checkout para el plan elegido. */
export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { plan: PlanId }) => input)
  .handler(async ({ data }) => {
    // TODO(Stripe): crear la sesión de Checkout y devolver { url }.
    return {
      ready: false as const,
      plan: data.plan,
      price: PLAN_PRICES[data.plan],
      message: "Stripe todavía no está conectado.",
    };
  });

/** Abre el portal del cliente para gestionar o cancelar la suscripción. */
export const createCustomerPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    // TODO(Stripe): crear la sesión del Customer Portal y devolver { url }.
    return { ready: false as const, message: "Stripe todavía no está conectado." };
  });
