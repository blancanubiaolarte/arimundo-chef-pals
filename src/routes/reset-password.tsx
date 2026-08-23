import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nueva contraseña | ARIMUNDO MASCOTAS" },
      {
        name: "description",
        content: "Crea una nueva contraseña para tu cuenta de ARIMUNDO MASCOTAS.",
      },
      { property: "og:title", content: "Nueva contraseña | ARIMUNDO MASCOTAS" },
      { property: "og:description", content: "Crea una nueva contraseña para tu cuenta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6">
      <div className="mb-8 flex flex-col items-center text-center">
        <Logo size={84} />
        <h1 className="mt-4 font-display text-xl font-extrabold">Nueva contraseña</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Elige una contraseña segura para tu cuenta.
        </p>
      </div>

      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setLoading(true);
          const { error: updateError } = await supabase.auth.updateUser({ password });
          setLoading(false);
          if (updateError) setError(updateError.message);
          else navigate({ to: "/", replace: true });
        }}
      >
        <input
          type="password"
          required
          minLength={6}
          placeholder="Nueva contraseña"
          className="w-full rounded-xl border border-input bg-card px-3 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && (
          <p className="rounded-xl bg-destructive/10 px-3 py-2 text-xs font-bold text-destructive">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-brand py-3.5 text-sm font-extrabold text-primary-foreground shadow-soft disabled:opacity-60"
        >
          {loading ? "Guardando..." : "Guardar contraseña"}
        </button>
      </form>
    </div>
  );
}
