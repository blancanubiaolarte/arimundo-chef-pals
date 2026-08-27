/**
 * Cliente mínimo de Stripe (solo backend).
 *
 * Lee exclusivamente variables de entorno del servidor (Vercel / Lovable):
 *   STRIPE_SECRET_KEY
 *   STRIPE_PUBLISHABLE_KEY   (informativo, para el frontend si algún día usa Stripe.js)
 *   STRIPE_BASIC_PRICE_ID
 *   STRIPE_PLUS_PRICE_ID
 *   STRIPE_PREMIUM_PRICE_ID
 *
 * Nunca importar este archivo desde el frontend.
 */

const STRIPE_API = "https://api.stripe.com/v1";

export type StripePlanId = "basico" | "familiar" | "pro" | "premium";

export class MissingStripeConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissingStripeConfigError";
  }
}

export function getSecretKey(): string {
  const key = process.env["STRIPE_SECRET_KEY"];
  if (!key) {
    throw new MissingStripeConfigError(
      "Falta la variable de entorno STRIPE_SECRET_KEY. Configúrala en tu proveedor de despliegue para habilitar los pagos.",
    );
  }
  return key;
}

export function getPublishableKey(): string | null {
  return process.env["STRIPE_PUBLISHABLE_KEY"] ?? null;
}

/** Precio de Stripe correspondiente a cada plan de la aplicación. */
export function priceIdFor(plan: StripePlanId): string {
  const envName =
    plan === "basico"
      ? "STRIPE_BASIC_PRICE_ID"
      : plan === "premium"
        ? "STRIPE_PREMIUM_PRICE_ID"
        : "STRIPE_PLUS_PRICE_ID"; // familiar / pro
  const priceId = process.env[envName];
  if (!priceId) {
    throw new MissingStripeConfigError(
      `Falta la variable de entorno ${envName}. Configúrala para habilitar el plan seleccionado.`,
    );
  }
  return priceId;
}

/** Devuelve qué variables de entorno de Stripe están presentes (sin exponer valores). */
export function stripeConfigStatus() {
  const names = [
    "STRIPE_SECRET_KEY",
    "STRIPE_PUBLISHABLE_KEY",
    "STRIPE_BASIC_PRICE_ID",
    "STRIPE_PLUS_PRICE_ID",
    "STRIPE_PREMIUM_PRICE_ID",
  ] as const;
  const present: Record<string, boolean> = {};
  for (const n of names) present[n] = Boolean(process.env[n]);
  const missing = names.filter((n) => !present[n]);
  return { present, missing, ready: missing.length === 0 };
}

function encode(params: Record<string, string | number | boolean | undefined>): string {
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) body.set(k, String(v));
  }
  return body.toString();
}

async function stripeRequest<T>(
  path: string,
  params: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  const res = await fetch(`${STRIPE_API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: encode(params),
  });
  const json = (await res.json()) as { error?: { message?: string } } & T;
  if (!res.ok) {
    const message = json?.error?.message ?? `Stripe respondió con el estado ${res.status}.`;
    throw new Error(message);
  }
  return json;
}

/** Busca (o crea) el cliente de Stripe asociado al usuario. */
export async function ensureCustomer(opts: {
  email: string | null;
  userId: string;
  existingCustomerId: string | null;
}): Promise<string> {
  if (opts.existingCustomerId) return opts.existingCustomerId;
  const customer = await stripeRequest<{ id: string }>("/customers", {
    email: opts.email ?? undefined,
    "metadata[user_id]": opts.userId,
  });
  return customer.id;
}

export async function createCheckout(opts: {
  customerId: string;
  plan: StripePlanId;
  userId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ id: string; url: string | null }> {
  return stripeRequest<{ id: string; url: string | null }>("/checkout/sessions", {
    mode: "subscription",
    customer: opts.customerId,
    "line_items[0][price]": priceIdFor(opts.plan),
    "line_items[0][quantity]": 1,
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    client_reference_id: opts.userId,
    "metadata[user_id]": opts.userId,
    "metadata[plan]": opts.plan,
    "subscription_data[metadata][user_id]": opts.userId,
    "subscription_data[metadata][plan]": opts.plan,
    allow_promotion_codes: true,
  });
}

export async function createPortal(opts: {
  customerId: string;
  returnUrl: string;
}): Promise<{ url: string }> {
  return stripeRequest<{ url: string }>("/billing_portal/sessions", {
    customer: opts.customerId,
    return_url: opts.returnUrl,
  });
}

export interface StripeSubscription {
  id: string;
  status: string;
  customer: string;
  current_period_end?: number | null;
  cancel_at_period_end?: boolean;
  metadata?: Record<string, string>;
  items?: {
    data: Array<{ price?: { id?: string }; current_period_end?: number | null }>;
  };
}

export async function retrieveSubscription(id: string): Promise<StripeSubscription> {
  const res = await fetch(`${STRIPE_API}/subscriptions/${id}`, {
    headers: { Authorization: `Bearer ${getSecretKey()}` },
  });
  if (!res.ok) throw new Error(`No se pudo leer la suscripción (${res.status}).`);
  return (await res.json()) as StripeSubscription;
}

/** Lista las suscripciones de un cliente (la más reciente primero). */
export async function listCustomerSubscriptions(
  customerId: string,
): Promise<StripeSubscription[]> {
  const res = await fetch(
    `${STRIPE_API}/customers/${customerId}/subscriptions?limit=10`,
    { headers: { Authorization: `Bearer ${getSecretKey()}` } },
  );
  if (!res.ok) throw new Error(`No se pudieron leer las suscripciones (${res.status}).`);
  const json = (await res.json()) as { data?: StripeSubscription[] };
  return json.data ?? [];
}

/**
 * `current_period_end` vive en `items.data[0]` en las versiones recientes de la
 * API de Stripe, con fallback al campo raíz de versiones anteriores.
 */
export function periodEndIso(
  sub: Pick<StripeSubscription, "current_period_end" | "items">,
): string | null {
  const fromItem = sub.items?.data?.[0]?.current_period_end ?? null;
  const seconds = fromItem ?? sub.current_period_end ?? null;
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}

/** Estados de Stripe en los que el usuario conserva el acceso de pago. */
export const ACTIVE_STATUSES = ["active", "trialing", "past_due", "unpaid"] as const;

export function statusGrantsAccess(status: string | null | undefined): boolean {
  return (ACTIVE_STATUSES as readonly string[]).includes(status ?? "");
}

/** Deduce el plan de la app a partir del price ID de Stripe. */
export function planFromPriceId(priceId: string | undefined | null): StripePlanId | null {
  if (!priceId) return null;
  if (priceId === process.env["STRIPE_BASIC_PRICE_ID"]) return "basico";
  if (priceId === process.env["STRIPE_PLUS_PRICE_ID"]) return "familiar";
  if (priceId === process.env["STRIPE_PREMIUM_PRICE_ID"]) return "premium";
  return null;
}

