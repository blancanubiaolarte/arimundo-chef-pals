import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Disclaimer } from "@/components/common/Disclaimer";
import { APP_BUILD, APP_NAME, APP_SHORT_DESCRIPTION, APP_VERSION } from "@/lib/app-version";

export const Route = createFileRoute("/acerca")({
  head: () => ({
    meta: [
      { title: "Acerca de ARIMUNDO MASCOTAS" },
      {
        name: "description",
        content:
          "Qué es ARIMUNDO MASCOTAS, cómo funciona el Chef IA canino y cuál es la versión actual de la aplicación.",
      },
      { property: "og:title", content: "Acerca de ARIMUNDO MASCOTAS" },
      { property: "og:description", content: APP_SHORT_DESCRIPTION },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://arimundo-chef-pals.lovable.app/acerca" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <AppShell title="Acerca de" subtitle={`${APP_NAME} · v${APP_VERSION}`}>
      <div className="space-y-3">
        <section className="rounded-2xl border border-border/60 bg-card p-4">
          <h2 className="font-display text-base font-bold">Qué es ARIMUNDO MASCOTAS</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Un asistente de cocina canina que crea recetas caseras personalizadas según el perfil de
            tu perro: edad, peso, raza, actividad, alergias y objetivo nutricional. Incluye plan
            semanal, lista de compras, alacena y diario de bienestar.
          </p>
        </section>

        <section className="rounded-2xl border border-border/60 bg-card p-4">
          <h2 className="font-display text-base font-bold">Versión</h2>
          <dl className="mt-2 space-y-1 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <dt>Versión de la app</dt>
              <dd className="font-semibold text-foreground">{APP_VERSION}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Build</dt>
              <dd className="font-semibold text-foreground">{APP_BUILD}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-border/60 bg-card p-4">
          <h2 className="font-display text-base font-bold">Legal y ayuda</h2>
          <div className="mt-2 flex flex-wrap gap-2 text-sm font-semibold">
            <Link className="rounded-xl bg-muted px-3 py-2" to="/privacidad">
              Privacidad
            </Link>
            <Link className="rounded-xl bg-muted px-3 py-2" to="/terminos">
              Términos
            </Link>
            <Link className="rounded-xl bg-muted px-3 py-2" to="/soporte">
              Soporte
            </Link>
            <Link className="rounded-xl bg-muted px-3 py-2" to="/contacto">
              Contacto
            </Link>
          </div>
        </section>

        <Disclaimer />
      </div>
    </AppShell>
  );
}
