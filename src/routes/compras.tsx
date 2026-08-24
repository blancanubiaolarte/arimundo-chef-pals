import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { RefreshCw, Plus, Search, Check } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGate } from "@/components/common/AuthGate";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { useApp } from "@/lib/app-store";
import { INGREDIENTS, RECIPES } from "@/lib/mock-data";
import { isSafeFor } from "@/lib/planner";

export const Route = createFileRoute("/compras")({
  head: () => ({
    meta: [
      { title: "Compras y despensa | ARIMUNDO MASCOTAS" },
      {
        name: "description",
        content:
          "Lista de compras semanal automática, ingredientes agrupados y recetas compatibles con tu despensa.",
      },
      { property: "og:title", content: "Compras y despensa | ARIMUNDO MASCOTAS" },
      { property: "og:description", content: "Tu lista semanal generada automáticamente." },
    ],
  }),
  component: () => (
    <AuthGate>
      <ShoppingPage />
    </AuthGate>
  ),
});

const TIME_FILTERS = [5, 10, 20] as const;

function ShoppingPage() {
  const {
    shopping,
    generateWeeklyMenu,
    toggleShoppingOwned,
    toggleShoppingBought,
    pantry,
    togglePantry,
    favorites,
    activeDog,
  } = useApp();
  const [tab, setTab] = useState<"lista" | "despensa">("lista");
  const [search, setSearch] = useState(false);
  const [maxTime, setMaxTime] = useState<number | null>(null);
  const [noOven, setNoOven] = useState(false);
  const [onlyFav, setOnlyFav] = useState(false);
  const [few, setFew] = useState(false);

  const resolved = shopping.filter((i) => i.owned || i.bought);
  const pending = shopping.filter((i) => !i.owned && !i.bought);
  const progress = shopping.length
    ? Math.round((resolved.length / shopping.length) * 100)
    : 0;

  const compatible = useMemo(
    () =>
      RECIPES.filter((r) => r.published)
        .filter((r) => isSafeFor(r, activeDog))
        .filter((r) => r.ingredients.some((i) => pantry.includes(i.name)))
        .filter((r) => (maxTime ? r.minutes <= maxTime : true))
        .filter((r) => (noOven ? !r.needsOven : true))
        .filter((r) => (onlyFav ? favorites.includes(r.id) : true))
        .filter((r) => (few ? r.ingredients.length <= 3 : true)),
    [pantry, maxTime, noOven, onlyFav, few, favorites, activeDog],
  );

  const chip = (active: boolean) =>
    `whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold ${
      active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
    }`;

  return (
    <AppShell title="Compras" subtitle="Tu semana, ingrediente por ingrediente">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
          {(
            [
              ["lista", "Lista semanal"],
              ["despensa", "Despensa"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={`rounded-lg py-2 text-sm font-bold ${
                tab === value ? "bg-card shadow-soft" : "text-muted-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "lista" ? (
          <>
            <button
              type="button"
              onClick={generateWeeklyMenu}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-extrabold text-primary-foreground shadow-soft"
            >
              <RefreshCw className="size-4" /> ✨ Generar menú y lista de la semana
            </button>

            {shopping.length === 0 ? (
              <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground shadow-soft">
                Genera tu lista para ver los ingredientes agrupados y sumados.
              </p>
            ) : (
              <>
                <section className="rounded-2xl bg-card p-4 shadow-soft">
                  <div className="flex items-center justify-between">
                    <p className="font-display text-sm font-extrabold">Avance de la compra</p>
                    <span className="text-xs font-extrabold text-wood">{progress}%</span>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-brand transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    {resolved.length} de {shopping.length} ingredientes resueltos.
                  </p>
                </section>

                <section className="rounded-2xl bg-card p-4 shadow-soft">
                  <h2 className="font-display text-base font-extrabold">
                    Por comprar ({pending.length})
                  </h2>
                  {pending.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      🎉 ¡Lista completa! Ya tienes todo para la semana.
                    </p>
                  ) : (
                    <ul className="mt-2 divide-y divide-border/60">
                      {pending.map((item) => (
                        <li
                          key={item.id}
                          className="animate-in fade-in flex items-center gap-2 py-2.5 duration-200"
                        >
                          <span className="flex-1 text-sm">{item.name}</span>
                          <span className="text-xs font-bold text-muted-foreground">
                            {item.quantity} {item.unit}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleShoppingBought(item.id)}
                            className="rounded-full bg-muted px-2.5 py-1.5 text-[11px] font-bold transition-transform active:scale-95"
                          >
                            ✔ Ya lo compré
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleShoppingOwned(item.id)}
                            className="rounded-full bg-muted px-2.5 py-1.5 text-[11px] font-bold transition-transform active:scale-95"
                          >
                            ✔ Ya lo tengo
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {resolved.length > 0 && (
                  <section className="rounded-2xl bg-card p-4 shadow-soft">
                    <h2 className="font-display text-base font-extrabold">
                      Resueltos ({resolved.length})
                    </h2>
                    <ul className="mt-2 divide-y divide-border/60">
                      {resolved.map((item) => (
                        <li key={item.id} className="flex items-center gap-3 py-2.5">
                          <span className="flex size-5 items-center justify-center rounded-full bg-success text-success-foreground">
                            <Check className="size-3" />
                          </span>
                          <span className="flex-1 text-sm text-muted-foreground line-through">
                            {item.name}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              item.bought
                                ? toggleShoppingBought(item.id)
                                : toggleShoppingOwned(item.id)
                            }
                            className="text-[11px] font-bold text-wood underline"
                          >
                            Deshacer
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </>
            )}
          </>
        ) : (
          <>
            <Link
              to="/alacena"
              className="flex items-center justify-between gap-2 rounded-2xl bg-card p-4 shadow-soft transition-transform active:scale-[0.98]"
            >
              <span>
                <span className="block font-display text-sm font-extrabold">🏠 Mi Alacena</span>
                <span className="block text-xs text-muted-foreground">
                  Cantidades, vencimientos y recetas con lo que ya tienes.
                </span>
              </span>
              <span className="text-lg">→</span>
            </Link>

            <h2 className="font-display text-base font-extrabold">Mi despensa</h2>
            <p className="text-sm text-muted-foreground">
              Marca lo que tienes en casa y busca recetas que puedas preparar ahora mismo.
            </p>
            <div className="flex flex-wrap gap-2">
              {INGREDIENTS.filter((i) => i.safety !== "evitar").map((ing) => (
                <button
                  key={ing.id}
                  type="button"
                  onClick={() => togglePantry(ing.name)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                    pantry.includes(ing.name)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Plus className="mr-1 inline size-3" />
                  {ing.name}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setSearch(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-extrabold text-primary-foreground shadow-soft"
            >
              <Search className="size-4" /> Buscar recetas con mis ingredientes
            </button>

            {search && (
              <>
                <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
                  {TIME_FILTERS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={chip(maxTime === t)}
                      onClick={() => setMaxTime(maxTime === t ? null : t)}
                    >
                      {t} min
                    </button>
                  ))}
                  <button type="button" className={chip(noOven)} onClick={() => setNoOven(!noOven)}>
                    Sin horno
                  </button>
                  <button
                    type="button"
                    className={chip(onlyFav)}
                    onClick={() => setOnlyFav(!onlyFav)}
                  >
                    Favoritas
                  </button>
                  <button type="button" className={chip(few)} onClick={() => setFew(!few)}>
                    Pocos ingredientes
                  </button>
                </div>

                {compatible.length === 0 ? (
                  <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground shadow-soft">
                    Aún no hay recetas compatibles. Agrega más ingredientes a tu despensa.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {compatible.map((r) => (
                      <RecipeCard key={r.id} recipe={r} />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
