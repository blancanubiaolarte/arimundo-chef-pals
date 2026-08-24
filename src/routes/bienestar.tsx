import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Award,
  Bell,
  CalendarDays,
  Flame,
  Heart,
  LineChart,
  Scale,
  Share2,
  Sparkles,
  Star,
  Timer,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGate } from "@/components/common/AuthGate";
import { useApp } from "@/lib/app-store";
import { RECIPES } from "@/lib/mock-data";
import type { ReminderKey } from "@/lib/types";

export const Route = createFileRoute("/bienestar")({
  head: () => ({
    meta: [
      { title: "Bienestar del perro | ARIMUNDO MASCOTAS" },
      {
        name: "description",
        content:
          "El diario de tu perro: historial de peso, recetas preparadas, calificaciones, logros y resumen mensual.",
      },
      { property: "og:title", content: "Bienestar del perro | ARIMUNDO MASCOTAS" },
      {
        property: "og:description",
        content: "Historial de peso, recetas preparadas, logros y resumen mensual de tu perro.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AuthGate>
      <WellnessPage />
    </AuthGate>
  ),
});

const TABS = [
  { id: "resumen", label: "Resumen", icon: Sparkles },
  { id: "peso", label: "Peso", icon: Scale },
  { id: "historial", label: "Historial", icon: CalendarDays },
  { id: "gustos", label: "Gustos", icon: Heart },
  { id: "logros", label: "Logros", icon: Award },
  { id: "recordatorios", label: "Avisos", icon: Bell },
] as const;

type TabId = (typeof TABS)[number]["id"];

const MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

const REMINDERS: { key: ReminderKey; emoji: string; title: string; hint: string }[] = [
  { key: "comida", emoji: "🍽", title: "Recordatorio de comida", hint: "Aviso a la hora de servir" },
  { key: "cocinar", emoji: "👨‍🍳", title: "Recordatorio de cocinar", hint: "Antes de la próxima comida" },
  { key: "pesar", emoji: "⚖️", title: "Pesar al perro", hint: "Cada semana" },
  { key: "compras", emoji: "🛒", title: "Recordatorio de compras", hint: "Al iniciar la semana" },
  { key: "recetaDelDia", emoji: "✨", title: "Receta del día", hint: "Cada mañana" },
];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es", { day: "2-digit", month: "short" });
}

function WellnessPage() {
  const {
    hydrated,
    activeDog,
    dogs,
    setActiveDog,
    weights,
    preparedLog,
    favorites,
    streak,
    achievements,
    weeklyPlan,
    addWeightRecord,
    ratePrepared,
    reminders,
    toggleReminder,
  } = useApp();

  const [tab, setTab] = useState<TabId>("resumen");

  const dogWeights = useMemo(
    () =>
      weights
        .filter((w) => !activeDog || w.dogId === activeDog.id)
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date)),
    [weights, activeDog],
  );

  const log = useMemo(
    () =>
      preparedLog
        .filter((p) => !activeDog || !p.dogId || p.dogId === activeDog.id)
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date)),
    [preparedLog, activeDog],
  );

  const lastPrepared = log[0] ? RECIPES.find((r) => r.id === log[0]!.recipeId) : undefined;
  const nextMeal = weeklyPlan[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
  const nextRecipe = nextMeal ? RECIPES.find((r) => r.id === nextMeal.recipeId) : undefined;
  const level = Math.floor(log.length / 5) + 1;
  const earned = achievements.filter((a) => a.earned);

  if (!hydrated) {
    return (
      <AppShell title="Bienestar">
        <div className="space-y-3">
          <div className="h-40 animate-pulse rounded-3xl bg-muted" />
          <div className="h-10 animate-pulse rounded-2xl bg-muted" />
          <div className="h-48 animate-pulse rounded-3xl bg-muted" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="🐶 Bienestar" subtitle="El diario de tu perro">
      <div className="space-y-4">
        {/* Tarjeta resumen del perro */}
        <section className="animate-in fade-in slide-in-from-bottom-2 overflow-hidden rounded-3xl bg-wood-gradient p-4 text-wood-foreground shadow-card duration-500">
          {!activeDog ? (
            <div className="text-center">
              <p className="font-display text-lg font-extrabold">Aún no tienes un perro</p>
              <Link
                to="/onboarding/perro"
                className="mt-3 inline-block rounded-xl bg-card px-4 py-2 text-xs font-extrabold text-foreground"
              >
                Crear perfil
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                {activeDog.photoUrl ? (
                  <img
                    src={activeDog.photoUrl}
                    alt={`Foto de ${activeDog.name}`}
                    className="size-16 rounded-2xl object-cover ring-2 ring-white/40"
                  />
                ) : (
                  <div className="flex size-16 items-center justify-center rounded-2xl bg-card/25 text-3xl">
                    🐶
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-xl font-extrabold">{activeDog.name}</p>
                  <p className="text-xs opacity-90">
                    {activeDog.ageYears} años · {activeDog.weight} {activeDog.weightUnit} ·{" "}
                    {activeDog.activityLevel}
                  </p>
                  <p className="truncate text-xs opacity-90">🎯 {activeDog.goal || "Sin objetivo"}</p>
                </div>
              </div>

              {dogs.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {dogs.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setActiveDog(d.id)}
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold transition-all ${
                        d.id === activeDog.id
                          ? "bg-card text-foreground"
                          : "bg-card/25 text-wood-foreground"
                      }`}
                    >
                      {d.name}
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-2xl bg-card/20 p-2.5">
                  <p className="flex items-center gap-1 font-extrabold">
                    <Flame className="size-3.5" /> Racha
                  </p>
                  <p className="opacity-90">{streak} día(s)</p>
                </div>
                <div className="rounded-2xl bg-card/20 p-2.5">
                  <p className="flex items-center gap-1 font-extrabold">
                    <Award className="size-3.5" /> Nivel {level}
                  </p>
                  <p className="opacity-90">{earned.length} insignias</p>
                </div>
                <div className="rounded-2xl bg-card/20 p-2.5">
                  <p className="font-extrabold">Última receta</p>
                  <p className="truncate opacity-90">{lastPrepared?.title ?? "Sin registro"}</p>
                </div>
                <div className="rounded-2xl bg-card/20 p-2.5">
                  <p className="font-extrabold">Próxima comida</p>
                  <p className="truncate opacity-90">{nextRecipe?.title ?? "Sin plan"}</p>
                </div>
              </div>
            </>
          )}
        </section>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-extrabold transition-all active:scale-95 ${
                tab === id
                  ? "bg-brand text-primary-foreground shadow-soft"
                  : "bg-card text-muted-foreground"
              }`}
            >
              <Icon className="size-3.5" /> {label}
            </button>
          ))}
        </div>

        <div key={tab} className="animate-in fade-in slide-in-from-bottom-1 space-y-4 duration-300">
          {tab === "resumen" && <MonthlyReport />}
          {tab === "peso" && (
            <WeightSection
              records={dogWeights}
              unit={activeDog?.weightUnit ?? "kg"}
              onAdd={(w, note) => activeDog && addWeightRecord(activeDog.id, w, note)}
              disabled={!activeDog}
            />
          )}
          {tab === "historial" && <HistorySection log={log} onRate={ratePrepared} />}
          {tab === "gustos" && <TastesSection log={log} favorites={favorites} />}
          {tab === "logros" && (
            <section className="grid grid-cols-2 gap-3">
              {achievements.map((a) => (
                <div
                  key={a.code}
                  className={`rounded-2xl p-3 text-center shadow-soft transition-transform active:scale-95 ${
                    a.earned ? "bg-card" : "bg-muted/60 opacity-70"
                  }`}
                >
                  <p className={`text-3xl ${a.earned ? "animate-in zoom-in" : "grayscale"}`}>
                    {a.emoji}
                  </p>
                  <p className="mt-1 font-display text-sm font-extrabold">{a.title}</p>
                  <p className="text-[11px] text-muted-foreground">{a.description}</p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-brand transition-all duration-700"
                      style={{ width: `${(a.progress / a.target) * 100}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[10px] font-bold text-muted-foreground">
                    {a.progress}/{a.target}
                  </p>
                </div>
              ))}
            </section>
          )}
          {tab === "recordatorios" && (
            <section className="space-y-3">
              <div className="rounded-2xl bg-card p-4 shadow-soft">
                <h2 className="flex items-center gap-2 font-display text-base font-extrabold">
                  <Bell className="size-4 text-wood" /> Recordatorios
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Elige los avisos que quieres recibir. Se activarán cuando habilitemos las
                  notificaciones en tu dispositivo.
                </p>
              </div>
              <div className="divide-y divide-border/60 overflow-hidden rounded-2xl bg-card shadow-soft">
                {REMINDERS.map((r) => {
                  const on = Boolean(reminders[r.key]);
                  return (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => toggleReminder(r.key)}
                      className="flex w-full items-center gap-3 p-4 text-left"
                    >
                      <span className="text-xl">{r.emoji}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold">{r.title}</span>
                        <span className="block text-[11px] text-muted-foreground">{r.hint}</span>
                      </span>
                      <span
                        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ${
                          on ? "bg-success" : "bg-muted"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 size-5 rounded-full bg-card shadow transition-all duration-300 ${
                            on ? "left-[22px]" : "left-0.5"
                          }`}
                        />
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="px-1 text-[11px] text-muted-foreground">
                Esta información es orientativa y no reemplaza el consejo de un veterinario.
              </p>
            </section>
          )}
        </div>
      </div>
    </AppShell>
  );
}

/* ---------------- Peso ---------------- */

function WeightSection({
  records,
  unit,
  onAdd,
  disabled,
}: {
  records: { id: string; date: string; weight: number; note?: string }[];
  unit: string;
  onAdd: (weight: number, note?: string) => void;
  disabled: boolean;
}) {
  const [flash, setFlash] = useState(false);
  const points = records.slice(-12);
  const values = points.map((p) => p.weight);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 1;
  const span = max - min || 1;
  const w = 300;
  const h = 120;
  const coords = points.map((p, i) => {
    const x = points.length === 1 ? w / 2 : (i / (points.length - 1)) * (w - 16) + 8;
    const y = h - 12 - ((p.weight - min) / span) * (h - 30);
    return { x, y, ...p };
  });
  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ");

  return (
    <section className="space-y-3">
      <div className="rounded-2xl bg-card p-4 shadow-soft">
        <h2 className="flex items-center gap-2 font-display text-base font-extrabold">
          <LineChart className="size-4 text-wood" /> Historial de peso
        </h2>
        {points.length === 0 ? (
          <p className="mt-3 rounded-xl bg-muted/60 p-4 text-center text-sm text-muted-foreground">
            📉 Aún no hay registros. Anota el primer peso para ver la evolución.
          </p>
        ) : (
          <div className="mt-3">
            <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="Evolución del peso">
              <defs>
                <linearGradient id="wfill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                </linearGradient>
              </defs>
              {coords.length > 1 && (
                <path
                  d={`${path} L${coords[coords.length - 1]!.x},${h} L${coords[0]!.x},${h} Z`}
                  className="text-wood"
                  fill="url(#wfill)"
                />
              )}
              <path
                d={path}
                fill="none"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="stroke-wood [stroke-dasharray:600] [stroke-dashoffset:0] animate-in fade-in duration-700"
              />
              {coords.map((c) => (
                <circle key={c.id} cx={c.x} cy={c.y} r={4} className="fill-brand" />
              ))}
            </svg>
            <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
              <span>{fmtDate(points[0]!.date)}</span>
              <span>
                {min} – {max} {unit}
              </span>
              <span>{fmtDate(points[points.length - 1]!.date)}</span>
            </div>
          </div>
        )}

        <form
          className="mt-4 space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const data = new FormData(form);
            const value = Number(data.get("weight"));
            const note = String(data.get("note") ?? "").trim();
            if (value > 0) {
              onAdd(value, note || undefined);
              setFlash(true);
              window.setTimeout(() => setFlash(false), 1200);
              form.reset();
            }
          }}
        >
          <div className="flex gap-2">
            <input
              name="weight"
              type="number"
              step="0.1"
              min="0"
              disabled={disabled}
              placeholder={`Peso (${unit})`}
              className="flex-1 rounded-xl border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={disabled}
              className="rounded-xl bg-brand px-4 py-2.5 text-sm font-extrabold text-primary-foreground transition-transform active:scale-95 disabled:opacity-50"
            >
              Registrar
            </button>
          </div>
          <input
            name="note"
            disabled={disabled}
            placeholder="Notas (opcional)"
            className="w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
        </form>
        {flash && (
          <p className="animate-in fade-in slide-in-from-bottom-1 mt-2 rounded-xl bg-success px-3 py-2 text-center text-xs font-bold text-success-foreground">
            ⚖️ Peso registrado
          </p>
        )}
        <p className="mt-3 text-[11px] text-muted-foreground">
          Solo registramos información. No realizamos diagnósticos ni recomendaciones médicas.
        </p>
      </div>

      {points.length > 0 && (
        <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl bg-card shadow-soft">
          {records
            .slice()
            .reverse()
            .map((r) => (
              <li key={r.id} className="flex items-center gap-3 p-3 text-sm">
                <Scale className="size-4 text-wood" />
                <span className="font-bold">
                  {r.weight} {unit}
                </span>
                <span className="text-xs text-muted-foreground">{fmtDate(r.date)}</span>
                {r.note ? (
                  <span className="ml-auto truncate text-[11px] text-muted-foreground">{r.note}</span>
                ) : null}
              </li>
            ))}
        </ul>
      )}
    </section>
  );
}

/* ---------------- Historial ---------------- */

function Stars({
  value,
  onChange,
}: {
  value: number;
  onChange?: (v: number) => void;
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          aria-label={`${n} estrellas`}
          className="transition-transform active:scale-125 disabled:cursor-default"
        >
          <Star
            className={`size-4 ${n <= value ? "fill-brand text-brand" : "text-muted-foreground"}`}
          />
        </button>
      ))}
    </div>
  );
}

function HistorySection({
  log,
  onRate,
}: {
  log: { id: string; recipeId: string; date: string; rating?: number; notes?: string }[];
  onRate: (entryId: string, rating: number, notes?: string) => void;
}) {
  const [month, setMonth] = useState("todos");
  const [category, setCategory] = useState("todas");
  const [onlyFav, setOnlyFav] = useState(false);
  const { favorites } = useApp();

  const months = Array.from(new Set(log.map((l) => l.date.slice(0, 7)))).sort().reverse();

  const filtered = log.filter((entry) => {
    const recipe = RECIPES.find((r) => r.id === entry.recipeId);
    if (!recipe) return false;
    if (month !== "todos" && !entry.date.startsWith(month)) return false;
    if (category !== "todas" && recipe.category !== category) return false;
    if (onlyFav && !favorites.includes(recipe.id)) return false;
    return true;
  });

  return (
    <section className="space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="shrink-0 rounded-full border border-input bg-card px-3 py-2 text-xs font-bold"
        >
          <option value="todos">Todos los meses</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {MONTHS[Number(m.slice(5, 7)) - 1]} {m.slice(0, 4)}
            </option>
          ))}
        </select>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="shrink-0 rounded-full border border-input bg-card px-3 py-2 text-xs font-bold"
        >
          <option value="todas">Todas las categorías</option>
          {["desayuno", "principal", "snack", "premio", "hidratacion"].map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setOnlyFav((v) => !v)}
          className={`shrink-0 rounded-full px-3 py-2 text-xs font-extrabold transition-colors ${
            onlyFav ? "bg-brand text-primary-foreground" : "bg-card text-muted-foreground"
          }`}
        >
          ❤️ Favoritas
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground shadow-soft">
          🍲 Todavía no hay recetas preparadas con estos filtros.
        </p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((entry) => {
            const recipe = RECIPES.find((r) => r.id === entry.recipeId)!;
            return (
              <li
                key={entry.id}
                className="animate-in fade-in overflow-hidden rounded-2xl bg-card shadow-soft"
              >
                <div className="flex gap-3 p-3">
                  <img
                    src={recipe.imageUrl}
                    alt={recipe.title}
                    loading="lazy"
                    className="size-16 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-extrabold">{recipe.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {fmtDate(entry.date)} · {recipe.minutes} min · {recipe.category}
                    </p>
                    <div className="mt-1">
                      <Stars
                        value={entry.rating ?? 0}
                        onChange={(v) => onRate(entry.id, v, entry.notes)}
                      />
                    </div>
                  </div>
                </div>
                <form
                  className="flex gap-2 border-t border-border/60 p-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const note = String(new FormData(form).get("note") ?? "").trim();
                    onRate(entry.id, entry.rating ?? 0, note);
                    form.reset();
                  }}
                >
                  <input
                    name="note"
                    defaultValue={entry.notes ?? ""}
                    placeholder="Notas del usuario"
                    className="min-w-0 flex-1 rounded-xl border border-input bg-card px-3 py-2 text-xs outline-none focus:border-primary"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-muted px-3 py-2 text-xs font-extrabold transition-transform active:scale-95"
                  >
                    Guardar
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/* ---------------- Gustos ---------------- */

function TastesSection({
  log,
  favorites,
}: {
  log: { recipeId: string; rating?: number }[];
  favorites: string[];
}) {
  const counts = new Map<string, number>();
  const categories = new Map<string, number>();
  const ingredients = new Map<string, number>();

  for (const entry of log) {
    const recipe = RECIPES.find((r) => r.id === entry.recipeId);
    if (!recipe) continue;
    const weight = 1 + (entry.rating ?? 0) / 5;
    counts.set(recipe.id, (counts.get(recipe.id) ?? 0) + weight);
    categories.set(recipe.category, (categories.get(recipe.category) ?? 0) + 1);
    for (const ing of recipe.ingredients) {
      ingredients.set(ing.name, (ingredients.get(ing.name) ?? 0) + 1);
    }
  }

  const topRecipes = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topCategories = [...categories.entries()].sort((a, b) => b[1] - a[1]);
  const topIngredients = [...ingredients.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxCat = topCategories[0]?.[1] ?? 1;

  if (log.length === 0) {
    return (
      <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground shadow-soft">
        ⭐ Prepara y califica recetas para descubrir los gustos de tu perro.
      </p>
    );
  }

  return (
    <section className="space-y-3">
      <div className="rounded-2xl bg-card p-4 shadow-soft">
        <h2 className="font-display text-base font-extrabold">Recetas favoritas</h2>
        <ul className="mt-2 space-y-2">
          {topRecipes.map(([id, score]) => {
            const recipe = RECIPES.find((r) => r.id === id)!;
            return (
              <li key={id} className="flex items-center gap-2 text-sm">
                <span className="min-w-0 flex-1 truncate">{recipe.title}</span>
                {favorites.includes(id) && <Heart className="size-3.5 fill-brand text-brand" />}
                <span className="text-xs font-bold text-muted-foreground">
                  {score.toFixed(1)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="rounded-2xl bg-card p-4 shadow-soft">
        <h2 className="font-display text-base font-extrabold">Categorías favoritas</h2>
        <ul className="mt-3 space-y-2">
          {topCategories.map(([cat, n]) => (
            <li key={cat} className="text-xs">
              <div className="flex justify-between font-bold capitalize">
                <span>{cat}</span>
                <span className="text-muted-foreground">{n}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-wood transition-all duration-700"
                  style={{ width: `${(n / maxCat) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl bg-card p-4 shadow-soft">
        <h2 className="font-display text-base font-extrabold">Ingredientes favoritos</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {topIngredients.map(([name, n]) => (
            <span
              key={name}
              className="rounded-full bg-muted px-3 py-1 text-xs font-bold"
              style={{ fontSize: `${11 + Math.min(n, 5)}px` }}
            >
              {name} · {n}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Resumen mensual ---------------- */

function MonthlyReport() {
  const { preparedLog, weights, streak, activeDog, favorites } = useApp();
  const [shared, setShared] = useState(false);
  const now = new Date();
  const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const entries = preparedLog.filter((p) => p.date.startsWith(key));
  const recipes = entries
    .map((e) => RECIPES.find((r) => r.id === e.recipeId))
    .filter(Boolean) as (typeof RECIPES)[number][];
  const minutes = recipes.reduce((sum, r) => sum + r.minutes, 0);
  const ingredientCount = new Set(recipes.flatMap((r) => r.ingredients.map((i) => i.name))).size;
  const saved = entries.length * 3.5;
  const weightsMonth = weights.filter((w) => w.date.startsWith(key));

  const byRecipe = new Map<string, number>();
  const byCategory = new Map<string, number>();
  for (const r of recipes) {
    byRecipe.set(r.title, (byRecipe.get(r.title) ?? 0) + 1);
    byCategory.set(r.category, (byCategory.get(r.category) ?? 0) + 1);
  }
  const topRecipe = [...byRecipe.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  const topCategory = [...byCategory.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  const summary = `Resumen de ${MONTHS[now.getMonth()]} de ${activeDog?.name ?? "mi perro"} en ARIMUNDO: ${entries.length} recetas preparadas, ${minutes} min cocinando, racha de ${streak} día(s). Receta favorita: ${topRecipe}.`;

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ text: summary });
      else await navigator.clipboard.writeText(summary);
    } catch {
      /* el usuario canceló */
    }
    setShared(true);
    window.setTimeout(() => setShared(false), 1600);
  };

  const cards = [
    { emoji: "🍲", label: "Recetas preparadas", value: `${entries.length}` },
    { emoji: "⏱", label: "Tiempo cocinando", value: `${minutes} min` },
    { emoji: "🥕", label: "Ingredientes usados", value: `${ingredientCount}` },
    { emoji: "💸", label: "Ahorro estimado", value: `$${saved.toFixed(2)}` },
    { emoji: "🔥", label: "Racha", value: `${streak} día(s)` },
    { emoji: "⚖️", label: "Pesos registrados", value: `${weightsMonth.length}` },
    { emoji: "⭐", label: "Receta favorita", value: topRecipe },
    { emoji: "📂", label: "Categoría favorita", value: topCategory },
  ];

  return (
    <section className="space-y-3">
      <div className="rounded-2xl bg-card p-4 shadow-soft">
        <h2 className="flex items-center gap-2 font-display text-base font-extrabold">
          <Timer className="size-4 text-wood" /> Resumen de {MONTHS[now.getMonth()]}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Un vistazo al mes de {activeDog?.name ?? "tu perro"} · {favorites.length} favoritas
          guardadas
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {cards.map((c, i) => (
            <div
              key={c.label}
              className="animate-in fade-in slide-in-from-bottom-1 rounded-2xl bg-muted/50 p-3"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <p className="text-xl">{c.emoji}</p>
              <p className="truncate font-display text-base font-extrabold">{c.value}</p>
              <p className="text-[11px] text-muted-foreground">{c.label}</p>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => void share()}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 text-sm font-extrabold text-primary-foreground transition-transform active:scale-[0.97]"
        >
          <Share2 className="size-4" /> Compartir resumen
        </button>
        {shared && (
          <p className="animate-in fade-in mt-2 rounded-xl bg-success px-3 py-2 text-center text-xs font-bold text-success-foreground">
            ✅ Resumen listo para compartir
          </p>
        )}
      </div>
      <p className="px-1 text-[11px] text-muted-foreground">
        Esta información es orientativa y no reemplaza el consejo de un veterinario.
      </p>
    </section>
  );
}
