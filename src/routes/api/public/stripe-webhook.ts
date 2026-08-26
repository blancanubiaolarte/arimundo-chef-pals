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

        const { planFromPriceId, retrieveSubscription } = await import("@/lib/stripe.server");
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const upsert = async (row: {
          user_id: string;
          plan: "basico" | "familiar" | "premium";
          status: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          current_period_end: string | null;
        }) => {
          await supabaseAdmin.from("subscriptions").upsert(row, { onConflict: "user_id" });
        };

        try {
          if (event.type === "checkout.session.completed") {
            const userId =
              (obj["client_reference_id"] as string | null) ??
              ((obj["metadata"] as Record<string, string> | undefined)?.["user_id"] ?? null);
            const subscriptionId = obj["subscription"] as string | null;
            if (userId && subscriptionId) {
              const sub = await retrieveSubscription(subscriptionId);
              const plan = planFromPriceId(sub.items?.data?.[0]?.price?.id) ?? "basico";
              await upsert({
                user_id: userId,
                plan: plan === "pro" ? "familiar" : plan,
                status: sub.status,
                stripe_customer_id: sub.customer,
                stripe_subscription_id: sub.id,
                current_period_end: sub.current_period_end
                  ? new Date(sub.current_period_end * 1000).toISOString()
                  : null,
              });
            }
          } else if (
            event.type === "customer.subscription.updated" ||
            event.type === "customer.subscription.deleted" ||
            event.type === "customer.subscription.created"
          ) {
            const userId = (obj["metadata"] as Record<string, string> | undefined)?.["user_id"];
            const items = obj["items"] as
              | { data: Array<{ price?: { id?: string } }> }
              | undefined;
            const plan = planFromPriceId(items?.data?.[0]?.price?.id) ?? "basico";
            const status = event.type.endsWith("deleted")
              ? "canceled"
              : ((obj["status"] as string) ?? "active");
            const periodEnd = obj["current_period_end"] as number | null;

            if (userId) {
              await upsert({
                user_id: userId,
                plan: plan === "pro" ? "familiar" : plan,
                status,
                stripe_customer_id: (obj["customer"] as string) ?? null,
                stripe_subscription_id: (obj["id"] as string) ?? null,
                current_period_end: periodEnd
                  ? new Date(periodEnd * 1000).toISOString()
                  : null,
              });
            } else {
              await supabaseAdmin
                .from("subscriptions")
                .update({
                  status,
                  plan: plan === "pro" ? "familiar" : plan,
                  current_period_end: periodEnd
                    ? new Date(periodEnd * 1000).toISOString()
                    : null,
                })
                .eq("stripe_subscription_id", obj["id"] as string);
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
