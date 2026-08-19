import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarDays,
  ShoppingBasket,
  Heart,
  TrendingUp,
  Sparkles,
  Clock,
  RefreshCw,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGate } from "@/components/common/AuthGate";
import { Disclaimer } from "@/components/common/Disclaimer";
import { useApp } from "@/lib/app-store";

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
  { to: "/recetas", label: "Plan semanal", icon: CalendarDays, hint: "7 días listos" },
  { to: "/compras", label: "Lista de compras", icon: ShoppingBasket, hint: "Ingredientes agrupados" },
  { to: "/recetas", label: "Favoritos", icon: Heart, hint: "Tus recetas guardadas" },
  { to: "/perfil", label: "Progreso", icon: TrendingUp, hint: "Peso y logros" },
] as const;

function Dashboard() {
  const { user, activeDog, dailyRecipe, shuffleDailyRecipe } = useApp();

  return (
    <AppShell title={`Hola, ${user?.name ?? ""}`} subtitle="Tu cocina canina de hoy">
      <div className="space-y-5">
        <div>
          <h1 className="font-display text-xl font-extrabold leading-snug">
            ¿Qué prepararemos hoy para {activeDog?.name ?? "tu perro"}?
          </h1>
        </div>

        {dailyRecipe && (
          <section className="overflow-hidden rounded-3xl bg-card shadow-card">
            <div className="relative">
              <img
                src={dailyRecipe.imageUrl}
                alt={dailyRecipe.title}
                width={768}
                height={576}
                className="h-44 w-full object-cover"
              />
              <span className="absolute left-3 top-3 rounded-full bg-brand px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-primary-foreground">
                Receta del día
              </span>
            </div>
            <div className="space-y-3 p-4">
              <h2 className="font-display text-lg font-extrabold">{dailyRecipe.title}</h2>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="size-4" /> {dailyRecipe.minutes} min
                </span>
                <span>{dailyRecipe.ingredients.length} ingredientes</span>
                <span>{dailyRecipe.servings} porciones</span>
              </div>
              <p className="text-sm text-muted-foreground">{dailyRecipe.benefit}</p>
              <ul className="flex flex-wrap gap-1.5">
                {dailyRecipe.ingredients.map((i) => (
                  <li
                    key={i.ingredientId}
                    className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold"
                  >
                    {i.name}
                  </li>
                ))}
              </ul>
              <div className="flex gap-2 pt-1">
                <Link
                  to="/recetas/$slug"
                  params={{ slug: dailyRecipe.slug }}
                  className="flex-1 rounded-xl bg-brand py-3 text-center text-sm font-extrabold text-primary-foreground shadow-soft"
                >
                  Ver receta
                </Link>
                <button
                  type="button"
                  onClick={shuffleDailyRecipe}
                  className="flex items-center gap-1.5 rounded-xl bg-muted px-4 py-3 text-sm font-bold"
                >
                  <RefreshCw className="size-4" /> Cambiar
                </button>
              </div>
            </div>
          </section>
        )}

        <Link
          to="/chef"
          className="flex items-center gap-3 rounded-2xl bg-wood-gradient p-4 text-wood-foreground shadow-card"
        >
          <Sparkles className="size-6" />
          <div>
            <p className="font-display text-base font-extrabold">Chef IA</p>
            <p className="text-xs opacity-90">Dime qué tienes en casa y te propongo una receta.</p>
          </div>
        </Link>

        <section className="grid grid-cols-2 gap-3">
          {SECTIONS.map(({ to, label, icon: Icon, hint }) => (
            <Link
              key={label}
              to={to}
              className="rounded-2xl bg-card p-4 shadow-soft transition-transform active:scale-[0.98]"
            >
              <Icon className="size-5 text-wood" />
              <p className="mt-2 font-display text-sm font-extrabold">{label}</p>
              <p className="text-[11px] text-muted-foreground">{hint}</p>
            </Link>
          ))}
        </section>

        <Disclaimer />
      </div>
    </AppShell>
  );
}
