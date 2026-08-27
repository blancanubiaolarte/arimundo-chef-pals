import { createFileRoute, Link } from "@tanstack/react-router";
import { Wrench } from "lucide-react";
import { SUPPORT_EMAIL } from "@/lib/app-version";

export const Route = createFileRoute("/mantenimiento")({
  head: () => ({
    meta: [
      { title: "Mantenimiento · ARIMUNDO MASCOTAS" },
      {
        name: "description",
        content:
          "ARIMUNDO MASCOTAS está en mantenimiento programado. Volvemos en unos minutos con el Chef IA listo.",
      },
      { property: "og:title", content: "Mantenimiento · ARIMUNDO MASCOTAS" },
      { property: "og:description", content: "Estamos mejorando la app. Vuelve en unos minutos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "https://arimundo-chef-pals.lovable.app/mantenimiento" }],
  }),
  component: MaintenancePage,
});

function MaintenancePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <span className="grid size-16 place-items-center rounded-2xl bg-accent">
        <Wrench aria-hidden="true" className="size-8 text-accent-foreground" />
      </span>
      <h1 className="font-display text-2xl font-extrabold">Estamos en mantenimiento</h1>
      <p className="text-sm text-muted-foreground">
        Estamos mejorando ARIMUNDO MASCOTAS. Vuelve en unos minutos: tus perros, recetas y datos
        están a salvo.
      </p>
      <div className="flex flex-wrap justify-center gap-2 text-sm font-semibold">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-xl bg-brand px-4 py-2.5 text-primary-foreground"
        >
          Reintentar
        </button>
        <Link to="/" className="rounded-xl bg-muted px-4 py-2.5">
          Ir al inicio
        </Link>
      </div>
      <a className="text-xs text-muted-foreground underline" href={`mailto:${SUPPORT_EMAIL}`}>
        {SUPPORT_EMAIL}
      </a>
    </main>
  );
}
