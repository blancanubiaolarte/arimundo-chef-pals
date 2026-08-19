import { Link } from "@tanstack/react-router";
import { Clock, Heart, Flame } from "lucide-react";
import { CATEGORY_LABEL } from "@/lib/mock-data";
import { useApp } from "@/lib/app-store";
import type { Recipe } from "@/lib/types";

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  const { favorites, toggleFavorite } = useApp();
  const isFav = favorites.includes(recipe.id);

  return (
    <article className="relative overflow-hidden rounded-2xl bg-card shadow-soft">
      <Link to="/recetas/$slug" params={{ slug: recipe.slug }} className="block">
        <img
          src={recipe.imageUrl}
          alt={recipe.title}
          loading="lazy"
          width={768}
          height={576}
          className="h-32 w-full object-cover"
        />
        <div className="space-y-1 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            {CATEGORY_LABEL[recipe.category]}
          </p>
          <h3 className="font-display text-sm font-bold leading-tight">{recipe.title}</h3>
          <div className="flex items-center gap-3 pt-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" /> {recipe.minutes} min
            </span>
            {recipe.needsOven ? (
              <span className="flex items-center gap-1">
                <Flame className="size-3.5" /> Horno
              </span>
            ) : (
              <span>Sin horno</span>
            )}
          </div>
        </div>
      </Link>
      <button
        type="button"
        aria-label="Guardar en favoritos"
        onClick={() => toggleFavorite(recipe.id)}
        className="absolute right-2 top-2 rounded-full bg-card/90 p-2 shadow-soft"
      >
        <Heart className={`size-4 ${isFav ? "fill-primary text-primary" : "text-muted-foreground"}`} />
      </button>
    </article>
  );
}
