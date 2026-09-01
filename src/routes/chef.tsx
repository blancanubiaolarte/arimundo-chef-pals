import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Send, Sparkles, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGate } from "@/components/common/AuthGate";
import { Disclaimer } from "@/components/common/Disclaimer";
import { useApp } from "@/lib/app-store";
import { RECIPES } from "@/lib/mock-data";
import { getUsageSummary } from "@/lib/usage.functions";
import {
  LIMIT_REACHED_HELP,
  LIMIT_REACHED_MESSAGE,
  TRIAL_LIMIT_REACHED_HELP,
  TRIAL_LIMIT_REACHED_MESSAGE,
  usageLabel,
  type UsageSummary,
} from "@/lib/usage-limits";

/** Consumo de recetas de IA (fuente de verdad: backend). */
function AiUsageNotice({ refreshKey }: { refreshKey: number }) {
  const [usage, setUsage] = useState<UsageSummary | null>(null);

  useEffect(() => {
    let alive = true;
    void getUsageSummary()
      .then((u) => {
        if (alive) setUsage(u as UsageSummary);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
    // Se vuelve a pedir cada vez que cambia refreshKey (p.ej. tras enviar un mensaje),
    // para que el contador en pantalla no se quede desactualizado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  if (!usage) return null;

  if (usage.remaining > 0) {
    return (
      <p className="rounded-xl bg-muted px-3 py-2 text-center text-xs text-muted-foreground">
        ✨ {usageLabel(usage)}
      </p>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-soft">
      <p className="text-sm font-extrabold">
        {usage.isTrial ? TRIAL_LIMIT_REACHED_MESSAGE : LIMIT_REACHED_MESSAGE}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {usage.isTrial ? TRIAL_LIMIT_REACHED_HELP : LIMIT_REACHED_HELP}
      </p>
      <Link
        to="/planes"
        className="mt-3 inline-block rounded-full bg-brand px-5 py-2.5 text-xs font-extrabold text-primary-foreground"
      >
        Ver planes
      </Link>
    </div>
  );
}

export const Route = createFileRoute("/chef")({
  head: () => ({
    meta: [
      { title: "Chef IA | ARIMUNDO MASCOTAS" },
      {
        name: "description",
        content:
          "Cuéntale al Chef IA qué ingredientes tienes y te propone recetas seguras de la biblioteca de ARIMUNDO.",
      },
      { property: "og:title", content: "Chef IA | ARIMUNDO MASCOTAS" },
      { property: "og:description", content: "Recetas a partir de lo que tienes en casa." },
    ],
  }),
  component: () => (
    <AuthGate>
      <ChefPage />
    </AuthGate>
  ),
});

function PantryHint() {
  const { pantry } = useApp();
  if (pantry.length === 0) {
    return (
      <Link to="/alacena" className="block text-xs font-bold text-wood underline">
        🏠 Registra tu alacena y el Chef IA usará esos ingredientes
      </Link>
    );
  }
  return (
    <p className="rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
      🏠 Estoy considerando tu alacena: <strong>{pantry.slice(0, 5).join(", ")}</strong>
    </p>
  );
}

const SUGGESTIONS = [
  "Tengo pollo, avena y zanahoria",
  "Algo sin horno en 10 minutos",
  "Un premio con calabaza",
  "¿Qué puedo preparar hoy?",
];

function ChefPage() {
  const { chat, sendChatMessage, clearChat, activeDog } = useApp();
  const [input, setInput] = useState("");

  const send = (text: string) => {
    if (!text.trim()) return;
    sendChatMessage(text.trim());
    setInput("");
  };

  return (
    <AppShell
      title="Chef IA"
      subtitle={activeDog ? `Cocinando para ${activeDog.name}` : "Tu asistente de cocina"}
    >
      <div className="flex min-h-[60vh] flex-col gap-4">
        {chat.length === 0 ? (
          <div className="space-y-4 rounded-2xl bg-card p-5 text-center shadow-soft">
            <Sparkles className="mx-auto size-8 text-primary" />
            <p className="font-display text-base font-extrabold">¿Qué tienes en casa?</p>
            <p className="text-sm text-muted-foreground">
              El Chef IA busca primero en la biblioteca de recetas de ARIMUNDO y evita los
              ingredientes prohibidos y las alergias de tu perro.
            </p>
            <PantryHint />
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full bg-muted px-3 py-1.5 text-xs font-bold"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 space-y-3">
            {chat.map((msg) => (
              <div
                key={msg.id}
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-soft ${
                  msg.role === "user"
                    ? "ml-auto bg-brand text-primary-foreground"
                    : "bg-card text-card-foreground"
                }`}
              >
                <p>{msg.content}</p>
                {msg.recipeIds && msg.recipeIds.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {msg.recipeIds.map((id) => {
                      const recipe = RECIPES.find((r) => r.id === id);
                      if (!recipe) return null;
                      return (
                        <li key={id}>
                          <Link
                            to="/recetas/$slug"
                            params={{ slug: recipe.slug }}
                            className="block rounded-xl bg-muted px-3 py-2 text-xs font-bold text-foreground"
                          >
                            {recipe.title} · {recipe.minutes} min
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={clearChat}
              className="mx-auto flex items-center gap-1 text-xs font-bold text-muted-foreground"
            >
              <Trash2 className="size-3.5" /> Limpiar conversación
            </button>
          </div>
        )}

        <AiUsageNotice refreshKey={chat.length} />

        <Disclaimer />

        <form
          className="sticky bottom-24 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tengo pollo, avena y zanahoria..."
            className="flex-1 rounded-full border border-input bg-card px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40"
          />
          <button
            type="submit"
            aria-label="Enviar"
            className="rounded-full bg-brand p-3.5 text-primary-foreground shadow-soft"
          >
            <Send className="size-4" />
          </button>
        </form>
      </div>
    </AppShell>
  );
}
