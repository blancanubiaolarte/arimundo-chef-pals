import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Clock, Heart, Share2, ShoppingCart, CheckCircle2, Users, Snowflake } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGate } from "@/components/common/AuthGate";
import { Disclaimer } from "@/components/common/Disclaimer";
import { useApp } from "@/lib/app-store";
import { CATEGORY_LABEL, RECIPES } from "@/lib/mock-data";

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

function RecipeDetail() {
  const { recipe } = Route.useLoaderData();
  const { favorites, prepared, toggleFavorite, togglePrepared, addRecipeToShopping } = useApp();
  const isFav = favorites.includes(recipe.id);
  const isPrepared = prepared.includes(recipe.id);

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) await navigator.share({ title: recipe.title, url }).catch(() => {});
    else await navigator.clipboard?.writeText(url);
  };

  return (
    <AppShell title={recipe.title} subtitle={CATEGORY_LABEL[recipe.category]}>
      <div className="space-y-4">
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
            onClick={() => toggleFavorite(recipe.id)}
            className="flex flex-col items-center gap-1 rounded-xl bg-card p-3 text-[10px] font-bold shadow-soft"
          >
            <Heart className={`size-5 ${isFav ? "fill-primary text-primary" : "text-wood"}`} />
            Favorito
          </button>
          <button
            type="button"
            onClick={share}
            className="flex flex-col items-center gap-1 rounded-xl bg-card p-3 text-[10px] font-bold shadow-soft"
          >
            <Share2 className="size-5 text-wood" />
            Compartir
          </button>
          <button
            type="button"
            onClick={() => addRecipeToShopping(recipe.id)}
            className="flex flex-col items-center gap-1 rounded-xl bg-card p-3 text-[10px] font-bold shadow-soft"
          >
            <ShoppingCart className="size-5 text-wood" />
            A compras
          </button>
          <button
            type="button"
            onClick={() => togglePrepared(recipe.id)}
            className="flex flex-col items-center gap-1 rounded-xl bg-card p-3 text-[10px] font-bold shadow-soft"
          >
            <CheckCircle2 className={`size-5 ${isPrepared ? "text-success" : "text-wood"}`} />
            Preparada
          </button>
        </div>

        <section className="rounded-2xl bg-card p-4 shadow-soft">
          <h2 className="font-display text-base font-extrabold">Ingredientes</h2>
          <ul className="mt-2 divide-y divide-border/60">
            {recipe.ingredients.map((i) => (
              <li key={i.ingredientId} className="flex justify-between py-2 text-sm">
                <span>{i.name}</span>
                <span className="font-bold text-muted-foreground">
                  {i.quantity} {i.unit}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl bg-card p-4 shadow-soft">
          <h2 className="font-display text-base font-extrabold">Preparación</h2>
          <ol className="mt-2 space-y-3">
            {recipe.steps.map((s, i) => (
              <li key={s} className="flex gap-3 text-sm">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-extrabold text-primary-foreground">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
        </section>

        <section className="flex gap-2 rounded-2xl bg-card p-4 text-sm shadow-soft">
          <Snowflake className="size-5 shrink-0 text-wood" />
          <div>
            <p className="font-display font-extrabold">Conservación</p>
            <p className="text-muted-foreground">{recipe.storage}</p>
          </div>
        </section>

        <Disclaimer />
      </div>
    </AppShell>
  );
}
