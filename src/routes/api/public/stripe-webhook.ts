import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

function verifySignature(payload: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const parts = header.split(",").reduce<Record<string, string>>((acc, part) => {
    const [k, v] = part.split("=");
    if (k && v) acc[k] = v;
    return acc;
  }, {});
  const timestamp = parts["t"];
  const signature = parts["v1"];
  if (!timestamp || !signature) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["STRIPE_WEBHOOK_SECRET"];
        if (!secret) {
          return new Response("Falta STRIPE_WEBHOOK_SECRET", { status: 500 });
        }
        const body = await request.text();
        if (!verifySignature(body, request.headers.get("stripe-signature"), secret)) {
          return new Response("Firma inválida", { status: 401 });
        }

        const event = JSON.parse(body) as {
          type: string;
          data: { object: Record<string, unknown> };
        };
        const obj = event.data.object;

        const { retrieveSubscription } = await import("@/lib/stripe.server");
        const { applySubscriptionState, subscriptionToState } = await import(
          "@/lib/subscriptions.server"
        );
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        /** Encuentra el usuario por metadata, cliente o suscripción guardada. */
        const resolveUserId = async (opts: {
          metadataUserId?: string | null;
          customerId?: string | null;
          subscriptionId?: string | null;
        }): Promise<string | null> => {
          if (opts.metadataUserId) return opts.metadataUserId;
          if (opts.subscriptionId) {
            const { data } = await supabaseAdmin
              .from("subscriptions")
              .select("user_id")
              .eq("stripe_subscription_id", opts.subscriptionId)
              .maybeSingle();
            if (data?.user_id) return data.user_id;
          }
          if (opts.customerId) {
            const { data } = await supabaseAdmin
              .from("subscriptions")
              .select("user_id")
              .eq("stripe_customer_id", opts.customerId)
              .maybeSingle();
            if (data?.user_id) return data.user_id;
          }
          return null;
        };

        try {
          if (event.type === "checkout.session.completed") {
            const metadataUserId =
              (obj["client_reference_id"] as string | null) ??
              ((obj["metadata"] as Record<string, string> | undefined)?.["user_id"] ?? null);
            const subscriptionId = obj["subscription"] as string | null;
            const userId = await resolveUserId({
              metadataUserId,
              customerId: obj["customer"] as string | null,
              subscriptionId,
            });
            if (userId && subscriptionId) {
              const sub = await retrieveSubscription(subscriptionId);
              await applySubscriptionState(subscriptionToState(sub, userId));
            }
          } else if (
            event.type === "customer.subscription.created" ||
            event.type === "customer.subscription.updated" ||
            event.type === "customer.subscription.deleted"
          ) {
            const subscriptionId = obj["id"] as string;
            const userId = await resolveUserId({
              metadataUserId:
                (obj["metadata"] as Record<string, string> | undefined)?.["user_id"] ?? null,
              customerId: obj["customer"] as string | null,
              subscriptionId,
            });
            if (userId) {
              // Releemos desde Stripe para tener siempre la forma actual del objeto.
              const sub = await retrieveSubscription(subscriptionId).catch(() => null);
              const state = sub
                ? subscriptionToState(sub, userId)
                : {
                    userId,
                    plan: null,
                    status: (obj["status"] as string) ?? "canceled",
                    customerId: (obj["customer"] as string) ?? null,
                    subscriptionId,
                    currentPeriodEnd: null,
                  };
              if (event.type === "customer.subscription.deleted") {
                state.status = "canceled";
              }
              await applySubscriptionState(state);
            }
          } else if (event.type === "invoice.payment_failed") {
            // Stripe sigue reintentando: marcamos past_due sin quitar el acceso.
            const subscriptionId =
              (obj["subscription"] as string | null) ??
              ((obj["parent"] as Record<string, unknown> | undefined)?.[
                "subscription_details"
              ] as { subscription?: string } | undefined)?.subscription ??
              null;
            const userId = await resolveUserId({
              customerId: obj["customer"] as string | null,
              subscriptionId,
            });
            if (userId) {
              await supabaseAdmin
                .from("subscriptions")
                .update({ status: "past_due" })
                .eq("user_id", userId);
            }
          }
        } catch (error) {
          console.error("stripe-webhook", error);
          return new Response("Error procesando el evento", { status: 500 });
        }

        return new Response("ok");
      },
    },
  },
});
