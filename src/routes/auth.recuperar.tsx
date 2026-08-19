import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MailCheck } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

export const Route = createFileRoute("/auth/recuperar")({
  head: () => ({
    meta: [
      { title: "Recuperar contraseña | ARIMUNDO MASCOTAS" },
      {
        name: "description",
        content: "Recupera el acceso a tu cuenta de ARIMUNDO MASCOTAS por correo electrónico.",
      },
      { property: "og:title", content: "Recuperar contraseña | ARIMUNDO MASCOTAS" },
      { property: "og:description", content: "Recupera el acceso a tu cuenta." },
    ],
  }),
  component: RecoverPage,
});

function RecoverPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6">
      <div className="mb-8 flex flex-col items-center text-center">
        <Logo size={84} />
        <h1 className="mt-4 font-display text-xl font-extrabold">Recuperar contraseña</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Te enviaremos un enlace para crear una nueva contraseña.
        </p>
      </div>

      {sent ? (
        <div className="space-y-4 rounded-2xl bg-card p-6 text-center shadow-soft">
          <MailCheck className="mx-auto size-10 text-success" />
          <p className="text-sm">
            Si <strong>{email}</strong> está registrado, recibirás el enlace en unos minutos.
          </p>
        </div>
      ) : (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
        >
          <input
            type="email"
            required
            placeholder="Correo electrónico"
            className="w-full rounded-xl border border-input bg-card px-3 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-brand py-3.5 text-sm font-extrabold text-primary-foreground shadow-soft"
          >
            Enviar enlace
          </button>
        </form>
      )}

      <Link to="/auth" className="mt-6 text-center text-xs font-bold text-wood underline">
        Volver a iniciar sesión
      </Link>
    </div>
  );
}
