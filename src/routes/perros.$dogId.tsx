import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGate } from "@/components/common/AuthGate";
import { DogForm } from "@/components/dogs/DogForm";
import { useApp } from "@/lib/app-store";

export const Route = createFileRoute("/perros/$dogId")({
  head: () => ({
    meta: [
      { title: "Editar perfil del perro | ARIMUNDO MASCOTAS" },
      {
        name: "description",
        content: "Actualiza los datos de tu perro para mantener sus recetas personalizadas.",
      },
      { property: "og:title", content: "Editar perfil del perro" },
      { property: "og:description", content: "Actualiza los datos de tu perro." },
    ],
  }),
  component: () => (
    <AuthGate>
      <EditDog />
    </AuthGate>
  ),
});

function EditDog() {
  const { dogId } = Route.useParams();
  const { dogs, updateDog, removeDog } = useApp();
  const navigate = useNavigate();
  const dog = dogs.find((d) => d.id === dogId);

  if (!dog) {
    return (
      <AppShell title="Perro">
        <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground shadow-soft">
          Este perfil ya no existe.
        </p>
      </AppShell>
    );
  }

  return (
    <AppShell title={dog.name} subtitle="Editar perfil">
      <div className="space-y-5">
        <DogForm
          initial={dog}
          submitLabel="Guardar cambios"
          onSubmit={(values) => {
            updateDog(dog.id, values);
            navigate({ to: "/perros" });
          }}
        />
        <button
          type="button"
          onClick={() => {
            removeDog(dog.id);
            navigate({ to: "/perros" });
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-muted py-3 text-sm font-bold text-destructive"
        >
          <Trash2 className="size-4" /> Eliminar perfil
        </button>
      </div>
    </AppShell>
  );
}
