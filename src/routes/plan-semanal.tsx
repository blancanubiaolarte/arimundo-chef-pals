import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { RefreshCw, Sparkles, Clock, ChevronDown, ShoppingBasket } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGate } from "@/components/common/AuthGate";
import { Disclaimer } from "@/components/common/Disclaimer";
import { useApp } from "@/lib/app-store";
import { RECIPES } from "@/lib/mock-data";
import { rankedRecipes } from "@/lib/planner";

export const Route = createFileRoute("/plan-semanal")({
  head: () => ({
    meta: [
      { title: "Menú semanal | ARIMUNDO MASCOTAS" },
      {
        name: "description",
        content:
          "Menú de 7 días generado según la edad, el peso, la actividad y los ingredientes de tu perro.",
      },
      { property: "og:title", content: "Menú semanal | ARIMUNDO MASCOTAS" },
      {
        property: "og:description",
        content: "Un plan de alimentación semanal automático y personalizado para tu perro.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AuthGate>
      <WeeklyPlanPage />
    </AuthGate>
  ),
});

function WeeklyPlanPage() {
  const { hydrated, weeklyPlan, activeDog, generateWeeklyMenu, replacePlanDay } = useApp();
  const [openDay, setOpenDay] = useState<string | null>(null);
  const options = useMemo(() => rankedRecipes(activeDog), [activeDog]);

  if (!hydrated) {
    return (
      <AppShell title="Menú semanal">
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 w-full animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Menú semanal"
      subtitle={activeDog ? `Pensado para ${activeDog.name}` : "Tu semana organizada"}
    >
      <div className="animate-in fade-in space-y-4 duration-300">
        <button
          type="button"
          onClick={generateWeeklyMenu}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-wood-gradient py-4 text-sm font-extrabold text-wood-foreground shadow-card transition-transform active:scale-[0.97]"
        >
          {weeklyPlan.length ? (
            <>
              <RefreshCw className="size-4" /> 🔄 Regenerar semana
            </>
          ) : (
            <>
              <Sparkles className="size-4" /> ✨ Crear mi menú semanal
            </>
          )}
        </button>

        {weeklyPlan.length === 0 ? (
          <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground shadow-soft">
            Genera tu menú y crearemos 7 días sin recetas repetidas, según el perfil de tu perro.
          </p>
        ) : (
          <>
            <div className="space-y-3">
              {weeklyPlan.map((day, index) => {
                const recipe = RECIPES.find((r) => r.id === day.recipeId);
                if (!recipe) return null;
                const open = openDay === day.day;
                return (
                  <article
                    key={day.day}
                    className="animate-in fade-in slide-in-from-bottom-2 overflow-hidden rounded-2xl bg-card shadow-soft duration-300"
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    <div className="flex items-center gap-3 p-3">
                      <img
                        src={recipe.imageUrl}
                        alt={recipe.title}
                        width={160}
                        height={160}
                        className="size-16 shrink-0 rounded-xl object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-extrabold uppercase tracking-wide text-wood">
                          {day.day}
                        </p>
                        <p className="truncate font-display text-sm font-extrabold">
                          {recipe.title}
                        </p>
                        <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Clock className="size-3" /> {recipe.minutes} min ·{" "}
                          {recipe.needsOven ? "Con horno" : "Sin horno"}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Link
                          to="/recetas/$slug"
                          params={{ slug: recipe.slug }}
                          className="rounded-lg bg-muted px-2.5 py-1.5 text-[11px] font-bold"
                        >
                          Ver
                        </Link>
                        <button
                          type="button"
                          onClick={() => setOpenDay(open ? null : day.day)}
                          className="flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1.5 text-[11px] font-bold"
                        >
                          Cambiar
                          <ChevronDown
                            className={`size-3 transition-transform duration-200 ${
                              open ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                    {open && (
                      <ul className="animate-in fade-in slide-in-from-top-1 max-h-56 overflow-y-auto border-t border-border/60 duration-200">
                        {options.map((o) => (
                          <li key={o.id}>
                            <button
                              type="button"
                              onClick={() => {
                                replacePlanDay(day.day, o.id);
                                setOpenDay(null);
                              }}
                              className="flex w-full items-center justify-between px-4 py-2.5 text-left text-xs font-bold transition-colors hover:bg-muted"
                            >
                              {o.title}
                              <span className="text-muted-foreground">{o.minutes} min</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>
                );
              })}
            </div>

            <Link
              to="/compras"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-4 text-sm font-extrabold text-primary-foreground shadow-card transition-transform active:scale-[0.97]"
            >
              <ShoppingBasket className="size-4" /> Ver mi lista de compras
            </Link>
          </>
        )}

        <Disclaimer />
      </div>
    </AppShell>
  );
}
