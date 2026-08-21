import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Pencil, Trash2, Plus, Upload } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGate } from "@/components/common/AuthGate";
import { useApp } from "@/lib/app-store";
import { CATEGORY_LABEL, INGREDIENTS, RECIPES } from "@/lib/mock-data";
import type { Ingredient, Recipe } from "@/lib/types";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Panel administrativo | ARIMUNDO MASCOTAS" },
      {
        name: "description",
        content: "Gestiona recetas, ingredientes, categorías y métricas de ARIMUNDO MASCOTAS.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Panel administrativo | ARIMUNDO MASCOTAS" },
      { property: "og:description", content: "Gestión de contenido y métricas." },
    ],
  }),
  component: () => (
    <AuthGate>
      <AdminPage />
    </AuthGate>
  ),
});

type Tab = "recetas" | "ingredientes" | "usuarios" | "metricas";

const TABS: [Tab, string][] = [
  ["recetas", "Recetas"],
  ["ingredientes", "Ingredientes"],
  ["usuarios", "Usuarios"],
  ["metricas", "Métricas"],
];

function AdminPage() {
  const { user, dogs, favorites, prepared } = useApp();
  const [tab, setTab] = useState<Tab>("recetas");
  const [recipes, setRecipes] = useState<Recipe[]>(RECIPES);
  const [ingredients, setIngredients] = useState<Ingredient[]>(INGREDIENTS);

  const togglePublished = (id: string) =>
    setRecipes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, published: !r.published } : r)),
    );

  return (
    <AppShell title="Administración" subtitle="Contenido y métricas">
      <div className="space-y-4">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4">
          {TABS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold ${
                tab === value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "recetas" && (
          <>
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-extrabold text-primary-foreground shadow-soft"
            >
              <Plus className="size-4" /> Crear receta
            </button>
            <div className="space-y-2">
              {recipes.map((r) => (
                <article key={r.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-soft">
                  <img
                    src={r.imageUrl}
                    alt={r.title}
                    loading="lazy"
                    width={768}
                    height={576}
                    className="size-12 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-extrabold">{r.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {CATEGORY_LABEL[r.category]} · {r.views} vistas ·{" "}
                      {r.published ? "Publicada" : "Borrador"}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      aria-label="Publicar o despublicar"
                      onClick={() => togglePublished(r.id)}
                      className="rounded-lg bg-muted p-2"
                    >
                      {r.published ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                    </button>
                    <button type="button" aria-label="Editar" className="rounded-lg bg-muted p-2">
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Eliminar"
                      onClick={() => setRecipes((prev) => prev.filter((x) => x.id !== r.id))}
                      className="rounded-lg bg-muted p-2 text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-muted py-3 text-sm font-bold"
            >
              <Upload className="size-4" /> Subir imágenes
            </button>
          </>
        )}

        {tab === "ingredientes" && (
          <>
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-extrabold text-primary-foreground shadow-soft"
            >
              <Plus className="size-4" /> Crear ingrediente
            </button>
            <div className="overflow-hidden rounded-2xl bg-card shadow-soft">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted text-[11px] uppercase text-muted-foreground">
                  <tr>
                    <th className="p-3">Nombre</th>
                    <th className="p-3">Categoría</th>
                    <th className="p-3">Seguridad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {ingredients.map((i) => (
                    <tr key={i.id}>
                      <td className="p-3 font-semibold">{i.name}</td>
                      <td className="p-3 capitalize text-muted-foreground">{i.category}</td>
                      <td className="p-3">
                        <select
                          aria-label={`Clasificación de ${i.name}`}
                          value={i.safety}
                          onChange={(e) =>
                            setIngredients((prev) =>
                              prev.map((x) =>
                                x.id === i.id
                                  ? { ...x, safety: e.target.value as Ingredient["safety"] }
                                  : x,
                              ),
                            )
                          }
                          className="rounded-lg bg-muted px-2 py-1 text-xs font-bold"
                        >
                          <option value="seguro">Seguro</option>
                          <option value="moderacion">Moderación</option>
                          <option value="evitar">Evitar</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === "usuarios" && (
          <div className="space-y-3">
            <div className="overflow-hidden rounded-2xl bg-card shadow-soft">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted text-[11px] uppercase text-muted-foreground">
                  <tr>
                    <th className="p-3">Usuario</th>
                    <th className="p-3">Plan</th>
                    <th className="p-3">Perros</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-3 font-semibold">{user?.email}</td>
                    <td className="p-3 capitalize text-muted-foreground">{user?.plan}</td>
                    <td className="p-3">{dogs.length}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="overflow-hidden rounded-2xl bg-card shadow-soft">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted text-[11px] uppercase text-muted-foreground">
                  <tr>
                    <th className="p-3">Perro</th>
                    <th className="p-3">Raza</th>
                    <th className="p-3">Peso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {dogs.map((d) => (
                    <tr key={d.id}>
                      <td className="p-3 font-semibold">{d.name}</td>
                      <td className="p-3 text-muted-foreground">{d.breed || "—"}</td>
                      <td className="p-3">
                        {d.weight} {d.weightUnit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "metricas" && (
          <div className="space-y-3">
            <section className="rounded-2xl bg-card p-4 shadow-soft">
              <h2 className="font-display text-base font-extrabold">Recetas más vistas</h2>
              <ul className="mt-2 divide-y divide-border/60">
                {[...recipes]
                  .sort((a, b) => b.views - a.views)
                  .slice(0, 5)
                  .map((r) => (
                    <li key={r.id} className="flex justify-between py-2 text-sm">
                      <span>{r.title}</span>
                      <span className="font-bold text-muted-foreground">{r.views}</span>
                    </li>
                  ))}
              </ul>
            </section>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-card p-4 text-center shadow-soft">
                <p className="font-display text-2xl font-extrabold">{favorites.length}</p>
                <p className="text-[11px] text-muted-foreground">Favoritas guardadas</p>
              </div>
              <div className="rounded-2xl bg-card p-4 text-center shadow-soft">
                <p className="font-display text-2xl font-extrabold">{prepared.length}</p>
                <p className="text-[11px] text-muted-foreground">Recetas preparadas</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
