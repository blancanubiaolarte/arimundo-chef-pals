import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGate } from "@/components/common/AuthGate";
import { Disclaimer } from "@/components/common/Disclaimer";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { useApp } from "@/lib/app-store";
import { CATEGORY_LABEL, RECIPES } from "@/lib/mock-data";

export const Route = createFileRoute("/recetas/")({
  head: () => ({
    meta: [
      { title: "Recetas | ARIMUNDO MASCOTAS" },
      {
        name: "description",
        content:
          "Biblioteca de recetas caseras para perros: filtra por tiempo, categoría, sin horno o favoritas.",
      },
      { property: "og:title", content: "Recetas | ARIMUNDO MASCOTAS" },
      { property: "og:description", content: "Biblioteca de recetas caseras para perros." },
    ],
  }),
  component: () => (
    <AuthGate>
      <RecipesPage />
    </AuthGate>
  ),
});

const TIME_FILTERS = [5, 10, 20] as const;

function RecipesPage() {
  const { favorites } = useApp();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [maxTime, setMaxTime] = useState<number | null>(null);
  const [noOven, setNoOven] = useState(false);
  const [onlyFav, setOnlyFav] = useState(false);
  const [fewIngredients, setFewIngredients] = useState(false);

  const results = useMemo(
    () =>
      RECIPES.filter((r) => r.published)
        .filter((r) =>
          query
            ? r.title.toLowerCase().includes(query.toLowerCase()) ||
              r.ingredients.some((i) => i.name.toLowerCase().includes(query.toLowerCase()))
            : true,
        )
        .filter((r) => (category ? r.category === category : true))
        .filter((r) => (maxTime ? r.minutes <= maxTime : true))
        .filter((r) => (noOven ? !r.needsOven : true))
        .filter((r) => (onlyFav ? favorites.includes(r.id) : true))
        .filter((r) => (fewIngredients ? r.ingredients.length <= 3 : true)),
    [query, category, maxTime, noOven, onlyFav, fewIngredients, favorites],
  );

  const chip = (active: boolean) =>
    `whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold ${
      active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
    }`;

  return (
    <AppShell title="Recetas" subtitle={`${results.length} recetas disponibles`}>
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar receta o ingrediente"
            className="w-full rounded-xl border border-input bg-card py-3 pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40"
          />
        </div>

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <button type="button" className={chip(!category)} onClick={() => setCategory(null)}>
            Todas
          </button>
          {Object.entries(CATEGORY_LABEL).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={chip(category === key)}
              onClick={() => setCategory(category === key ? null : key)}
            >
              {label}
            </button>
          ))}
        </div>

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
          <button type="button" className={chip(onlyFav)} onClick={() => setOnlyFav(!onlyFav)}>
            Favoritas
          </button>
          <button
            type="button"
            className={chip(fewIngredients)}
            onClick={() => setFewIngredients(!fewIngredients)}
          >
            Pocos ingredientes
          </button>
        </div>

        {results.length === 0 ? (
          <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground shadow-soft">
            No encontramos recetas con esos filtros.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {results.map((r) => (
              <RecipeCard key={r.id} recipe={r} />
            ))}
          </div>
        )}

        <Disclaimer />
      </div>
    </AppShell>
  );
}
