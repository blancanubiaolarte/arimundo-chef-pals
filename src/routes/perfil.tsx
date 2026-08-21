import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CreditCard, LogOut, Shield, TrendingUp, Bell, Award } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGate } from "@/components/common/AuthGate";
import { useApp } from "@/lib/app-store";
import { planById } from "@/lib/plans";

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
  } = useApp();
  const navigate = useNavigate();
  const plan = planById(user?.plan ?? "basico");
  const dogWeights = weights.filter((w) => w.dogId === activeDog?.id);

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
          <Link
            to="/planes"
            className="mt-3 inline-block rounded-xl bg-card px-4 py-2 text-xs font-extrabold text-foreground"
          >
            Gestionar suscripción
          </Link>
        </section>

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
          <div className="flex items-center gap-3 p-4 text-sm">
            <Bell className="size-4 text-wood" /> Notificaciones de la receta del día
            <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold">
              Próximamente
            </span>
          </div>
          <div className="flex items-center gap-3 p-4 text-sm">
            <Award className="size-4 text-wood" /> Logros
            <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold">
              Próximamente
            </span>
          </div>
          <Link to="/admin" className="flex items-center gap-3 p-4 text-sm font-semibold">
            <Shield className="size-4 text-wood" /> Panel administrativo
          </Link>
        </section>

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
      </div>
    </AppShell>
  );
}
