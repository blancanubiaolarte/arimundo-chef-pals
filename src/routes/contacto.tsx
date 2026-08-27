import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { SUPPORT_EMAIL } from "@/lib/app-version";

export const Route = createFileRoute("/contacto")({
  head: () => ({
    meta: [
      { title: "Contacto · ARIMUNDO MASCOTAS" },
      {
        name: "description",
        content:
          "Contacta al equipo de ARIMUNDO MASCOTAS: dudas sobre recetas, suscripciones, privacidad o tu cuenta.",
      },
      { property: "og:title", content: "Contacto · ARIMUNDO MASCOTAS" },
      { property: "og:description", content: "Escríbenos y te respondemos en menos de 48 horas." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://arimundo-chef-pals.lovable.app/contacto" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    subject || "Consulta desde la app",
  )}&body=${encodeURIComponent(message)}`;

  return (
    <AppShell title="Contacto" subtitle="Hablemos">
      <div className="space-y-3">
        <section className="rounded-2xl border border-border/60 bg-card p-4">
          <h2 className="font-display text-base font-bold">Envíanos un mensaje</h2>
          <form
            className="mt-3 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              window.location.href = mailto;
            }}
          >
            <div>
              <label htmlFor="asunto" className="text-sm font-semibold">
                Asunto
              </label>
              <input
                id="asunto"
                name="asunto"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
                placeholder="¿En qué te ayudamos?"
              />
            </div>
            <div>
              <label htmlFor="mensaje" className="text-sm font-semibold">
                Mensaje
              </label>
              <textarea
                id="mensaje"
                name="mensaje"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={5}
                className="mt-1 w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
                placeholder="Cuéntanos con detalle"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-brand py-3 text-sm font-extrabold text-primary-foreground"
            >
              Abrir correo
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-border/60 bg-card p-4 text-sm text-muted-foreground">
          <h2 className="font-display text-base font-bold text-foreground">Datos de contacto</h2>
          <p className="mt-2">
            Correo:{" "}
            <a className="font-semibold text-foreground underline" href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </a>
          </p>
          <p>Tiempo de respuesta: hasta 48 horas hábiles.</p>
        </section>
      </div>
    </AppShell>
  );
}
