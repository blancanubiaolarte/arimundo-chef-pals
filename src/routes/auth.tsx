import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { useApp } from "@/lib/app-store";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar | ARIMUNDO MASCOTAS" },
      {
        name: "description",
        content:
          "Crea tu cuenta en ARIMUNDO MASCOTAS y recibe recetas caseras personalizadas para tu perro cada día.",
      },
      { property: "og:title", content: "Entrar | ARIMUNDO MASCOTAS" },
      {
        property: "og:description",
        content: "Recetas caseras personalizadas para tu perro, cada día.",
      },
    ],
  }),
  component: AuthPage,
});

const inputCls =
  "w-full rounded-xl border border-input bg-card px-3 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40";

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signUp, signIn, signInWithGoogle, user, dogs, hydrated } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!hydrated || !user) return;
    navigate({ to: dogs.length === 0 ? "/onboarding/perro" : "/", replace: true });
  }, [hydrated, user, dogs.length, navigate]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-10">
      <div className="mb-8 flex flex-col items-center text-center">
        <Logo size={104} />
        <h1 className="mt-4 font-display text-2xl font-extrabold">ARIMUNDO MASCOTAS</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Recetas caseras personalizadas para tu perro, cada día.
        </p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
        {(
          [
            ["signup", "Crear cuenta"],
            ["signin", "Iniciar sesión"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setMode(value);
              setError(null);
              setInfo(null);
            }}
            className={`rounded-lg py-2 text-sm font-bold ${
              mode === value ? "bg-card shadow-soft" : "text-muted-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <p className="mb-3 rounded-xl bg-destructive/10 px-3 py-2 text-xs font-bold text-destructive">
          {error}
        </p>
      )}
      {info && (
        <p className="mb-3 rounded-xl bg-success/10 px-3 py-2 text-xs font-bold text-success">
          {info}
        </p>
      )}

      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setInfo(null);
          setLoading(true);
          const result =
            mode === "signup"
              ? await signUp(name || email.split("@")[0] || "Amigo", email, password)
              : await signIn(email, password);
          setLoading(false);
          if (result.error) setError(result.error);
          else if (result.needsEmailConfirmation)
            setInfo("Revisa tu correo y confirma tu cuenta para empezar la prueba de 3 días.");
        }}
      >
        {mode === "signup" && (
          <input
            className={inputCls}
            placeholder="Tu nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}
        <input
          className={inputCls}
          type="email"
          required
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className={inputCls}
          type="password"
          required
          minLength={6}
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-brand py-3.5 text-sm font-extrabold text-primary-foreground shadow-soft disabled:opacity-60"
        >
          {loading
            ? "Un momento..."
            : mode === "signup"
              ? "Empezar prueba de 3 días"
              : "Entrar"}
        </button>
      </form>

      <button
        type="button"
        onClick={async () => {
          setError(null);
          const result = await signInWithGoogle();
          if (result.error) setError(result.error);
        }}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-input bg-card py-3.5 text-sm font-bold"
      >
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M23.5 12.3c0-.9-.1-1.5-.2-2.2H12v4h6.6c-.1 1.1-.9 2.8-2.5 3.9l3.9 3c2.3-2.1 3.5-5.2 3.5-8.7z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5l-3.9 3A12 12 0 0 0 12 24z"
          />
          <path fill="#FBBC05" d="M5.3 14.4a7.2 7.2 0 0 1 0-4.6l-4-3a12 12 0 0 0 0 10.6z" />
          <path
            fill="#EA4335"
            d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.4-3.3C17 .9 14.3 0 12 0 7.4 0 3.4 2.6 1.3 6.8l4 3c1-2.9 3.6-5.1 6.7-5.1z"
          />
        </svg>
        Continuar con Google
      </button>


      <Link
        to="/auth/recuperar"
        className="mt-5 text-center text-xs font-bold text-wood underline"
      >
        ¿Olvidaste tu contraseña?
      </Link>

      <p className="mt-6 text-center text-[11px] text-muted-foreground">
        3 días de prueba gratuita. Sin tarjeta de crédito.
      </p>
    </div>
  );
}
