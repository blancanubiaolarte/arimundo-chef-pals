import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import { DogForm } from "@/components/dogs/DogForm";
import { useApp } from "@/lib/app-store";

export const Route = createFileRoute("/onboarding/perro")({
  head: () => ({
    meta: [
      { title: "Crear el perfil de tu perro | ARIMUNDO MASCOTAS" },
      {
        name: "description",
        content:
          "Cuéntanos sobre tu perro para personalizar sus recetas diarias: peso, raza, alergias y objetivos.",
      },
      { property: "og:title", content: "Crear el perfil de tu perro" },
      { property: "og:description", content: "Personaliza las recetas diarias de tu perro." },
    ],
  }),
  component: OnboardingDog,
});

function OnboardingDog() {
  const { addDog, dogs } = useApp();
  const navigate = useNavigate();

  return (
    <div className="mx-auto min-h-screen w-full max-w-md px-5 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Logo size={48} />
        <div>
          <h1 className="font-display text-lg font-extrabold">
            {dogs.length === 0 ? "¡Empecemos!" : "Nuevo perro"}
          </h1>
          <p className="text-xs text-muted-foreground">
            Con estos datos personalizamos cada receta.
          </p>
        </div>
      </div>

      <DogForm
        submitLabel="Guardar perfil"
        onSubmit={(values) => {
          addDog(values);
          navigate({ to: "/", replace: true });
        }}
      />
    </div>
  );
}
