import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/terminos")({
  head: () => ({
    meta: [
      { title: "Términos y condiciones · ARIMUNDO MASCOTAS" },
      {
        name: "description",
        content:
          "Condiciones de uso, suscripciones, cancelación y limitaciones del servicio ARIMUNDO MASCOTAS.",
      },
      { property: "og:title", content: "Términos y condiciones · ARIMUNDO MASCOTAS" },
      {
        property: "og:description",
        content: "Reglas de uso del servicio, planes de suscripción y limitación de responsabilidad.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TermsPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card p-4">
      <h2 className="font-display text-base font-bold">{title}</h2>
      <div className="mt-2 space-y-2 text-sm text-muted-foreground">{children}</div>
    </section>
  );
}

function TermsPage() {
  return (
    <AppShell title="Términos y condiciones" subtitle="Última actualización: 2026">
      <div className="space-y-3">
        <Section title="Aceptación">
          <p>Al crear una cuenta y usar ARIMUNDO MASCOTAS aceptas estos términos.</p>
        </Section>
        <Section title="Uso del servicio">
          <p>
            La aplicación entrega recetas caseras y planes de alimentación orientativos para perros,
            personalizados con la información que tú proporcionas. Eres responsable de la exactitud
            de esos datos.
          </p>
        </Section>
        <Section title="Sin asesoría veterinaria">
          <p>
            El contenido tiene fines informativos y no constituye diagnóstico ni tratamiento.
            Consulta siempre a tu veterinario antes de cambiar la dieta de tu perro, especialmente
            si tiene alergias o condiciones de salud.
          </p>
        </Section>
        <Section title="Prueba gratuita y suscripciones">
          <p>
            Los nuevos usuarios disponen de una prueba gratuita sin tarjeta de crédito. Después
            puedes elegir un plan de pago mensual. Los cobros se procesan mediante Stripe y se
            renuevan automáticamente hasta que canceles.
          </p>
        </Section>
        <Section title="Cancelación">
          <p>
            Puedes cancelar en cualquier momento desde tu perfil; mantendrás el acceso hasta el
            final del periodo pagado.
          </p>
        </Section>
        <Section title="Cuenta y conducta">
          <p>
            No debes usar la aplicación para fines ilícitos, ni intentar acceder a datos de otros
            usuarios. Podemos suspender cuentas que incumplan estos términos.
          </p>
        </Section>
        <Section title="Limitación de responsabilidad">
          <p>
            El servicio se ofrece “tal cual”. No respondemos por daños derivados del uso de las
            recetas sin supervisión veterinaria.
          </p>
        </Section>
        <Section title="Contacto">
          <p>soporte@arimundomascotas.com</p>
        </Section>
      </div>
    </AppShell>
  );
}
