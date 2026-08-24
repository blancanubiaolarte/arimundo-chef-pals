import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  CalendarDays,
  ShoppingBasket,
  Heart,
  TrendingUp,
  Sparkles,
  Clock,
  RefreshCw,
  ChefHat,
  Flame,
  Trophy,
  Scale,
  Check,
  ChevronDown,
  Utensils,
  ShieldCheck,
  PlusCircle,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGate } from "@/components/common/AuthGate";
import { Disclaimer } from "@/components/common/Disclaimer";
import { useApp } from "@/lib/app-store";
import type { Dog, Recipe } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Inicio | ARIMUNDO MASCOTAS" },
      {
        name: "description",
        content:
          "Tu asistente inteligente de cocina canina: receta del día, plan semanal, lista de compras y Chef IA.",
      },
      { property: "og:title", content: "Inicio | ARIMUNDO MASCOTAS" },
      {
        property: "og:description",
        content: "Receta del día personalizada para tu perro, plan semanal y Chef IA.",
      },
    ],
  }),
  component: () => (
    <AuthGate>
      <Dashboard />
    </AuthGate>
  ),
});

const SECTIONS = [
  { to: "/plan-semanal", label: "Plan semanal", icon: CalendarDays, hint: "7 días listos" },
  { to: "/compras", label: "Lista de compras", icon: ShoppingBasket, hint: "Ingredientes agrupados" },
  { to: "/recetas", label: "Favoritos", icon: Heart, hint: "Tus recetas guardadas" },
  { to: "/perfil", label: "Progreso", icon: TrendingUp, hint: "Peso y logros" },
] as const;

function levelFor(recipe: Recipe) {
  if (recipe.needsOven || recipe.minutes > 20) return "Intermedio";
  if (recipe.minutes > 10) return "Fácil";
  return "Muy fácil";
}

function nextMeal() {
  const h = new Date().getHours();
  if (h < 11) return "Desayuno · hoy 08:00";
  if (h < 17) return "Almuerzo · hoy 13:00";
  return "Cena · hoy 19:30";
}

function isCompatible(recipe: Recipe, dog: Dog | null) {
  if (!dog) return true;
  const blocked = [...dog.allergies, ...dog.forbiddenIngredients, ...dog.dislikedIngredients]
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const clash = recipe.ingredients.some((i) =>
    blocked.some((b) => i.name.toLowerCase().includes(b)),
  );
  if (clash) return false;
  return dog.hasOven || !recipe.needsOven;
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-muted ${className}`} />;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-72 w-full rounded-3xl" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

function DogSwitcher() {
  const { dogs, activeDog, setActiveDog } = useApp();
  const [open, setOpen] = useState(false);
  if (!activeDog) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full bg-card/80 px-3 py-1.5 text-xs font-extrabold shadow-soft transition-transform active:scale-95"
      >
        <span aria-hidden>🐶</span>
        {activeDog.name}
        <ChevronDown
          className={`size-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="animate-in fade-in slide-in-from-top-1 absolute right-0 z-30 mt-2 w-48 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card duration-200">
          {dogs.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => {
                setActiveDog(d.id);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between px-3 py-2.5 text-left text-xs font-bold transition-colors hover:bg-muted"
            >
              {d.name}
              {d.id === activeDog.id && <Check className="size-3.5 text-primary" />}
            </button>
          ))}
          <Link
            to="/perros"
            onClick={() => setOpen(false)}
            className="flex items-center gap-1.5 border-t border-border/60 px-3 py-2.5 text-xs font-bold text-wood"
          >
            <PlusCircle className="size-3.5" /> Añadir perro
          </Link>
        </div>
      )}
    </div>
  );
}

function DogHeroCard({ dog }: { dog: Dog }) {
  return (
    <section className="animate-in fade-in slide-in-from-bottom-2 rounded-3xl bg-wood-gradient p-4 text-wood-foreground shadow-card duration-500">
      <div className="flex items-center gap-3">
        {dog.photoUrl ? (
          <img
            src={dog.photoUrl}
            alt={dog.name}
            width={112}
            height={112}
            className="size-16 shrink-0 rounded-2xl border-2 border-white/30 object-cover"
          />
        ) : (
          <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border-2 border-white/25 bg-white/10 text-2xl">
            🐶
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-extrabold leading-tight">
                {dog.name}
              </p>
              <p className="truncate text-[11px] opacity-80">{dog.breed}</p>
            </div>
            <DogSwitcher />
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold">
              {dog.ageYears} {dog.ageYears === 1 ? "año" : "años"}
            </span>
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold">
              {dog.weight} {dog.weightUnit}
            </span>
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold">
              {dog.goal}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-2xl bg-black/15 px-3 py-2 text-[11px] font-bold">
        <Utensils className="size-3.5" /> Próxima comida · {nextMeal()}
      </div>
    </section>
  );
}

function Dashboard() {
  const {
    user,
    hydrated,
    dogs,
    activeDog,
    dailyRecipe,
    shuffleDailyRecipe,
    favorites,
    prepared,
    weights,
    streak,
    togglePrepared,
    sendChatMessage,
  } = useApp();
  const [chefInput, setChefInput] = useState("");
  const [shuffling, setShuffling] = useState(false);
  const navigate = useNavigate();

  const compatible = useMemo(
    () => (dailyRecipe ? isCompatible(dailyRecipe, activeDog) : false),
    [dailyRecipe, activeDog],
  );

  const isPrepared = dailyRecipe ? prepared.includes(dailyRecipe.id) : false;

  if (!hydrated) {
    return (
      <AppShell title="Hola" subtitle="Tu cocina canina de hoy">
        <DashboardSkeleton />
      </AppShell>
    );
  }

  return (
    <AppShell title={`Hola, ${user?.name ?? ""}`} subtitle="Tu cocina canina de hoy">
      <div className="space-y-5">
        {activeDog ? (
          <DogHeroCard dog={activeDog} />
        ) : (
          <section className="rounded-3xl border border-dashed border-border bg-card p-6 text-center shadow-soft">
            <div className="mx-auto mb-2 text-3xl">🐶</div>
            <p className="font-display text-base font-extrabold">Aún no conocemos a tu perro</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Crea su perfil y personalizamos cada receta para él.
            </p>
            <Link
              to="/onboarding/perro"
              className="mt-4 inline-block rounded-xl bg-brand px-5 py-3 text-sm font-extrabold text-primary-foreground shadow-soft transition-transform active:scale-95"
            >
              Crear perfil
            </Link>
          </section>
        )}

        <h1 className="font-display text-xl font-extrabold leading-snug">
          ¿Qué prepararemos hoy para {activeDog?.name ?? "tu perro"}?
        </h1>

        {dailyRecipe && (
          <section className="animate-in fade-in slide-in-from-bottom-3 overflow-hidden rounded-3xl bg-card shadow-card duration-500">
            <div className="relative">
              <img
                src={dailyRecipe.imageUrl}
                alt={dailyRecipe.title}
                width={768}
                height={576}
                className={`h-56 w-full object-cover transition-opacity duration-300 ${
                  shuffling ? "opacity-40" : "opacity-100"
                }`}
              />
              <span className="absolute left-3 top-3 rounded-full bg-brand px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-primary-foreground shadow-soft">
                Receta del día
              </span>
              {compatible && (
                <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-success px-3 py-1 text-[10px] font-extrabold text-success-foreground shadow-soft">
                  <ShieldCheck className="size-3" /> Compatible con {activeDog?.name ?? "tu perro"}
                </span>
              )}
            </div>
            <div className="space-y-3 p-5">
              <h2 className="font-display text-xl font-extrabold leading-tight">
                {dailyRecipe.title}
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                  <Clock className="size-3.5" /> {dailyRecipe.minutes} min
                </span>
                <span className="rounded-full bg-muted px-2.5 py-1">{levelFor(dailyRecipe)}</span>
                <span className="rounded-full bg-muted px-2.5 py-1">
                  {dailyRecipe.servings} porciones
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{dailyRecipe.benefit}</p>
              <div>
                <p className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground">
                  Ingredientes principales
                </p>
                <ul className="flex flex-wrap gap-1.5">
                  {dailyRecipe.ingredients.slice(0, 5).map((i) => (
                    <li
                      key={i.ingredientId}
                      className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-accent-foreground"
                    >
                      {i.name}
                    </li>
                  ))}
                  {dailyRecipe.ingredients.length > 5 && (
                    <li className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold">
                      +{dailyRecipe.ingredients.length - 5}
                    </li>
                  )}
                </ul>
              </div>
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    togglePrepared(dailyRecipe.id);
                    void navigate({
                      to: "/recetas/$slug",
                      params: { slug: dailyRecipe.slug },
                    });
                  }}
                  className="w-full rounded-2xl bg-brand py-4 text-center text-base font-extrabold text-primary-foreground shadow-card transition-transform active:scale-[0.97]"
                >
                  🍽️ {isPrepared ? "Preparar otra vez" : "Preparar ahora"}
                </button>
                <div className="flex gap-2">
                  <Link
                    to="/recetas/$slug"
                    params={{ slug: dailyRecipe.slug }}
                    className="flex-1 rounded-xl bg-muted py-3 text-center text-sm font-bold transition-transform active:scale-95"
                  >
                    Ver receta
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setShuffling(true);
                      shuffleDailyRecipe();
                      window.setTimeout(() => setShuffling(false), 300);
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-muted px-4 py-3 text-sm font-bold transition-transform active:scale-95"
                  >
                    <RefreshCw className={`size-4 ${shuffling ? "animate-spin" : ""}`} /> Cambiar
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        <Link
          to="/plan-semanal"
          className="animate-in fade-in slide-in-from-bottom-2 flex items-center gap-3 rounded-3xl bg-wood-gradient p-4 text-wood-foreground shadow-card transition-transform duration-500 active:scale-[0.98]"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-xl">
            ✨
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-base font-extrabold">
              Crear mi menú semanal
            </span>
            <span className="block text-[11px] opacity-90">
              7 días sin repetir, según el perfil de {activeDog?.name ?? "tu perro"}
            </span>
          </span>
          <CalendarDays className="size-5 shrink-0" />
        </Link>

        <section className="rounded-3xl bg-card p-4 shadow-card">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-brand text-primary-foreground">
              <ChefHat className="size-5" />
            </span>
            <div>
              <p className="font-display text-base font-extrabold">🤖 Chef IA</p>
              <p className="text-[11px] text-muted-foreground">
                ¿Qué ingredientes tienes hoy?
              </p>
            </div>
          </div>
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              const text = chefInput.trim();
              if (text) sendChatMessage(text);
              setChefInput("");
              void navigate({ to: "/chef" });
            }}
          >
            <input
              value={chefInput}
              onChange={(e) => setChefInput(e.target.value)}
              placeholder="Tengo pollo, avena y zanahoria..."
              className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-ring/40"
            />
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-wood-gradient py-3.5 text-sm font-extrabold text-wood-foreground shadow-soft transition-transform active:scale-[0.97]"
            >
              <Sparkles className="size-4" /> Buscar receta
            </button>
          </form>
        </section>

        <section>
          <h2 className="mb-2 font-display text-base font-extrabold">Tu progreso</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Flame, emoji: "🔥", label: "Racha", value: `${streak} días` },
              { icon: Trophy, emoji: "🏆", label: "Preparadas", value: `${prepared.length}` },
              { icon: Heart, emoji: "❤️", label: "Favoritas", value: `${favorites.length}` },
              { icon: Scale, emoji: "⚖", label: "Peso registrado", value: `${weights.length}` },
            ].map(({ icon: Icon, emoji, label, value }) => (
              <div
                key={label}
                className="rounded-2xl bg-card p-4 shadow-soft transition-transform active:scale-[0.98]"
              >
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span aria-hidden>{emoji}</span>
                  <Icon className="size-4 text-wood" />
                </div>
                <p className="mt-1.5 font-display text-xl font-extrabold">{value}</p>
                <p className="text-[11px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          {SECTIONS.map(({ to, label, icon: Icon, hint }) => (
            <Link
              key={label}
              to={to}
              className="rounded-2xl bg-card p-4 shadow-soft transition-transform active:scale-[0.98] hover:-translate-y-0.5"
            >
              <Icon className="size-5 text-wood" />
              <p className="mt-2 font-display text-sm font-extrabold">{label}</p>
              <p className="text-[11px] text-muted-foreground">{hint}</p>
            </Link>
          ))}
        </section>

        {dogs.length === 0 && (
          <p className="text-center text-[11px] text-muted-foreground">
            Añade a tu perro para personalizar aún más las recetas.
          </p>
        )}

        <Disclaimer />
      </div>
    </AppShell>
  );
}
