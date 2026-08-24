import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Clock,
  Heart,
  Share2,
  ShoppingCart,
  CheckCircle2,
  Users,
  Snowflake,
  Timer,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Check,
  BellRing,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGate } from "@/components/common/AuthGate";
import { Disclaimer } from "@/components/common/Disclaimer";
import { useApp } from "@/lib/app-store";
import { CATEGORY_LABEL, RECIPES } from "@/lib/mock-data";
import { benefitsFor } from "@/lib/benefits";
import type { Recipe } from "@/lib/types";

export const Route = createFileRoute("/recetas/$slug")({
  loader: ({ params }) => {
    const recipe = RECIPES.find((r) => r.slug === params.slug);
    if (!recipe) throw notFound();
    return { recipe };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Receta no encontrada | ARIMUNDO MASCOTAS" }, { name: "robots", content: "noindex" }],
      };
    }
    const { recipe } = loaderData;
    return {
      meta: [
        { title: `${recipe.title} | ARIMUNDO MASCOTAS` },
        { name: "description", content: recipe.benefit },
        { property: "og:title", content: `${recipe.title} | ARIMUNDO MASCOTAS` },
        { property: "og:description", content: recipe.benefit },
      ],
    };
  },
  notFoundComponent: RecipeNotFound,
  component: () => (
    <AuthGate>
      <RecipeDetail />
    </AuthGate>
  ),
});

function RecipeNotFound() {
  return (
    <AppShell title="Receta">
      <div className="rounded-2xl bg-card p-6 text-center shadow-soft">
        <p className="text-sm">No encontramos esta receta.</p>
        <Link to="/recetas" className="mt-3 inline-block text-sm font-bold text-wood underline">
          Volver a la biblioteca
        </Link>
      </div>
    </AppShell>
  );
}

function relatedTo(recipe: Recipe): Recipe[] {
  const ids = recipe.ingredients.map((i) => i.ingredientId);
  return RECIPES.filter((r) => r.published && r.id !== recipe.id)
    .map((r) => ({
      recipe: r,
      score:
        (r.category === recipe.category ? 2 : 0) +
        r.ingredients.filter((i) => ids.includes(i.ingredientId)).length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.recipe);
}

function formatTime(total: number) {
  const m = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const s = (total % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function RecipeSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-48 w-full animate-pulse rounded-2xl bg-muted" />
      <div className="h-4 w-2/3 animate-pulse rounded-full bg-muted" />
      <div className="h-24 w-full animate-pulse rounded-2xl bg-muted" />
      <div className="h-40 w-full animate-pulse rounded-2xl bg-muted" />
    </div>
  );
}

function CookTimer({ minutes }: { minutes: number }) {
  const [left, setLeft] = useState(minutes * 60);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    ref.current = window.setInterval(() => {
      setLeft((prev) => {
        if (prev <= 1) {
          setRunning(false);
          setDone(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (ref.current) window.clearInterval(ref.current);
    };
  }, [running]);

  const pct = Math.round(((minutes * 60 - left) / (minutes * 60)) * 100);

  return (
    <section className="rounded-2xl bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 font-display text-base font-extrabold">
          <Timer className="size-4 text-wood" /> Temporizador
        </p>
        <span className="font-display text-xl font-extrabold tabular-nums">{formatTime(left)}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-brand transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => {
            setDone(false);
            setRunning((r) => !r);
          }}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-extrabold text-primary-foreground shadow-soft transition-transform active:scale-95"
        >
          {running ? <Pause className="size-4" /> : <Play className="size-4" />}
          {running ? "Pausar" : left === minutes * 60 ? "⏱ Iniciar temporizador" : "Continuar"}
        </button>
        <button
          type="button"
          onClick={() => {
            setRunning(false);
            setDone(false);
            setLeft(minutes * 60);
          }}
          className="rounded-xl bg-muted px-4 py-3 text-sm font-bold transition-transform active:scale-95"
          aria-label="Reiniciar temporizador"
        >
          <RotateCcw className="size-4" />
        </button>
      </div>
      {done && (
        <div className="animate-in fade-in slide-in-from-bottom-2 mt-3 flex items-center gap-2 rounded-xl bg-success px-3 py-2.5 text-sm font-bold text-success-foreground duration-300">
          <BellRing className="size-4 animate-bounce" /> ¡Tiempo cumplido! La receta ya está lista.
        </div>
      )}
    </section>
  );
}

function RecipeDetail() {
  const { recipe } = Route.useLoaderData();
  const {
    hydrated,
    favorites,
    prepared,
    toggleFavorite,
    markPrepared,
    addIngredientsToShopping,
    shopping,
  } = useApp();
  const navigate = useNavigate();

  const [steps, setSteps] = useState<number[]>([]);
  const [checkedIngredients, setCheckedIngredients] = useState<string[]>([]);
  const [cartPulse, setCartPulse] = useState(false);
  const [favPulse, setFavPulse] = useState(false);
  const [ratingFor, setRatingFor] = useState<string | null>(null);
  const [rating, setRating] = useState(0);

  useEffect(() => {
    setSteps([]);
    setCheckedIngredients([]);
  }, [recipe.id]);

  const isFav = favorites.includes(recipe.id);
  const isPrepared = prepared.includes(recipe.id);
  const related = useMemo(() => relatedTo(recipe), [recipe]);
  const benefits = useMemo(() => benefitsFor(recipe), [recipe]);
  const total = recipe.steps.length;
  const doneCount = steps.length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;
  const allDone = total > 0 && doneCount === total;
  const inList = recipe.ingredients.filter((i) => shopping.some((s) => s.id === i.ingredientId));

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) await navigator.share({ title: recipe.title, url }).catch(() => {});
    else await navigator.clipboard?.writeText(url);
  };

  if (!hydrated) {
    return (
      <AppShell title={recipe.title} subtitle={CATEGORY_LABEL[recipe.category]}>
        <RecipeSkeleton />
      </AppShell>
    );
  }

  return (
    <AppShell title={recipe.title} subtitle={CATEGORY_LABEL[recipe.category]}>
      <div className="animate-in fade-in space-y-4 duration-300">
        <img
          src={recipe.imageUrl}
          alt={recipe.title}
          width={768}
          height={576}
          className="h-48 w-full rounded-2xl object-cover shadow-card"
        />

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="size-4" /> {recipe.minutes} min
          </span>
          <span className="flex items-center gap-1">
            <Users className="size-4" /> {recipe.servings} porciones
          </span>
          <span>{recipe.needsOven ? "Con horno" : "Sin horno"}</span>
        </div>

        <p className="text-sm">{recipe.benefit}</p>

        <div className="grid grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => {
              toggleFavorite(recipe.id);
              setFavPulse(true);
              window.setTimeout(() => setFavPulse(false), 600);
            }}
            className="flex flex-col items-center gap-1 rounded-xl bg-card p-3 text-[10px] font-bold shadow-soft transition-transform active:scale-95"
          >
            <Heart
              className={`size-5 transition-all duration-300 ${
                isFav ? "fill-primary text-primary" : "text-wood"
              } ${favPulse ? "scale-125" : "scale-100"}`}
            />
            Favorito
          </button>
          <button
            type="button"
            onClick={share}
            className="flex flex-col items-center gap-1 rounded-xl bg-card p-3 text-[10px] font-bold shadow-soft transition-transform active:scale-95"
          >
            <Share2 className="size-5 text-wood" />
            Compartir
          </button>
          <button
            type="button"
            onClick={() => {
              addIngredientsToShopping(recipe.id);
              setCartPulse(true);
              window.setTimeout(() => setCartPulse(false), 900);
            }}
            className="flex flex-col items-center gap-1 rounded-xl bg-card p-3 text-[10px] font-bold shadow-soft transition-transform active:scale-95"
          >
            <ShoppingCart
              className={`size-5 text-wood transition-transform duration-300 ${
                cartPulse ? "-translate-y-1 scale-125" : ""
              }`}
            />
            A compras
          </button>
          <button
            type="button"
            onClick={() => markPrepared(recipe.id)}
            className="flex flex-col items-center gap-1 rounded-xl bg-card p-3 text-[10px] font-bold shadow-soft transition-transform active:scale-95"
          >
            <CheckCircle2 className={`size-5 ${isPrepared ? "text-success" : "text-wood"}`} />
            Preparada
          </button>
        </div>

        {cartPulse && (
          <p className="animate-in fade-in slide-in-from-bottom-1 rounded-xl bg-success px-3 py-2 text-center text-xs font-bold text-success-foreground duration-200">
            🛒 Ingredientes agregados a tu lista de compras
          </p>
        )}

        {/* Ingredientes interactivos */}
        <section className="rounded-2xl bg-card p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-extrabold">Ingredientes</h2>
            <span className="text-[11px] font-bold text-muted-foreground">
              {checkedIngredients.length}/{recipe.ingredients.length}
            </span>
          </div>
          <ul className="mt-2 divide-y divide-border/60">
            {recipe.ingredients.map((i) => {
              const checked = checkedIngredients.includes(i.ingredientId);
              return (
                <li key={i.ingredientId}>
                  <button
                    type="button"
                    onClick={() =>
                      setCheckedIngredients((prev) =>
                        prev.includes(i.ingredientId)
                          ? prev.filter((x) => x !== i.ingredientId)
                          : [...prev, i.ingredientId],
                      )
                    }
                    className="flex w-full items-center gap-3 py-2.5 text-left transition-transform active:scale-[0.99]"
                  >
                    <span
                      className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                        checked
                          ? "scale-110 border-success bg-success text-success-foreground"
                          : "border-border"
                      }`}
                    >
                      {checked && <Check className="size-3.5" />}
                    </span>
                    <span
                      className={`flex-1 text-sm transition-colors ${
                        checked ? "text-muted-foreground line-through" : ""
                      }`}
                    >
                      {i.name}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground">
                      {i.quantity} {i.unit}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            onClick={() => {
              addIngredientsToShopping(recipe.id);
              setCartPulse(true);
              window.setTimeout(() => setCartPulse(false), 900);
            }}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-extrabold text-primary-foreground shadow-soft transition-transform active:scale-[0.97]"
          >
            🛒 Agregar todos a mi lista de compras
          </button>
          {inList.length > 0 && (
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              {inList.length} de estos ingredientes ya están en tu lista semanal: se actualiza la
              cantidad, no se duplican.
            </p>
          )}
        </section>

        {/* Preparación con progreso */}
        <section className="rounded-2xl bg-card p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-extrabold">Preparación</h2>
            <span className="text-xs font-extrabold text-wood">{pct}%</span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-brand transition-all duration-500 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            {doneCount} de {total} pasos completados.
          </p>

          <ol className="mt-3 space-y-2">
            {recipe.steps.map((s, i) => {
              const done = steps.includes(i);
              return (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() =>
                      setSteps((prev) =>
                        prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i],
                      )
                    }
                    className={`flex w-full items-start gap-3 rounded-xl p-2.5 text-left text-sm transition-all duration-300 active:scale-[0.99] ${
                      done ? "bg-success/10" : "bg-transparent"
                    }`}
                  >
                    <span
                      className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold transition-all duration-300 ${
                        done
                          ? "scale-110 bg-success text-success-foreground"
                          : "bg-brand text-primary-foreground"
                      }`}
                    >
                      {done ? <Check className="size-4" /> : i + 1}
                    </span>
                    <span className={done ? "text-muted-foreground line-through" : ""}>{s}</span>
                  </button>
                </li>
              );
            })}
          </ol>

          {allDone && (
            <div className="animate-in fade-in zoom-in-95 mt-4 rounded-2xl bg-wood-gradient p-5 text-center text-wood-foreground shadow-card duration-500">
              <div className="flex justify-center gap-2 text-3xl">
                <span className="animate-bounce">🎉</span>
                <span className="animate-bounce [animation-delay:120ms]">🐶</span>
                <span className="animate-bounce [animation-delay:240ms]">🎉</span>
              </div>
              <p className="mt-2 font-display text-lg font-extrabold">¡Excelente!</p>
              <p className="text-sm opacity-90">Has preparado esta receta para tu perro.</p>
              <button
                type="button"
                onClick={() => setRatingFor(markPrepared(recipe.id))}
                className="mt-4 w-full rounded-2xl bg-card py-4 text-base font-extrabold text-foreground shadow-soft transition-transform active:scale-[0.97]"
              >
                ✅ Marcar receta como preparada
              </button>
            </div>
          )}
        </section>

        {recipe.minutes > 0 && <CookTimer minutes={recipe.minutes} />}

        {/* Beneficios generales */}
        <section className="rounded-2xl bg-card p-4 shadow-soft">
          <h2 className="flex items-center gap-2 font-display text-base font-extrabold">
            <Sparkles className="size-4 text-wood" />
            ¿Por qué esta receta puede ser una buena opción?
          </h2>
          {benefits.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Aún no tenemos detalles de los ingredientes de esta receta.
            </p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {benefits.map((b) => (
                <li key={b.text} className="flex items-center gap-2 text-sm">
                  <span aria-hidden>{b.emoji}</span>
                  {b.text}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex gap-2 rounded-2xl bg-card p-4 text-sm shadow-soft">
          <Snowflake className="size-5 shrink-0 text-wood" />
          <div>
            <p className="font-display font-extrabold">Conservación</p>
            <p className="text-muted-foreground">{recipe.storage}</p>
          </div>
        </section>

        {/* Recetas relacionadas */}
        <section>
          <h2 className="mb-2 font-display text-base font-extrabold">
            También podría gustarle a tu perro
          </h2>
          {related.length === 0 ? (
            <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground shadow-soft">
              Todavía no hay recetas similares publicadas.
            </p>
          ) : (
            <div className="space-y-3">
              {related.map((r) => (
                <article
                  key={r.id}
                  className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-soft transition-transform hover:-translate-y-0.5"
                >
                  <img
                    src={r.imageUrl}
                    alt={r.title}
                    width={160}
                    height={160}
                    className="size-16 shrink-0 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-extrabold">{r.title}</p>
                    <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="size-3" /> {r.minutes} min
                    </p>
                  </div>
                  <Link
                    to="/recetas/$slug"
                    params={{ slug: r.slug }}
                    className="rounded-xl bg-muted px-3 py-2 text-xs font-bold transition-transform active:scale-95"
                  >
                    Ver receta
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>

        <Disclaimer />
      </div>
    </AppShell>
  );
}
