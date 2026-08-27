import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Check, Crown } from "lucide-react";
import { createCheckoutSession } from "@/lib/stripe.functions";
import { AppShell } from "@/components/layout/AppShell";
import { useApp } from "@/lib/app-store";
import { PLANS } from "@/lib/plans";


export const Route = createFileRoute("/planes")({
  head: () => ({
    meta: [
      { title: "Planes y suscripción | ARIMUNDO MASCOTAS" },
      {
        name: "description",
        content:
          "Compara los planes Básico, Familiar y Premium de ARIMUNDO MASCOTAS y elige el ideal para tu manada.",
      },
      { property: "og:title", content: "Planes y suscripción | ARIMUNDO MASCOTAS" },
      { property: "og:description", content: "Básico, Familiar y Premium desde $2.99 USD al mes." },
    ],
  }),
  component: PlansPage,
});

function PlansPage() {
  const { user, trialDaysLeft, isTrialActive } = useApp();
  const startCheckout = useServerFn(createCheckoutSession);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);


  return (
    <AppShell title="Planes" subtitle="Elige el plan ideal para tu manada">
      <div className="space-y-4">
        <div className="rounded-2xl bg-wood-gradient p-4 text-wood-foreground shadow-card">
          <p className="font-display text-lg font-extrabold">
            {isTrialActive
              ? `Te quedan ${trialDaysLeft} ${trialDaysLeft === 1 ? "día" : "días"} de prueba`
              : "Tu prueba gratuita terminó"}
          </p>
          <p className="mt-1 text-xs opacity-90">
            {isTrialActive
              ? "Disfruta todas las funciones Premium. Sin tarjeta de crédito."
              : "Elige un plan para seguir recibiendo la receta del día."}
          </p>
        </div>

        {PLANS.map((plan) => {
          const current = user?.plan === plan.id;
          return (
            <article
              key={plan.id}
              className={`relative rounded-2xl border-2 bg-card p-4 shadow-soft ${
                plan.highlighted ? "border-primary" : "border-transparent"
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-4 flex items-center gap-1 rounded-full bg-brand px-3 py-1 text-[10px] font-extrabold uppercase text-primary-foreground">
                  <Crown className="size-3" /> Más elegido
                </span>
              )}
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-base font-extrabold">{plan.name}</h2>
                <p className="font-display text-xl font-extrabold">
                  ${plan.price.toFixed(2)}
                  <span className="text-xs font-bold text-muted-foreground"> USD/mes</span>
                </p>
              </div>
              <p className="text-xs text-muted-foreground">{plan.tagline}</p>
              <ul className="mt-3 space-y-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="size-4 text-success" /> {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled={current || loadingPlan === plan.id}
                onClick={async () => {
                  setError(null);
                  setLoadingPlan(plan.id);
                  try {
                    const result = await startCheckout({
                      data: { plan: plan.id as "basico" | "familiar" | "premium" },
                    });
                    if (result.ready && "url" in result && result.url) {
                      window.location.href = result.url;
                      return;
                    }
                    setError(
                      ("message" in result && result.message) ||
                        "No se pudo iniciar el pago. Inténtalo de nuevo.",
                    );
                  } catch (e) {
                    setError(
                      e instanceof Error ? e.message : "No se pudo iniciar el pago.",
                    );
                  } finally {
                    setLoadingPlan(null);
                  }
                }}

                className={`mt-4 w-full rounded-xl py-3 text-sm font-extrabold ${
                  current
                    ? "bg-muted text-muted-foreground"
                    : "bg-brand text-primary-foreground shadow-soft"
                }`}
              >
                {current
                  ? "Tu plan actual"
                  : loadingPlan === plan.id
                    ? "Abriendo pago seguro…"
                    : `Elegir ${plan.name.replace("Plan ", "")}`}

              </button>
            </article>
          );
        })}

        {error && (
          <p
            role="alert"
            className="rounded-2xl bg-destructive/10 p-3 text-center text-xs font-semibold text-destructive"
          >
            {error}
          </p>
        )}

        <p className="pb-2 text-center text-[11px] text-muted-foreground">
          Los pagos se procesarán con Stripe. Puedes cancelar cuando quieras.
        </p>

      </div>
    </AppShell>
  );
}
