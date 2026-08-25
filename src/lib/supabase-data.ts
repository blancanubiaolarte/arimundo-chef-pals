import { supabase } from "@/integrations/supabase/client";
import type {
  ChatMessage,
  Dog,
  Ingredient,
  PantryItem,
  PreparedLogEntry,
  Recipe,
  ReminderKey,
  ShoppingItem,
  WeeklyPlanDay,
  WeightRecord,
} from "./types";

/**
 * Capa de acceso a Lovable Cloud (Supabase).
 * Convierte filas snake_case de la base de datos en el modelo de dominio
 * camelCase que usan las pantallas, sin cambiar la experiencia de usuario.
 */

export function newId() {
  return crypto.randomUUID();
}

const isoDate = (v: string | null | undefined) => v ?? undefined;

/* ------------------------------ CATÁLOGO ------------------------------ */

export async function fetchCatalog(): Promise<{
  recipes: Recipe[];
  ingredients: Ingredient[];
}> {
  const [{ data: recipeRows }, { data: riRows }, { data: ingRows }, { data: safetyRows }] =
    await Promise.all([
      supabase.from("recipes").select("*").order("views", { ascending: false }),
      supabase.from("recipe_ingredients").select("*"),
      supabase.from("ingredients").select("*").order("name"),
      supabase.from("ingredient_safety").select("*"),
    ]);

  const ingredients: Ingredient[] = (ingRows ?? []).map((row) => {
    const safety = (safetyRows ?? []).find((s) => s.ingredient_id === row.id);
    return {
      id: row.id,
      name: row.name,
      category: row.category,
      safety: safety?.safety ?? "seguro",
      ...(safety?.note ? { note: safety.note } : {}),
    };
  });

  const recipes: Recipe[] = (recipeRows ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    imageUrl: row.image_url ?? "/images/recipes/pollo-arroz.jpg",
    category: row.category,
    minutes: row.minutes,
    servings: row.servings,
    needsOven: row.needs_oven,
    benefit: row.benefit,
    storage: row.storage,
    steps: row.steps,
    published: row.published,
    views: row.views,
    ingredients: (riRows ?? [])
      .filter((i) => i.recipe_id === row.id)
      .map((i) => ({
        ingredientId: i.ingredient_id ?? i.id,
        name: i.name,
        quantity: Number(i.quantity),
        unit: i.unit,
      })),
  }));

  return { recipes, ingredients };
}

/* -------------------------------- PERROS ------------------------------- */

type DogRow = {
  id: string;
  user_id: string;
  name: string;
  photo_url: string | null;
  sex: Dog["sex"];
  age_years: number;
  birth_date: string | null;
  weight: number;
  weight_unit: Dog["weightUnit"];
  breed: string;
  activity_level: Dog["activityLevel"];
  goal: string;
  favorite_ingredients: string[];
  disliked_ingredients: string[];
  forbidden_ingredients: string[];
  allergies: string[];
  cooking_time: string;
  has_oven: boolean;
  weekly_budget: number;
  created_at: string;
};

function toDog(row: DogRow): Dog {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    ...(row.photo_url ? { photoUrl: row.photo_url } : {}),
    sex: row.sex,
    ageYears: Number(row.age_years),
    ...(row.birth_date ? { birthDate: row.birth_date } : {}),
    weight: Number(row.weight),
    weightUnit: row.weight_unit,
    breed: row.breed,
    activityLevel: row.activity_level,
    goal: row.goal,
    favoriteIngredients: row.favorite_ingredients,
    dislikedIngredients: row.disliked_ingredients,
    forbiddenIngredients: row.forbidden_ingredients,
    allergies: row.allergies,
    cookingTime: row.cooking_time as Dog["cookingTime"],
    hasOven: row.has_oven,
    weeklyBudget: Number(row.weekly_budget),
    createdAt: row.created_at,
  };
}

export function dogToRow(dog: Partial<Dog>, userId?: string) {
  const row: Record<string, unknown> = {};
  if (userId) row['user_id'] = userId;
  if (dog.id) row['id'] = dog.id;
  if (dog.name !== undefined) row['name'] = dog.name;
  if (dog.photoUrl !== undefined) row['photo_url'] = dog.photoUrl;
  if (dog.sex !== undefined) row['sex'] = dog.sex;
  if (dog.ageYears !== undefined) row['age_years'] = dog.ageYears;
  if (dog.birthDate !== undefined) row['birth_date'] = dog.birthDate || null;
  if (dog.weight !== undefined) row['weight'] = dog.weight;
  if (dog.weightUnit !== undefined) row['weight_unit'] = dog.weightUnit;
  if (dog.breed !== undefined) row['breed'] = dog.breed;
  if (dog.activityLevel !== undefined) row['activity_level'] = dog.activityLevel;
  if (dog.goal !== undefined) row['goal'] = dog.goal;
  if (dog.favoriteIngredients !== undefined) row['favorite_ingredients'] = dog.favoriteIngredients;
  if (dog.dislikedIngredients !== undefined) row['disliked_ingredients'] = dog.dislikedIngredients;
  if (dog.forbiddenIngredients !== undefined) row['forbidden_ingredients'] = dog.forbiddenIngredients;
  if (dog.allergies !== undefined) row['allergies'] = dog.allergies;
  if (dog.cookingTime !== undefined) row['cooking_time'] = dog.cookingTime;
  if (dog.hasOven !== undefined) row['has_oven'] = dog.hasOven;
  if (dog.weeklyBudget !== undefined) row['weekly_budget'] = dog.weeklyBudget;
  return row;
}

/* ------------------------- ESTADO COMPLETO DEL USUARIO ------------------------- */

export interface UserData {
  dogs: Dog[];
  favorites: string[];
  preparedLog: PreparedLogEntry[];
  pantryItems: PantryItem[];
  shopping: ShoppingItem[];
  shoppingListId: string | null;
  weeklyPlan: WeeklyPlanDay[];
  weeklyPlanId: string | null;
  chat: ChatMessage[];
  conversationId: string | null;
  weights: WeightRecord[];
  reminders: Partial<Record<ReminderKey, boolean>>;
  dailyRecipeId: string | null;
}

export async function fetchUserData(userId: string): Promise<UserData> {
  const [
    dogs,
    favorites,
    prepared,
    pantry,
    lists,
    plans,
    conversations,
    weights,
    reminders,
    daily,
  ] = await Promise.all([
    supabase.from("dogs").select("*").order("created_at"),
    supabase.from("favorites").select("recipe_id"),
    supabase.from("prepared_recipes").select("*").order("prepared_at", { ascending: false }),
    supabase.from("pantry_items").select("*").order("created_at"),
    supabase.from("shopping_lists").select("id").order("created_at", { ascending: false }).limit(1),
    supabase.from("weekly_plans").select("*").order("created_at", { ascending: false }).limit(1),
    supabase
      .from("ai_conversations")
      .select("id")
      .order("created_at", { ascending: false })
      .limit(1),
    supabase.from("weight_records").select("*").order("date"),
    supabase.from("reminders").select("*"),
    supabase
      .from("daily_recipes")
      .select("recipe_id, date")
      .order("date", { ascending: false })
      .limit(1),
  ]);

  const shoppingListId = lists.data?.[0]?.id ?? null;
  let shopping: ShoppingItem[] = [];
  if (shoppingListId) {
    const { data } = await supabase
      .from("shopping_items")
      .select("*")
      .eq("list_id", shoppingListId);
    shopping = (data ?? []).map((i) => ({
      id: i.id,
      name: i.name,
      quantity: Number(i.quantity),
      unit: i.unit,
      category: i.category,
      owned: i.owned,
      bought: i.bought ?? false,
    }));
  }

  const conversationId = conversations.data?.[0]?.id ?? null;
  let chat: ChatMessage[] = [];
  if (conversationId) {
    const { data } = await supabase
      .from("ai_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at");
    chat = (data ?? []).map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      recipeIds: m.recipe_ids ?? [],
      createdAt: m.created_at,
    }));
  }

  const reminderMap: Partial<Record<ReminderKey, boolean>> = {};
  for (const r of reminders.data ?? []) reminderMap[r.key as ReminderKey] = r.enabled;

  return {
    dogs: (dogs.data ?? []).map((d) => toDog(d as unknown as DogRow)),
    favorites: (favorites.data ?? []).map((f) => f.recipe_id),
    preparedLog: (prepared.data ?? []).map((p) => ({
      id: p.id,
      recipeId: p.recipe_id,
      ...(p.dog_id ? { dogId: p.dog_id } : {}),
      date: p.prepared_at,
      ...(p.rating ? { rating: p.rating } : {}),
      ...(p.notes ? { notes: p.notes } : {}),
      ...(p.used_pantry ? { usedPantry: true } : {}),
    })),
    pantryItems: (pantry.data ?? []).map((i) => ({
      id: i.id,
      name: i.name,
      category: i.category,
      quantity: Number(i.quantity ?? 1),
      unit: i.unit ?? "pza",
      status: i.status ?? "disponible",
      ...(isoDate(i.purchased_at) ? { purchasedAt: i.purchased_at as string } : {}),
      ...(isoDate(i.expires_at) ? { expiresAt: i.expires_at as string } : {}),
      ...(i.notes ? { notes: i.notes } : {}),
      createdAt: i.created_at,
    })),
    shopping,
    shoppingListId,
    weeklyPlan: (plans.data?.[0]?.days as WeeklyPlanDay[] | undefined) ?? [],
    weeklyPlanId: plans.data?.[0]?.id ?? null,
    chat,
    conversationId,
    weights: (weights.data ?? []).map((w) => ({
      id: w.id,
      dogId: w.dog_id,
      date: w.date,
      weight: Number(w.weight),
      ...(w.note ? { note: w.note } : {}),
    })),
    reminders: reminderMap,
    dailyRecipeId: daily.data?.[0]?.recipe_id ?? null,
  };
}

/* ------------------------------ ESCRITURAS ------------------------------ */

const log = (label: string) => (res: { error: unknown }) => {
  if (res?.error) console.error(`[arimundo:${label}]`, res.error);
};

export const db = {
  upsertDog: (dog: Dog) =>
    void supabase.from("dogs").upsert(dogToRow(dog, dog.userId) as never).then(log("dogs")),
  updateDog: (id: string, patch: Partial<Dog>) =>
    void supabase.from("dogs").update(dogToRow(patch) as never).eq("id", id).then(log("dogs")),
  deleteDog: (id: string) => void supabase.from("dogs").delete().eq("id", id).then(log("dogs")),

  addFavorite: (userId: string, recipeId: string) =>
    void supabase
      .from("favorites")
      .upsert({ user_id: userId, recipe_id: recipeId } as never, {
        onConflict: "user_id,recipe_id",
      })
      .then(log("favorites")),
  removeFavorite: (userId: string, recipeId: string) =>
    void supabase
      .from("favorites")
      .delete()
      .eq("user_id", userId)
      .eq("recipe_id", recipeId)
      .then(log("favorites")),

  addPrepared: (userId: string, entry: PreparedLogEntry) =>
    void supabase
      .from("prepared_recipes")
      .insert({
        id: entry.id,
        user_id: userId,
        recipe_id: entry.recipeId,
        dog_id: entry.dogId ?? null,
        prepared_at: entry.date,
        used_pantry: entry.usedPantry ?? false,
      } as never)
      .then(log("prepared")),
  ratePrepared: (entryId: string, rating: number, notes?: string) =>
    void supabase
      .from("prepared_recipes")
      .update({ rating, notes: notes ?? null } as never)
      .eq("id", entryId)
      .then(log("prepared")),
  deletePrepared: (userId: string, recipeId: string) =>
    void supabase
      .from("prepared_recipes")
      .delete()
      .eq("user_id", userId)
      .eq("recipe_id", recipeId)
      .then(log("prepared")),

  upsertPantry: (userId: string, item: PantryItem) =>
    void supabase
      .from("pantry_items")
      .upsert({
        id: item.id,
        user_id: userId,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        status: item.status,
        purchased_at: item.purchasedAt ?? null,
        expires_at: item.expiresAt ?? null,
        notes: item.notes ?? null,
        created_at: item.createdAt,
      } as never)
      .then(log("pantry")),
  deletePantry: (id: string) =>
    void supabase.from("pantry_items").delete().eq("id", id).then(log("pantry")),

  async syncShopping(userId: string, listId: string | null, items: ShoppingItem[]) {
    let id = listId;
    if (!id) {
      id = newId();
      const { error } = await supabase
        .from("shopping_lists")
        .insert({ id, user_id: userId } as never);
      if (error) console.error("[arimundo:shopping_lists]", error);
    }
    await supabase.from("shopping_items").delete().eq("list_id", id);
    if (items.length) {
      const { error } = await supabase.from("shopping_items").insert(
        items.map((i) => ({
          id: i.id,
          list_id: id,
          user_id: userId,
          name: i.name,
          quantity: i.quantity,
          unit: i.unit,
          category: i.category,
          owned: i.owned,
          bought: i.bought ?? false,
        })) as never,
      );
      if (error) console.error("[arimundo:shopping_items]", error);
    }
    return id;
  },

  async syncWeeklyPlan(
    userId: string,
    planId: string | null,
    dogId: string | null,
    days: WeeklyPlanDay[],
  ) {
    const id = planId ?? newId();
    const { error } = await supabase.from("weekly_plans").upsert({
      id,
      user_id: userId,
      dog_id: dogId,
      days,
    } as never);
    if (error) console.error("[arimundo:weekly_plans]", error);
    return id;
  },

  async ensureConversation(userId: string, conversationId: string | null, dogId: string | null) {
    if (conversationId) return conversationId;
    const id = newId();
    const { error } = await supabase
      .from("ai_conversations")
      .insert({ id, user_id: userId, dog_id: dogId } as never);
    if (error) console.error("[arimundo:ai_conversations]", error);
    return id;
  },
  addMessages: (userId: string, conversationId: string, messages: ChatMessage[]) =>
    void supabase
      .from("ai_messages")
      .insert(
        messages.map((m) => ({
          id: m.id,
          conversation_id: conversationId,
          user_id: userId,
          role: m.role,
          content: m.content,
          recipe_ids: m.recipeIds ?? [],
          created_at: m.createdAt,
        })) as never,
      )
      .then(log("ai_messages")),
  clearMessages: (conversationId: string) =>
    void supabase
      .from("ai_messages")
      .delete()
      .eq("conversation_id", conversationId)
      .then(log("ai_messages")),

  addWeight: (userId: string, record: WeightRecord) =>
    void supabase
      .from("weight_records")
      .insert({
        id: record.id,
        user_id: userId,
        dog_id: record.dogId,
        weight: record.weight,
        date: record.date.slice(0, 10),
        note: record.note ?? null,
      } as never)
      .then(log("weight_records")),

  setReminder: (userId: string, key: ReminderKey, enabled: boolean) =>
    void supabase
      .from("reminders")
      .upsert({ user_id: userId, key, enabled } as never, { onConflict: "user_id,key" })
      .then(log("reminders")),

  setDailyRecipe: (userId: string, dogId: string | null, recipeId: string) =>
    void supabase
      .from("daily_recipes")
      .insert({
        user_id: userId,
        dog_id: dogId,
        recipe_id: recipeId,
        date: new Date().toISOString().slice(0, 10),
      } as never)
      .then(log("daily_recipes")),

  setPlan: (userId: string, plan: string) =>
    void supabase
      .from("profiles")
      .update({ plan } as never)
      .eq("id", userId)
      .then(log("profiles")),

  saveAchievements: (userId: string, earned: { code: string; title: string }[]) =>
    void supabase
      .from("achievements")
      .upsert(
        earned.map((a) => ({ user_id: userId, code: a.code, title: a.title })) as never,
        { onConflict: "user_id,code" },
      )
      .then(log("achievements")),
};

/* ------------------------------- STORAGE ------------------------------- */

/** Sube una imagen y devuelve una URL firmada de larga duración. */
export async function uploadImage(
  bucket: "dog-photos" | "avatars" | "recipe-images",
  userId: string,
  file: File,
): Promise<string | null> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${newId()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
  if (error) {
    console.error("[arimundo:storage]", error);
    return null;
  }
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24 * 365);
  return data?.signedUrl ?? null;
}

/* ---------------------- CATÁLOGO (ADMINISTRACIÓN) ---------------------- */

export type SaveResult = { error?: string };

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export const adminDb = {
  slugify,

  /** Crea o actualiza una receta junto con sus ingredientes. */
  async saveRecipe(recipe: Recipe): Promise<SaveResult> {
    const slug = recipe.slug || slugify(recipe.title) || newId().slice(0, 8);
    const { error } = await supabase.from("recipes").upsert({
      id: recipe.id,
      slug,
      title: recipe.title,
      image_url: recipe.imageUrl || null,
      category: recipe.category,
      minutes: recipe.minutes,
      servings: recipe.servings,
      needs_oven: recipe.needsOven,
      benefit: recipe.benefit,
      storage: recipe.storage,
      steps: recipe.steps,
      published: recipe.published,
      views: recipe.views,
    } as never);
    if (error) return { error: error.message };

    const del = await supabase.from("recipe_ingredients").delete().eq("recipe_id", recipe.id);
    if (del.error) return { error: del.error.message };

    if (recipe.ingredients.length) {
      const { data: known } = await supabase.from("ingredients").select("id");
      const validIds = new Set((known ?? []).map((k) => k.id));
      const ins = await supabase.from("recipe_ingredients").insert(
        recipe.ingredients.map((i) => ({
          recipe_id: recipe.id,
          ingredient_id: validIds.has(i.ingredientId) ? i.ingredientId : null,
          name: i.name,
          quantity: i.quantity,
          unit: i.unit,
        })) as never,
      );
      if (ins.error) return { error: ins.error.message };
    }
    return {};
  },

  async setRecipePublished(id: string, published: boolean): Promise<SaveResult> {
    const { error } = await supabase
      .from("recipes")
      .update({ published } as never)
      .eq("id", id);
    return error ? { error: error.message } : {};
  },

  async deleteRecipe(id: string): Promise<SaveResult> {
    await supabase.from("recipe_ingredients").delete().eq("recipe_id", id);
    const { error } = await supabase.from("recipes").delete().eq("id", id);
    return error ? { error: error.message } : {};
  },

  /** Crea o actualiza un ingrediente y su clasificación de seguridad. */
  async saveIngredient(ingredient: Ingredient): Promise<SaveResult> {
    const { error } = await supabase.from("ingredients").upsert({
      id: ingredient.id,
      name: ingredient.name,
      category: ingredient.category,
    } as never);
    if (error) return { error: error.message };

    const existing = await supabase
      .from("ingredient_safety")
      .select("id")
      .eq("ingredient_id", ingredient.id)
      .maybeSingle();

    const payload = {
      ingredient_id: ingredient.id,
      safety: ingredient.safety,
      note: ingredient.note ?? null,
    };
    const res = existing.data?.id
      ? await supabase
          .from("ingredient_safety")
          .update(payload as never)
          .eq("id", existing.data.id)
      : await supabase.from("ingredient_safety").insert(payload as never);
    return res.error ? { error: res.error.message } : {};
  },

  async deleteIngredient(id: string): Promise<SaveResult> {
    await supabase.from("ingredient_safety").delete().eq("ingredient_id", id);
    const { error } = await supabase.from("ingredients").delete().eq("id", id);
    return error ? { error: error.message } : {};
  },
};
