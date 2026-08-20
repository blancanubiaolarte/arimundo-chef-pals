import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, PawPrint, Crown } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGate } from "@/components/common/AuthGate";
import { useApp } from "@/lib/app-store";

export const Route = createFileRoute("/perros/")({
  head: () => ({
    meta: [
      { title: "Mis Perros | ARIMUNDO MASCOTAS" },
      {
        name: "description",
        content: "Administra los perfiles de tus perros: peso, alergias, objetivos y preferencias.",
      },
      { property: "og:title", content: "Mis Perros | ARIMUNDO MASCOTAS" },
      { property: "og:description", content: "Administra los perfiles de tus perros." },
    ],
  }),
  component: () => (
    <AuthGate>
      <DogsPage />
    </AuthGate>
  ),
});

function DogsPage() {
  const { dogs, activeDog, setActiveDog, canAddDog, maxDogs } = useApp();

  return (
    <AppShell title="Mis Perros" subtitle={`${dogs.length} de ${maxDogs} perfiles`}>
      <div className="space-y-3">
        {dogs.map((dog) => (
          <article
            key={dog.id}
            className={`flex items-center gap-3 rounded-2xl bg-card p-3 shadow-soft ${
              activeDog?.id === dog.id ? "ring-2 ring-primary" : ""
            }`}
          >
            <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent">
              {dog.photoUrl ? (
                <img src={dog.photoUrl} alt={dog.name} className="size-full object-cover" />
              ) : (
                <PawPrint className="size-6 text-accent-foreground" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-base font-extrabold">{dog.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {dog.breed || "Sin raza"} · {dog.ageYears} años · {dog.weight} {dog.weightUnit}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <Link
                to="/perros/$dogId"
                params={{ dogId: dog.id }}
                className="rounded-lg bg-muted px-3 py-1.5 text-xs font-bold"
              >
                Editar
              </Link>
              {activeDog?.id !== dog.id && (
                <button
                  type="button"
                  onClick={() => setActiveDog(dog.id)}
                  className="rounded-lg px-3 py-1.5 text-xs font-bold text-wood underline"
                >
                  Activar
                </button>
              )}
            </div>
          </article>
        ))}

        {canAddDog ? (
          <Link
            to="/onboarding/perro"
            className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border py-4 text-sm font-extrabold text-muted-foreground"
          >
            <Plus className="size-4" /> Agregar perro
          </Link>
        ) : (
          <div className="rounded-2xl bg-wood-gradient p-4 text-wood-foreground shadow-card">
            <p className="flex items-center gap-2 font-display text-base font-extrabold">
              <Crown className="size-4" /> Alcanzaste el límite de tu plan
            </p>
            <p className="mt-1 text-xs opacity-90">
              Actualiza tu suscripción para agregar más perros a tu manada.
            </p>
            <Link
              to="/planes"
              className="mt-3 inline-block rounded-xl bg-card px-4 py-2 text-xs font-extrabold text-foreground"
            >
              Ver planes
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
