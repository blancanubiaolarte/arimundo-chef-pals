import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGate } from "@/components/common/AuthGate";
import { useApp } from "@/lib/app-store";
import { CATEGORY_LABEL, hydrateCatalog } from "@/lib/mock-data";
import { adminDb, fetchCatalog, newId, uploadImage } from "@/lib/supabase-data";
import type {
  Ingredient,
  IngredientCategory,
  Recipe,
  RecipeCategory,
  SafetyLevel,
} from "@/lib/types";

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

const RECIPE_CATEGORIES: RecipeCategory[] = [
  "desayuno",
  "principal",
  "snack",
  "premio",
  "hidratacion",
];

const INGREDIENT_CATEGORIES: IngredientCategory[] = [
  "proteina",
  "vegetal",
  "cereal",
  "fruta",
  "grasa",
  "suplemento",
];

const emptyRecipe = (): Recipe => ({
  id: newId(),
  slug: "",
  title: "",
  imageUrl: "",
  category: "principal",
  minutes: 15,
  servings: 2,
  needsOven: false,
  benefit: "",
  storage: "",
  steps: [""],
  ingredients: [],
  published: false,
  views: 0,
});

const emptyIngredient = (): Ingredient => ({
  id: newId(),
  name: "",
  category: "proteina",
  safety: "seguro",
});

function AdminPage() {
  const { user, dogs, favorites, prepared } = useApp();
  const [tab, setTab] = useState<Tab>("recetas");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [recipeDraft, setRecipeDraft] = useState<Recipe | null>(null);
  const [ingredientDraft, setIngredientDraft] = useState<Ingredient | null>(null);

  const reload = useCallback(async () => {
    const catalog = await fetchCatalog();
    hydrateCatalog(catalog.recipes, catalog.ingredients);
    setRecipes(catalog.recipes);
    setIngredients(catalog.ingredients);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const notify = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(null), 3000);
  };

  const run = async (key: string, fn: () => Promise<{ error?: string }>, okText: string) => {
    setBusy(key);
    const res = await fn();
    setBusy(null);
    if (res.error) {
      notify(`No se pudo guardar: ${res.error}`);
      return false;
    }
    await reload();
    notify(okText);
    return true;
  };

  const togglePublished = (r: Recipe) =>
    void run(
      r.id,
      () => adminDb.setRecipePublished(r.id, !r.published),
      r.published ? "Receta despublicada" : "Receta publicada",
    );

  const removeRecipe = (r: Recipe) => {
    if (!window.confirm(`¿Eliminar "${r.title}"?`)) return;
    void run(r.id, () => adminDb.deleteRecipe(r.id), "Receta eliminada");
  };

  const removeIngredient = (i: Ingredient) => {
    if (!window.confirm(`¿Eliminar "${i.name}"?`)) return;
    void run(i.id, () => adminDb.deleteIngredient(i.id), "Ingrediente eliminado");
  };

  const saveRecipe = async (draft: Recipe) => {
    if (!draft.title.trim()) return notify("El título es obligatorio");
    const ok = await run(
      "recipe-form",
      () =>
        adminDb.saveRecipe({
          ...draft,
          slug: draft.slug || adminDb.slugify(draft.title),
          steps: draft.steps.map((s) => s.trim()).filter(Boolean),
        }),
      "Receta guardada",
    );
    if (ok) setRecipeDraft(null);
  };

  const saveIngredient = async (draft: Ingredient) => {
    if (!draft.name.trim()) return notify("El nombre es obligatorio");
    const ok = await run("ingredient-form", () => adminDb.saveIngredient(draft), "Ingrediente guardado");
    if (ok) setIngredientDraft(null);
  };

  const changeSafety = (i: Ingredient, safety: SafetyLevel) =>
    void run(i.id, () => adminDb.saveIngredient({ ...i, safety }), "Clasificación actualizada");

  return (
    <AppShell title="Administración" subtitle="Contenido y métricas">
      <div className="space-y-4">
        {message && (
          <p className="rounded-xl bg-primary/10 px-3 py-2 text-xs font-bold text-primary">
            {message}
          </p>
        )}

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

        {loading && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Cargando catálogo…
          </p>
        )}

        {tab === "recetas" && !loading && (
          <>
            <button
              type="button"
              onClick={() => setRecipeDraft(emptyRecipe())}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-extrabold text-primary-foreground shadow-soft"
            >
              <Plus className="size-4" /> Crear receta
            </button>
            <div className="space-y-2">
              {recipes.map((r) => (
                <article key={r.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-soft">
                  <img
                    src={r.imageUrl || "/images/recipes/pollo-arroz.jpg"}
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
                      disabled={busy === r.id}
                      onClick={() => togglePublished(r)}
                      className="rounded-lg bg-muted p-2 disabled:opacity-50"
                    >
                      {r.published ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                    </button>
                    <button
                      type="button"
                      aria-label="Editar"
                      onClick={() => setRecipeDraft({ ...r, steps: [...r.steps], ingredients: [...r.ingredients] })}
                      className="rounded-lg bg-muted p-2"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Eliminar"
                      disabled={busy === r.id}
                      onClick={() => removeRecipe(r)}
                      className="rounded-lg bg-muted p-2 text-destructive disabled:opacity-50"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        {tab === "ingredientes" && !loading && (
          <>
            <button
              type="button"
              onClick={() => setIngredientDraft(emptyIngredient())}
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
                    <th className="p-3" />
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
                          disabled={busy === i.id}
                          onChange={(e) => changeSafety(i, e.target.value as SafetyLevel)}
                          className="rounded-lg bg-muted px-2 py-1 text-xs font-bold"
                        >
                          <option value="seguro">Seguro</option>
                          <option value="moderacion">Moderación</option>
                          <option value="evitar">Evitar</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            aria-label={`Editar ${i.name}`}
                            onClick={() => setIngredientDraft({ ...i })}
                            className="rounded-lg bg-muted p-2"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Eliminar ${i.name}`}
                            disabled={busy === i.id}
                            onClick={() => removeIngredient(i)}
                            className="rounded-lg bg-muted p-2 text-destructive disabled:opacity-50"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
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

      {recipeDraft && (
        <RecipeEditor
          draft={recipeDraft}
          ingredients={ingredients}
          saving={busy === "recipe-form"}
          userId={user?.id ?? ""}
          onChange={setRecipeDraft}
          onClose={() => setRecipeDraft(null)}
          onSave={() => void saveRecipe(recipeDraft)}
        />
      )}

      {ingredientDraft && (
        <IngredientEditor
          draft={ingredientDraft}
          saving={busy === "ingredient-form"}
          onChange={setIngredientDraft}
          onClose={() => setIngredientDraft(null)}
          onSave={() => void saveIngredient(ingredientDraft)}
        />
      )}
    </AppShell>
  );
}

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

function Sheet({
  title,
  children,
  onClose,
  onSave,
  saving,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 sm:items-center sm:p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-card p-4 shadow-soft sm:rounded-3xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-extrabold">{title}</h2>
          <button type="button" aria-label="Cerrar" onClick={onClose} className="rounded-lg bg-muted p-2">
            <X className="size-4" />
          </button>
        </div>
        <div className="space-y-3">{children}</div>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-extrabold text-primary-foreground disabled:opacity-60"
        >
          {saving && <Loader2 className="size-4 animate-spin" />} Guardar
        </button>
      </div>
    </div>
  );
}

function RecipeEditor({
  draft,
  ingredients,
  saving,
  userId,
  onChange,
  onClose,
  onSave,
}: {
  draft: Recipe;
  ingredients: Ingredient[];
  saving: boolean;
  userId: string;
  onChange: (r: Recipe) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const set = <K extends keyof Recipe>(key: K, value: Recipe[K]) =>
    onChange({ ...draft, [key]: value });

  const handleImage = async (file: File) => {
    setUploading(true);
    const url = await uploadImage("recipe-images", userId || "admin", file);
    setUploading(false);
    if (url) set("imageUrl", url);
  };

  return (
    <Sheet title={draft.title ? "Editar receta" : "Nueva receta"} onClose={onClose} onSave={onSave} saving={saving}>
      <label className="block text-xs font-bold">
        Título
        <input className={inputClass} value={draft.title} onChange={(e) => set("title", e.target.value)} />
      </label>

      <div className="flex items-center gap-3">
        {draft.imageUrl && (
          <img src={draft.imageUrl} alt="" className="size-14 rounded-xl object-cover" />
        )}
        <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-muted py-2 text-xs font-bold">
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          Subir imagen
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImage(file);
            }}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block text-xs font-bold">
          Categoría
          <select
            className={inputClass}
            value={draft.category}
            onChange={(e) => set("category", e.target.value as RecipeCategory)}
          >
            {RECIPE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-bold">
          Minutos
          <input
            type="number"
            min={1}
            className={inputClass}
            value={draft.minutes}
            onChange={(e) => set("minutes", Number(e.target.value))}
          />
        </label>
        <label className="block text-xs font-bold">
          Porciones
          <input
            type="number"
            min={1}
            className={inputClass}
            value={draft.servings}
            onChange={(e) => set("servings", Number(e.target.value))}
          />
        </label>
        <label className="flex items-center gap-2 pt-6 text-xs font-bold">
          <input
            type="checkbox"
            checked={draft.needsOven}
            onChange={(e) => set("needsOven", e.target.checked)}
          />
          Necesita horno
        </label>
      </div>

      <label className="block text-xs font-bold">
        Beneficio general
        <input className={inputClass} value={draft.benefit} onChange={(e) => set("benefit", e.target.value)} />
      </label>
      <label className="block text-xs font-bold">
        Conservación
        <input className={inputClass} value={draft.storage} onChange={(e) => set("storage", e.target.value)} />
      </label>

      <div className="space-y-2">
        <p className="text-xs font-bold">Ingredientes</p>
        {draft.ingredients.map((ing, idx) => (
          <div key={`${ing.name}-${idx}`} className="flex gap-2">
            <select
              aria-label="Ingrediente"
              className={inputClass}
              value={ing.ingredientId}
              onChange={(e) => {
                const found = ingredients.find((x) => x.id === e.target.value);
                const next = [...draft.ingredients];
                next[idx] = { ...ing, ingredientId: e.target.value, name: found?.name ?? ing.name };
                set("ingredients", next);
              }}
            >
              <option value="">Selecciona…</option>
              {ingredients.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
            <input
              aria-label="Cantidad"
              type="number"
              min={0}
              className="w-20 rounded-xl border border-border bg-background px-2 py-2 text-sm"
              value={ing.quantity}
              onChange={(e) => {
                const next = [...draft.ingredients];
                next[idx] = { ...ing, quantity: Number(e.target.value) };
                set("ingredients", next);
              }}
            />
            <input
              aria-label="Unidad"
              className="w-16 rounded-xl border border-border bg-background px-2 py-2 text-sm"
              value={ing.unit}
              onChange={(e) => {
                const next = [...draft.ingredients];
                next[idx] = { ...ing, unit: e.target.value };
                set("ingredients", next);
              }}
            />
            <button
              type="button"
              aria-label="Quitar ingrediente"
              onClick={() => set("ingredients", draft.ingredients.filter((_, i) => i !== idx))}
              className="rounded-lg bg-muted p-2 text-destructive"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            set("ingredients", [
              ...draft.ingredients,
              { ingredientId: "", name: "", quantity: 1, unit: "g" },
            ])
          }
          className="w-full rounded-xl bg-muted py-2 text-xs font-bold"
        >
          + Añadir ingrediente
        </button>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold">Preparación</p>
        {draft.steps.map((step, idx) => (
          <div key={idx} className="flex gap-2">
            <textarea
              aria-label={`Paso ${idx + 1}`}
              rows={2}
              className={inputClass}
              value={step}
              onChange={(e) => {
                const next = [...draft.steps];
                next[idx] = e.target.value;
                set("steps", next);
              }}
            />
            <button
              type="button"
              aria-label="Quitar paso"
              onClick={() => set("steps", draft.steps.filter((_, i) => i !== idx))}
              className="rounded-lg bg-muted p-2 text-destructive"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => set("steps", [...draft.steps, ""])}
          className="w-full rounded-xl bg-muted py-2 text-xs font-bold"
        >
          + Añadir paso
        </button>
      </div>

      <label className="flex items-center gap-2 text-xs font-bold">
        <input
          type="checkbox"
          checked={draft.published}
          onChange={(e) => set("published", e.target.checked)}
        />
        Publicada
      </label>
    </Sheet>
  );
}

function IngredientEditor({
  draft,
  saving,
  onChange,
  onClose,
  onSave,
}: {
  draft: Ingredient;
  saving: boolean;
  onChange: (i: Ingredient) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <Sheet
      title={draft.name ? "Editar ingrediente" : "Nuevo ingrediente"}
      onClose={onClose}
      onSave={onSave}
      saving={saving}
    >
      <label className="block text-xs font-bold">
        Nombre
        <input
          className={inputClass}
          value={draft.name}
          onChange={(e) => onChange({ ...draft, name: e.target.value })}
        />
      </label>
      <label className="block text-xs font-bold">
        Categoría
        <select
          className={inputClass}
          value={draft.category}
          onChange={(e) => onChange({ ...draft, category: e.target.value as IngredientCategory })}
        >
          {INGREDIENT_CATEGORIES.map((c) => (
            <option key={c} value={c} className="capitalize">
              {c}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs font-bold">
        Clasificación
        <select
          className={inputClass}
          value={draft.safety}
          onChange={(e) => onChange({ ...draft, safety: e.target.value as SafetyLevel })}
        >
          <option value="seguro">Seguro</option>
          <option value="moderacion">Moderación</option>
          <option value="evitar">Evitar</option>
        </select>
      </label>
      <label className="block text-xs font-bold">
        Nota (opcional)
        <input
          className={inputClass}
          value={draft.note ?? ""}
          onChange={(e) => onChange({ ...draft, note: e.target.value })}
        />
      </label>
    </Sheet>
  );
}
