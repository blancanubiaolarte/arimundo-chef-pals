import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { deleteMyAccount } from "@/lib/account.functions";
import { useApp } from "@/lib/app-store";
import { SUPPORT_EMAIL } from "@/lib/app-version";

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
    links: [{ rel: "canonical", href: "https://arimundo-chef-pals.lovable.app/eliminar-cuenta" }],
  }),
  component: DeleteAccountPage,
});

function DeleteAccountPage() {
  const { user, signOut } = useApp();
  const navigate = useNavigate();
  const runDelete = useServerFn(deleteMyAccount);
  const [confirmText, setConfirmText] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const canDelete = confirmText.trim().toUpperCase() === "ELIMINAR";

  async function handleDelete() {
    setStatus("loading");
    setError(null);
    try {
      await runDelete({ data: {} } as never);
      await signOut();
      navigate({ to: "/auth", replace: true });
    } catch (e) {
      setStatus("error");
      setError(
        e instanceof Error && e.message
          ? e.message
          : `No pudimos eliminar la cuenta. Revisa tu conexión o escríbenos a ${SUPPORT_EMAIL}.`,
      );
    }
  }

  return (
    <AppShell title="Eliminar cuenta" subtitle="Borrado de cuenta y datos">
      <div className="space-y-3">
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

        <section className="rounded-2xl border border-destructive/40 bg-card p-4">
          <h2 className="font-display text-base font-bold text-destructive">
            Eliminar definitivamente
          </h2>
          {user ? (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                Esta acción es irreversible. Escribe <strong>ELIMINAR</strong> para confirmar.
              </p>
              <label htmlFor="confirmar" className="sr-only">
                Escribe ELIMINAR para confirmar
              </label>
              <input
                id="confirmar"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="ELIMINAR"
                autoComplete="off"
                className="mt-3 w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-destructive"
              />
              <button
                type="button"
                disabled={!canDelete || status === "loading"}
                onClick={handleDelete}
                className="mt-3 w-full rounded-xl bg-destructive py-3 text-sm font-extrabold text-destructive-foreground disabled:opacity-50"
              >
                {status === "loading" ? "Eliminando…" : "Eliminar mi cuenta y mis datos"}
              </button>
              {error ? (
                <p role="alert" className="mt-2 text-sm text-destructive">
                  {error}
                </p>
              ) : null}
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Inicia sesión para eliminar tu cuenta, o escríbenos a{" "}
              <a className="font-semibold text-foreground underline" href={`mailto:${SUPPORT_EMAIL}`}>
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          )}
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
