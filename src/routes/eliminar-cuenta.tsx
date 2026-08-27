import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/eliminar-cuenta")({
  head: () => ({
    meta: [
      { title: "Eliminar cuenta y datos · ARIMUNDO MASCOTAS" },
      {
        name: "description",
        content:
          "Solicita la eliminación de tu cuenta de ARIMUNDO MASCOTAS y de todos los datos asociados a tus perros.",
      },
      { property: "og:title", content: "Eliminar cuenta y datos · ARIMUNDO MASCOTAS" },
      {
        property: "og:description",
        content: "Pasos para borrar tu cuenta, tus perros, recetas e historial.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DeleteAccountPage,
});

function DeleteAccountPage() {
  return (
    <AppShell title="Eliminar cuenta" subtitle="Borrado de cuenta y datos">
      <div className="space-y-3">
        <section className="rounded-2xl border border-border/60 bg-card p-4">
          <h2 className="font-display text-base font-bold">Cómo solicitarlo</h2>
          <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>
              Escribe a <span className="font-semibold text-foreground">soporte@arimundomascotas.com</span>{" "}
              desde el correo con el que te registraste, con el asunto “Eliminar cuenta”.
            </li>
            <li>Confirmaremos la solicitud en un máximo de 48 horas.</li>
            <li>Los datos se eliminan de forma definitiva en un plazo de 30 días.</li>
          </ol>
        </section>

        <section className="rounded-2xl border border-border/60 bg-card p-4">
          <h2 className="font-display text-base font-bold">Datos que se eliminan</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Cuenta y credenciales de acceso</li>
            <li>Perfiles de tus perros y sus fotos</li>
            <li>Historial de peso, recetas preparadas y calificaciones</li>
            <li>Alacena, listas de compras y planes semanales</li>
            <li>Conversaciones y recetas generadas por el Chef IA</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-border/60 bg-card p-4">
          <h2 className="font-display text-base font-bold">Datos que se conservan</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Únicamente los registros de facturación exigidos por la ley fiscal, sin información del
            perfil de tus perros.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
