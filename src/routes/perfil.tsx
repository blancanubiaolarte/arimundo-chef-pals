import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { createCustomerPortalSession, syncSubscription } from "@/lib/stripe.functions";
import {
  CreditCard,
  LogOut,
  Shield,
  TrendingUp,
  Bell,
  Award,
  LifeBuoy,
  Mail,
  Info,
  FileText,
  Trash2,
} from "lucide-react";
import { Disclaimer } from "@/components/common/Disclaimer";
import { APP_VERSION, APP_BUILD } from "@/lib/app-version";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGate } from "@/components/common/AuthGate";
import { useApp } from "@/lib/app-store";
import { planById } from "@/lib/plans";
import { useEffect, useState } from "react";
import { getUsageSummary } from "@/lib/usage.functions";
import {
  LIMIT_REACHED_HELP,
  LIMIT_REACHED_MESSAGE,
  TRIAL_LIMIT_REACHED_HELP,
  TRIAL_LIMIT_REACHED_MESSAGE,
  type UsageSummary,
} from "@/lib/usage-limits";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil | ARIMUNDO MASCOTAS" },
      {
        name: "description",
        content: "Tu cuenta, suscripción, progreso y preferencias en ARIMUNDO MASCOTAS.",
      },
      { property: "og:title", content: "Perfil | ARIMUNDO MASCOTAS" },
      { property: "og:description", content: "Tu cuenta, suscripción y progreso." },
    ],
  }),
  component: () => (
    <AuthGate>
      <ProfilePage />
    </AuthGate>
  ),
});

function UsageCard({ refreshKey }: { refreshKey: string | number }) {
  const [usage, setUsage] = useState<UsageSummary | null>(null);

  useEffect(() => {
    let alive = true;
    void getUsageSummary()
      .then((u) => {
        if (alive) setUsage(u as UsageSummary);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
    // Se vuelve a pedir cuando cambia el plan del usuario (refreshKey),
    // por ejemplo justo después de completar un pago.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  if (!usage) return null;
  const pct = usage.limit > 0 ? Math.min(100, Math.round((usage.used / usage.limit) * 100)) : 100;

  return (
    <section className="rounded-2xl bg-card p-4 shadow-soft">
      <h2 className="font-display text-base font-extrabold">Recetas con Chef IA</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        {usage.isTrial
          ? `Prueba gratuita · ${usage.remaining} de ${usage.limit} recetas de IA disponibles`
          : `Plan ${usage.planName} · ${usage.remaining} de ${usage.limit} recetas de IA disponibles este mes`}
      </p>
      <p className="mt-2 font-display text-lg font-extrabold">
        {usage.used} / {usage.limit} recetas
      </p>
      <div
        className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        {usage.isTrial
          ? `Tu prueba termina el ${new Date(usage.renewsAt).toLocaleDateString("es")}`
          : `Se renueva el ${new Date(usage.renewsAt).toLocaleDateString("es")} con tu ciclo de facturación`}
      </p>
      {usage.remaining === 0 && (
        <div className="mt-3 rounded-xl bg-muted p-3">
          <p className="text-xs font-bold">
            {usage.isTrial ? TRIAL_LIMIT_REACHED_MESSAGE : LIMIT_REACHED_MESSAGE}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {usage.isTrial ? TRIAL_LIMIT_REACHED_HELP : LIMIT_REACHED_HELP}
          </p>
          <Link
            to="/planes"
            className="mt-3 inline-block rounded-xl bg-brand px-4 py-2 text-xs font-extrabold text-primary-foreground"
          >
            Ver planes
          </Link>
        </div>
      )}
    </section>
  );
}

function ProfilePage() {
  const {
    user,
    dogs,
    prepared,
    favorites,
    trialDaysLeft,
    isTrialActive,
    signOut,
    activeDog,
    addWeightRecord,
    weights,
    refreshUser,
  } = useApp();
  const navigate = useNavigate();
  const openPortal = useServerFn(createCustomerPortalSession);
  const runSyncSubscription = useServerFn(syncSubscription);
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const plan = planById(user?.plan ?? "basico");
  const dogWeights = weights.filter((w) => w.dogId === activeDog?.id);

  // Al volver de Stripe verificamos el pago real antes de mostrar el plan.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") !== "exito") return;

    let alive = true;
    setCheckoutMessage("Confirmando tu pago con Stripe…");

    const verify = async (attempt: number): Promise<void> => {
      try {
        const result = await runSyncSubscription({});
        if (!alive) return;
        if (result.ready && "plan" in result && result.plan && result.plan !== "gratis") {
          await refreshUser();
          if (!alive) return;
          setCheckoutMessage("¡Suscripción activada! Gracias por tu apoyo 🐾");
          window.history.replaceState({}, "", "/perfil");
          return;
        }
      } catch {
        // Reintentamos: el webhook puede tardar unos segundos.
      }
      if (!alive) return;
      if (attempt < 5) {
        setTimeout(() => void verify(attempt + 1), 2000);
      } else {
        setCheckoutMessage(
          "Tu pago se está procesando. El plan se activará en unos minutos.",
        );
        window.history.replaceState({}, "", "/perfil");
      }
    };

    void verify(0);
    return () => {
      alive = false;
    };
  }, [syncSubscription, refreshUser]);


  return (
    <AppShell title="Perfil" subtitle={user?.email}>
      <div className="space-y-4">
        <section className="rounded-2xl bg-card p-4 shadow-soft">
          <p className="font-display text-lg font-extrabold">{user?.name}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </section>

        <section className="rounded-2xl bg-wood-gradient p-4 text-wood-foreground shadow-card">
          <p className="flex items-center gap-2 font-display text-base font-extrabold">
            <CreditCard className="size-4" />
            {isTrialActive
              ? `Prueba gratuita · ${trialDaysLeft} ${trialDaysLeft === 1 ? "día" : "días"}`
              : (plan?.name ?? "Sin plan activo")}
          </p>
          <p className="mt-1 text-xs opacity-90">
            {isTrialActive
              ? "Todas las funciones Premium desbloqueadas. Sin tarjeta."
              : `Hasta ${plan?.maxDogs ?? 1} perro(s) incluidos.`}
          </p>
          {checkoutMessage && (
            <p className="mt-2 text-xs font-bold opacity-95" role="status">
              {checkoutMessage}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              to="/planes"
              className="inline-block rounded-xl bg-card px-4 py-2 text-xs font-extrabold text-foreground"
            >
              Ver planes
            </Link>
            <button
              type="button"
              disabled={portalLoading}
              onClick={async () => {
                setPortalLoading(true);
                setCheckoutMessage(null);
                try {
                  const result = await openPortal({});
                  if (result.ready && "url" in result && result.url) {
                    window.location.href = result.url;
                    return;
                  }
                  setCheckoutMessage(
                    ("message" in result && result.message) ||
                      "No se pudo abrir el portal de suscripción.",
                  );
                } catch (e) {
                  setCheckoutMessage(
                    e instanceof Error ? e.message : "No se pudo abrir el portal.",
                  );
                } finally {
                  setPortalLoading(false);
                }
              }}
              className="inline-block rounded-xl bg-card px-4 py-2 text-xs font-extrabold text-foreground disabled:opacity-70"
            >
              {portalLoading ? "Abriendo…" : "Gestionar suscripción"}
            </button>
          </div>
        </section>


        <UsageCard refreshKey={user?.plan ?? "none"} />

        <section className="grid grid-cols-3 gap-3">
          {[
            ["Perros", dogs.length],
            ["Preparadas", prepared.length],
            ["Favoritas", favorites.length],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-card p-3 text-center shadow-soft">
              <p className="font-display text-xl font-extrabold">{value}</p>
              <p className="text-[11px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </section>

        {activeDog && (
          <section className="rounded-2xl bg-card p-4 shadow-soft">
            <h2 className="flex items-center gap-2 font-display text-base font-extrabold">
              <TrendingUp className="size-4 text-wood" /> Progreso de {activeDog.name}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Peso actual: {activeDog.weight} {activeDog.weightUnit} · {dogWeights.length} registros
            </p>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const value = Number(new FormData(form).get("weight"));
                if (value > 0) addWeightRecord(activeDog.id, value);
                form.reset();
              }}
            >
              <input
                name="weight"
                type="number"
                step="0.1"
                min="0"
                placeholder={`Nuevo peso (${activeDog.weightUnit})`}
                className="flex-1 rounded-xl border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
              <button
                type="submit"
                className="rounded-xl bg-brand px-4 py-2.5 text-sm font-extrabold text-primary-foreground"
              >
                Registrar
              </button>
            </form>
          </section>
        )}

        <section className="divide-y divide-border/60 overflow-hidden rounded-2xl bg-card shadow-soft">
          <Link to="/bienestar" className="flex items-center gap-3 p-4 text-sm font-semibold">
            <Bell className="size-4 text-wood" /> Recordatorios y notificaciones
          </Link>
          <Link to="/bienestar" className="flex items-center gap-3 p-4 text-sm font-semibold">
            <Award className="size-4 text-wood" /> Logros e insignias
          </Link>
          <Link to="/bienestar" className="flex items-center gap-3 p-4 text-sm font-semibold">
            <TrendingUp className="size-4 text-wood" /> 🐶 Bienestar · diario de tu perro
          </Link>
          <Link to="/admin" className="flex items-center gap-3 p-4 text-sm font-semibold">
            <Shield className="size-4 text-wood" /> Panel administrativo
          </Link>
        </section>

        <section className="divide-y divide-border/60 overflow-hidden rounded-2xl bg-card shadow-soft">
          <Link to="/soporte" className="flex items-center gap-3 p-4 text-sm font-semibold">
            <LifeBuoy className="size-4 text-wood" /> Soporte y ayuda
          </Link>
          <Link to="/contacto" className="flex items-center gap-3 p-4 text-sm font-semibold">
            <Mail className="size-4 text-wood" /> Contacto
          </Link>
          <Link to="/acerca" className="flex items-center gap-3 p-4 text-sm font-semibold">
            <Info className="size-4 text-wood" /> Acerca de la app
          </Link>
          <Link to="/privacidad" className="flex items-center gap-3 p-4 text-sm font-semibold">
            <Shield className="size-4 text-wood" /> Política de privacidad
          </Link>
          <Link to="/terminos" className="flex items-center gap-3 p-4 text-sm font-semibold">
            <FileText className="size-4 text-wood" /> Términos y condiciones
          </Link>
          <Link
            to="/eliminar-cuenta"
            className="flex items-center gap-3 p-4 text-sm font-semibold text-destructive"
          >
            <Trash2 className="size-4" /> Eliminar cuenta y datos
          </Link>
        </section>

        <Disclaimer />


        <button
          type="button"
          onClick={() => {
            signOut();
            navigate({ to: "/auth", replace: true });
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-muted py-3 text-sm font-bold text-destructive"
        >
          <LogOut className="size-4" /> Cerrar sesión
        </button>

        <p className="pb-2 text-center text-[11px] text-muted-foreground">
          ARIMUNDO MASCOTAS · versión {APP_VERSION} (build {APP_BUILD})
        </p>
      </div>
    </AppShell>
  );
}
