import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/privacidad")({
  head: () => ({
    meta: [
      { title: "Política de privacidad · ARIMUNDO MASCOTAS" },
      {
        name: "description",
        content:
          "Cómo ARIMUNDO MASCOTAS recopila, usa y protege los datos de tu cuenta y del perfil de tu perro.",
      },
      { property: "og:title", content: "Política de privacidad · ARIMUNDO MASCOTAS" },
      {
        property: "og:description",
        content: "Datos que tratamos, para qué los usamos y cómo ejercer tus derechos.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card p-4">
      <h2 className="font-display text-base font-bold">{title}</h2>
      <div className="mt-2 space-y-2 text-sm text-muted-foreground">{children}</div>
    </section>
  );
}

function PrivacyPage() {
  return (
    <AppShell title="Política de privacidad" subtitle="Última actualización: 2026">
      <div className="space-y-3">
        <Section title="Responsable">
          <p>
            ARIMUNDO MASCOTAS es responsable del tratamiento de los datos que introduces en la
            aplicación. Contacto: soporte@arimundomascotas.com
          </p>
        </Section>
        <Section title="Datos que recopilamos">
          <p>
            Datos de cuenta (correo electrónico y nombre), perfil de tus perros (nombre, edad, peso,
            raza, actividad, alergias, ingredientes prohibidos y objetivos), fotos que subas,
            historial de recetas preparadas, alacena, listas de compras y conversaciones con el Chef
            IA.
          </p>
        </Section>
        <Section title="Para qué los usamos">
          <p>
            Para autenticarte, personalizar recetas y planes semanales, mantener tu historial y
            gestionar tu suscripción. No vendemos tus datos ni los usamos para publicidad.
          </p>
        </Section>
        <Section title="Terceros">
          <p>
            Usamos proveedores de infraestructura y servicios: Supabase (base de datos,
            autenticación y almacenamiento), OpenAI (generación de recetas a partir del perfil de tu
            perro) y Stripe (pagos de suscripción). Cada proveedor trata los datos únicamente para
            prestar ese servicio.
          </p>
        </Section>
        <Section title="Conservación y seguridad">
          <p>
            Conservamos tus datos mientras mantengas la cuenta activa. La información está protegida
            con cifrado en tránsito y políticas de acceso por usuario.
          </p>
        </Section>
        <Section title="Tus derechos">
          <p>
            Puedes acceder, corregir, exportar o eliminar tus datos desde el Perfil, o solicitando
            la eliminación de la cuenta en la página “Eliminar cuenta”.
          </p>
        </Section>
        <Section title="Menores">
          <p>La aplicación está dirigida a personas mayores de 18 años.</p>
        </Section>
        <Section title="Aviso importante">
          <p>
            El contenido es orientativo y no reemplaza el consejo de un veterinario profesional.
          </p>
        </Section>
      </div>
    </AppShell>
  );
}
