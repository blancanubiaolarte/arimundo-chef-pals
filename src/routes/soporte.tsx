import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { SUPPORT_EMAIL } from "@/lib/app-version";
import { Disclaimer } from "@/components/common/Disclaimer";

export const Route = createFileRoute("/soporte")({
  head: () => ({
    meta: [
      { title: "Soporte y ayuda · ARIMUNDO MASCOTAS" },
      {
        name: "description",
        content:
          "Centro de ayuda de ARIMUNDO MASCOTAS: preguntas frecuentes sobre recetas, suscripciones, cuenta y Chef IA.",
      },
      { property: "og:title", content: "Soporte y ayuda · ARIMUNDO MASCOTAS" },
      {
        property: "og:description",
        content: "Resuelve dudas sobre tu cuenta, tu suscripción y las recetas del Chef IA.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://arimundo-chef-pals.lovable.app/soporte" }],
  }),
  component: SupportPage,
});

const FAQ = [
  {
    q: "¿Cómo funciona la prueba gratuita?",
    a: "Todos los usuarios nuevos tienen 3 días con acceso completo, sin tarjeta de crédito. Al terminar puedes elegir un plan.",
  },
  {
    q: "¿Por qué no se genera mi receta?",
    a: "Puede ser que hayas alcanzado el límite de tu plan o que la conexión falle. Revisa tu consumo en Perfil e inténtalo de nuevo.",
  },
  {
    q: "¿Cómo cancelo mi suscripción?",
    a: "Desde Perfil > Plan puedes gestionar o cancelar. Mantendrás el acceso hasta el final del periodo pagado.",
  },
  {
    q: "¿Cómo elimino mi cuenta?",
    a: "En la página de eliminación de cuenta puedes borrar tu cuenta y todos tus datos de forma definitiva.",
  },
];

function SupportPage() {
  return (
    <AppShell title="Soporte" subtitle="Estamos para ayudarte">
      <div className="space-y-3">
        <section className="rounded-2xl border border-border/60 bg-card p-4">
          <h2 className="font-display text-base font-bold">Preguntas frecuentes</h2>
          <dl className="mt-2 space-y-3">
            {FAQ.map((item) => (
              <div key={item.q}>
                <dt className="text-sm font-semibold">{item.q}</dt>
                <dd className="text-sm text-muted-foreground">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-2xl border border-border/60 bg-card p-4">
          <h2 className="font-display text-base font-bold">¿Necesitas más ayuda?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Escríbenos a{" "}
            <a className="font-semibold text-foreground underline" href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </a>{" "}
            y respondemos en menos de 48 horas.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm font-semibold">
            <Link className="rounded-xl bg-muted px-3 py-2" to="/contacto">
              Contacto
            </Link>
            <Link className="rounded-xl bg-muted px-3 py-2" to="/privacidad">
              Privacidad
            </Link>
            <Link className="rounded-xl bg-muted px-3 py-2" to="/terminos">
              Términos
            </Link>
            <Link className="rounded-xl bg-muted px-3 py-2" to="/eliminar-cuenta">
              Eliminar cuenta
            </Link>
          </div>
        </section>

        <Disclaimer />
      </div>
    </AppShell>
  );
}
