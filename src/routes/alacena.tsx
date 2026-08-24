import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Check,
  ChefHat,
  Home,
  Plus,
  Recycle,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGate } from "@/components/common/AuthGate";
import { Disclaimer } from "@/components/common/Disclaimer";
import { useApp } from "@/lib/app-store";
import {
  CATEGORY_META,
  CATEGORY_ORDER,
  LEVEL_META,
  PANTRY_UNITS,
  daysToExpiry,
  expiringSoon,
  expiryLabel,
  guessCategory,
  matchRecipe,
  matchesForPantry,
  pantryStats,
  suggestIngredients,
} from "@/lib/pantry";
import type { PantryItem } from "@/lib/types";

export const Route = createFileRoute("/alacena")({
  head: () => ({
    meta: [
      { title: "Mi Alacena | ARIMUNDO MASCOTAS" },
      {
        name: "description",
        content:
          "Registra los ingredientes que tienes en casa y descubre qué recetas puedes preparar hoy para tu perro sin desperdiciar nada.",
      },
      { property: "og:title", content: "🏠 Mi Alacena | ARIMUNDO MASCOTAS" },
      {
        property: "og:description",
        content: "Aprovecha lo que ya tienes: recetas compatibles, faltantes y ahorro.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AuthGate>
      <PantryPage />
    </AuthGate>
  ),
});

function PantryPage() {
  const {
    pantryItems,
    activeDog,
    preparedLog,
    addPantryItem,
    updatePantryItem,
    removePantryItem,
    addMissingToShopping,
    hydrated,
  } = useApp();

  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [addedToList, setAddedToList] = useState<string | null>(null);
  const [loadingMatches, setLoadingMatches] = useState(false);

  const available = useMemo(
    () => pantryItems.filter((i) => i.status !== "consumido"),
    [pantryItems],
  );
  const suggestions = useMemo(
    () => suggestIngredients(query, pantryItems.map((i) => i.name)),
    [query, pantryItems],
  );
  const grouped = useMemo(
    () =>
      CATEGORY_ORDER.map((cat) => ({
        cat,
        items: pantryItems.filter((i) => i.category === cat),
      })).filter((g) => g.items.length > 0),
    [pantryItems],
  );
  const expiring = useMemo(() => expiringSoon(pantryItems), [pantryItems]);
  const stats = useMemo(() => pantryStats(pantryItems, preparedLog), [pantryItems, preparedLog]);
  const matches = useMemo(
    () => matchesForPantry(available, activeDog).slice(0, 12),
    [available, activeDog],
  );
  const leftovers = useMemo(
    () => matchesForPantry(available, activeDog, { minPercent: 60 }).slice(0, 4),
    [available, activeDog],
  );
  const expiringMatches = useMemo(() => {
    if (expiring.length === 0) return [];
    return matchesForPantry(available, activeDog)
      .filter((m) =>
        m.have.some((ing) =>
          expiring.some((e) => e.name.toLowerCase().includes(ing.name.toLowerCase().slice(0, 4))),
        ),
      )
      .slice(0, 3);
  }, [expiring, available, activeDog]);

  useEffect(() => {
    if (!searching) return;
    setLoadingMatches(true);
    const t = setTimeout(() => setLoadingMatches(false), 550);
    return () => clearTimeout(t);
  }, [searching, available.length]);

  const add = (name: string) => {
    const clean = name.trim();
    if (!clean) return;
    addPantryItem({
      name: clean,
      category: guessCategory(clean),
      quantity: 1,
      unit: "pza",
      status: "disponible",
    });
    setQuery("");
    setJustAdded(clean);
    setTimeout(() => setJustAdded((v) => (v === clean ? null : v)), 1200);
  };

  if (!hydrated) return <PantrySkeleton />;

  return (
    <AppShell
      title="🏠 Mi Alacena"
      subtitle={activeDog ? `Cocinando con lo que hay para ${activeDog.name}` : "Tu cocina, organizada"}
    >
      <div className="space-y-5">
        <section className="animate-in fade-in slide-in-from-bottom-2 rounded-2xl bg-card p-5 shadow-soft duration-300">
          <div className="flex items-center gap-2">
            <Home className="size-5 text-primary" />
            <h1 className="font-display text-lg font-extrabold leading-tight">
              ¿Qué ingredientes tienes hoy en casa?
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Regístralos y te muestro qué puedes preparar sin salir a comprar.
          </p>

          <form
            className="relative mt-4"
            onSubmit={(e) => {
              e.preventDefault();
              add(query);
            }}
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pollo, zanahoria, avena, yogur..."
              className="w-full rounded-full border border-input bg-background py-3 pl-9 pr-24 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-brand px-4 py-2 text-xs font-extrabold text-primary-foreground transition-transform active:scale-95"
            >
              Agregar
            </button>
          </form>

          {query.trim().length > 0 && suggestions.length > 0 && (
            <ul className="animate-in fade-in mt-2 space-y-1 duration-200">
              {suggestions.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => add(s.name)}
                    className="flex w-full items-center gap-2 rounded-xl bg-muted px-3 py-2 text-left text-sm font-semibold transition-transform active:scale-[0.98]"
                  >
                    <span>{CATEGORY_META[s.category].emoji}</span>
                    <span className="flex-1">{s.name}</span>
                    <Plus className="size-4 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {justAdded && (
            <p className="animate-in zoom-in mt-3 rounded-xl bg-success/15 px-3 py-2 text-xs font-bold text-success duration-200">
              ✨ {justAdded} agregado a tu alacena
            </p>
          )}
        </section>

        {expiring.length > 0 && (
          <section className="animate-in fade-in rounded-2xl border border-wood/40 bg-wood/10 p-4 duration-300">
            <p className="flex items-center gap-2 font-display text-sm font-extrabold text-wood">
              <AlertTriangle className="size-4" /> Alerta de vencimiento
            </p>
            <ul className="mt-2 space-y-1 text-sm">
              {expiring.map((i) => (
                <li key={i.id}>
                  ⚠ Tu <strong>{i.name.toLowerCase()}</strong> {expiryLabel(daysToExpiry(i) ?? 0)}.
                </li>
              ))}
            </ul>
            {expiringMatches.length > 0 && (
              <>
                <p className="mt-3 text-xs font-bold text-muted-foreground">
                  Estas recetas te ayudan a utilizarlo:
                </p>
                <ul className="mt-1 space-y-1">
                  {expiringMatches.map((m) => (
                    <li key={m.recipe.id}>
                      <Link
                        to="/recetas/$slug"
                        params={{ slug: m.recipe.slug }}
                        className="block rounded-xl bg-card px-3 py-2 text-xs font-bold shadow-soft"
                      >
                        {m.recipe.title} · {m.percent}% compatible
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        )}

        {pantryItems.length === 0 ? (
          <section className="rounded-2xl bg-card p-8 text-center shadow-soft">
            <p className="text-4xl">🧺</p>
            <p className="mt-2 font-display text-base font-extrabold">Tu alacena está vacía</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Agrega tu primer ingrediente y empieza a aprovechar lo que ya tienes en casa.
            </p>
          </section>
        ) : (
          grouped.map(({ cat, items }) => (
            <section key={cat} className="space-y-2">
              <h2 className="font-display text-base font-extrabold">
                {CATEGORY_META[cat].emoji} {CATEGORY_META[cat].label}
              </h2>
              <div className="space-y-2">
                {items.map((item) => (
                  <PantryCard
                    key={item.id}
                    item={item}
                    open={draft === item.id}
                    onToggle={() => setDraft(draft === item.id ? null : item.id)}
                    onChange={(p) => updatePantryItem(item.id, p)}
                    onRemove={() => removePantryItem(item.id)}
                  />
                ))}
              </div>
            </section>
          ))
        )}

        <button
          type="button"
          onClick={() => setSearching(true)}
          disabled={available.length === 0}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-4 text-sm font-extrabold text-primary-foreground shadow-soft transition-transform active:scale-[0.98] disabled:opacity-50"
        >
          <ChefHat className="size-5" /> 🍽️ Buscar recetas con mi alacena
        </button>

        {searching && (
          <section className="space-y-3">
            <h2 className="font-display text-base font-extrabold">Recetas compatibles</h2>
            {loadingMatches ? (
              <MatchSkeleton />
            ) : matches.length === 0 ? (
              <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground shadow-soft">
                Todavía no hay recetas compatibles con estos ingredientes y el perfil de{" "}
                {activeDog?.name ?? "tu perro"}. Agrega algo más a tu alacena.
              </p>
            ) : (
              matches.map((m) => (
                <article
                  key={m.recipe.id}
                  className={`animate-in fade-in slide-in-from-bottom-1 overflow-hidden rounded-2xl bg-card shadow-soft duration-300 ${
                    m.level === "verde" ? "ring-2 ring-success/60" : ""
                  }`}
                >
                  <div className="flex gap-3 p-3">
                    <img
                      src={m.recipe.imageUrl}
                      alt={m.recipe.title}
                      loading="lazy"
                      width={160}
                      height={160}
                      className="size-20 shrink-0 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-sm font-extrabold leading-tight">
                        {m.recipe.title}
                      </h3>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {LEVEL_META[m.level].dot} {LEVEL_META[m.level].label}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-brand transition-all duration-700 ease-out"
                            style={{ width: `${m.percent}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-extrabold text-wood">
                          {m.percent}% compatible
                        </span>
                      </div>
                    </div>
                  </div>

                  {m.missing.length > 0 && (
                    <div className="border-t border-border/60 px-3 py-2.5">
                      <p className="text-[11px] font-bold text-muted-foreground">
                        Solo necesitas comprar:
                      </p>
                      <ul className="mt-1 flex flex-wrap gap-1.5">
                        {m.missing.map((ing) => (
                          <li
                            key={ing.ingredientId}
                            className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold"
                          >
                            {ing.name}
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        onClick={() => {
                          addMissingToShopping(m.recipe.id);
                          setAddedToList(m.recipe.id);
                          setTimeout(
                            () => setAddedToList((v) => (v === m.recipe.id ? null : v)),
                            1600,
                          );
                        }}
                        className="mt-2 w-full rounded-xl bg-muted py-2 text-xs font-extrabold transition-transform active:scale-[0.98]"
                      >
                        {addedToList === m.recipe.id
                          ? "✅ Agregados a tu lista"
                          : "🛒 Agregar faltantes a mi lista de compras"}
                      </button>
                    </div>
                  )}

                  <div className="flex gap-2 border-t border-border/60 p-3">
                    <Link
                      to="/recetas/$slug"
                      params={{ slug: m.recipe.slug }}
                      className="flex-1 rounded-xl bg-brand py-2.5 text-center text-xs font-extrabold text-primary-foreground"
                    >
                      Ver receta
                    </Link>
                    <Link
                      to="/compras"
                      className="rounded-xl bg-muted px-4 py-2.5 text-center text-xs font-extrabold"
                    >
                      Mi lista
                    </Link>
                  </div>
                </article>
              ))
            )}
          </section>
        )}

        {leftovers.length > 0 && (
          <section className="animate-in fade-in rounded-2xl bg-card p-4 shadow-soft duration-300">
            <p className="flex items-center gap-2 font-display text-base font-extrabold">
              <Recycle className="size-4 text-success" /> ♻️ Aprovecha lo que ya tienes
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Todavía tienes:{" "}
              {available
                .slice(0, 4)
                .map((i) => `${i.quantity} ${i.unit} de ${i.name.toLowerCase()}`)
                .join(" · ")}
            </p>
            <ul className="mt-3 space-y-2">
              {leftovers.map((m) => (
                <li key={m.recipe.id}>
                  <Link
                    to="/recetas/$slug"
                    params={{ slug: m.recipe.slug }}
                    className="flex items-center gap-3 rounded-xl bg-muted p-2 transition-transform active:scale-[0.98]"
                  >
                    <img
                      src={m.recipe.imageUrl}
                      alt={m.recipe.title}
                      loading="lazy"
                      width={96}
                      height={96}
                      className="size-12 rounded-lg object-cover"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">{m.recipe.title}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {m.recipe.minutes} min · {m.percent}% compatible
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="rounded-2xl bg-card p-4 shadow-soft">
          <p className="flex items-center gap-2 font-display text-base font-extrabold">
            <BarChart3 className="size-4 text-primary" /> 📊 Mi Alacena
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Stat label="Ingredientes registrados" value={stats.registered} />
            <Stat label="Disponibles ahora" value={stats.available} />
            <Stat label="Ya utilizados" value={stats.used} />
            <Stat label="Próximos a vencer" value={stats.expiring} />
            <Stat label="Recetas con tu alacena" value={stats.recipesWithPantry} />
            <Stat label="Aprovechamiento" value={`${stats.usagePercent}%`} />
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-success transition-all duration-700 ease-out"
              style={{ width: `${stats.usagePercent}%` }}
            />
          </div>
        </section>

        <Disclaimer />
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl bg-muted p-3">
      <p className="font-display text-lg font-extrabold leading-none">{value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function PantryCard({
  item,
  open,
  onToggle,
  onChange,
  onRemove,
}: {
  item: PantryItem;
  open: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<PantryItem>) => void;
  onRemove: () => void;
}) {
  const days = daysToExpiry(item);
  const consumed = item.status === "consumido";

  return (
    <article
      className={`animate-in fade-in slide-in-from-bottom-1 overflow-hidden rounded-2xl bg-card shadow-soft duration-300 ${
        consumed ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-center gap-3 p-3">
        <span className="text-2xl">{CATEGORY_META[item.category].emoji}</span>
        <button type="button" onClick={onToggle} className="min-w-0 flex-1 text-left">
          <p className={`font-display text-sm font-extrabold ${consumed ? "line-through" : ""}`}>
            {item.name}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {item.quantity} {item.unit} ·{" "}
            {item.status === "disponible"
              ? "Disponible"
              : item.status === "poco"
                ? "Queda poco"
                : "Consumido"}
            {days !== null ? ` · ${expiryLabel(days)}` : ""}
          </p>
        </button>
        <button
          type="button"
          aria-label="Marcar como consumido"
          onClick={() => onChange({ status: consumed ? "disponible" : "consumido" })}
          className="rounded-full bg-muted p-2 transition-transform active:scale-90"
        >
          <Check className={`size-4 ${consumed ? "text-success" : "text-muted-foreground"}`} />
        </button>
        <button
          type="button"
          aria-label="Eliminar ingrediente"
          onClick={onRemove}
          className="rounded-full bg-muted p-2 transition-transform active:scale-90"
        >
          <Trash2 className="size-4 text-muted-foreground" />
        </button>
      </div>

      {open && (
        <div className="animate-in slide-in-from-top-1 space-y-3 border-t border-border/60 p-3 duration-200">
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[11px] font-bold text-muted-foreground">
              Cantidad
              <input
                type="number"
                min={0}
                step="0.5"
                value={item.quantity}
                onChange={(e) => onChange({ quantity: Number(e.target.value) })}
                className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-semibold text-foreground outline-none focus:border-primary"
              />
            </label>
            <label className="text-[11px] font-bold text-muted-foreground">
              Unidad
              <select
                value={item.unit}
                onChange={(e) => onChange({ unit: e.target.value })}
                className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-semibold text-foreground outline-none focus:border-primary"
              >
                {PANTRY_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[11px] font-bold text-muted-foreground">
              Fecha de compra
              <input
                type="date"
                value={item.purchasedAt ?? ""}
                onChange={(e) => onChange({ purchasedAt: e.target.value })}
                className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              />
            </label>
            <label className="text-[11px] font-bold text-muted-foreground">
              Vencimiento
              <input
                type="date"
                value={item.expiresAt ?? ""}
                onChange={(e) => onChange({ expiresAt: e.target.value })}
                className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              />
            </label>
          </div>
          <label className="block text-[11px] font-bold text-muted-foreground">
            Notas
            <input
              value={item.notes ?? ""}
              onChange={(e) => onChange({ notes: e.target.value })}
              placeholder="Ej. congelado en porciones"
              className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
            />
          </label>
          <div className="flex gap-2">
            {(["disponible", "poco", "consumido"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onChange({ status: s })}
                className={`flex-1 rounded-full py-2 text-[11px] font-extrabold transition-transform active:scale-95 ${
                  item.status === s
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s === "disponible" ? "Disponible" : s === "poco" ? "Queda poco" : "Consumido"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onToggle}
            className="flex w-full items-center justify-center gap-1 text-xs font-bold text-muted-foreground"
          >
            <X className="size-3.5" /> Cerrar
          </button>
        </div>
      )}
    </article>
  );
}

function MatchSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex gap-3 rounded-2xl bg-card p-3 shadow-soft">
          <div className="size-20 animate-pulse rounded-xl bg-muted" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-3.5 w-3/4 animate-pulse rounded-full bg-muted" />
            <div className="h-3 w-1/2 animate-pulse rounded-full bg-muted" />
            <div className="h-2 w-full animate-pulse rounded-full bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function PantrySkeleton() {
  return (
    <AppShell title="🏠 Mi Alacena">
      <div className="space-y-4">
        <div className="h-40 animate-pulse rounded-2xl bg-card" />
        <div className="h-24 animate-pulse rounded-2xl bg-card" />
        <div className="h-24 animate-pulse rounded-2xl bg-card" />
      </div>
    </AppShell>
  );
}

export { matchRecipe };
