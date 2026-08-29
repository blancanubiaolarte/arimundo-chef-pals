import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { RECIPES, hydrateCatalog } from "./mock-data";
import { buildShoppingList, generateWeek, streakFromLog } from "./planner";
import { guessCategory, isCovered } from "./pantry";
import { TRIAL_DAYS, maxDogsFor } from "./plans";
import { computeAchievements } from "./achievements";
import { db, fetchCatalog, fetchUserData, newId, uploadImage } from "./supabase-data";
import type {
  Achievement,
  AppUser,
  ChatMessage,
  Dog,
  PreparedLogEntry,
  PlanId,
  Recipe,
  ReminderKey,
  PantryItem,
  ShoppingItem,
  WeeklyPlanDay,
  WeightRecord,
} from "./types";

/**
 * Estado de la aplicación.
 *
 * Toda la información del usuario vive en Lovable Cloud (Supabase):
 * perros, favoritos, recetas preparadas, peso, alacena, compras,
 * menú semanal, recordatorios, logros y conversaciones con Chef IA.
 * El estado local es solo una copia optimista para que la interfaz
 * responda al instante mientras se guarda en la base de datos.
 */

interface PersistedState {
  user: AppUser | null;
  dogs: Dog[];
  activeDogId: string | null;
  favorites: string[];
  prepared: string[];
  pantryItems: PantryItem[];
  shopping: ShoppingItem[];
  shoppingListId: string | null;
  weeklyPlan: WeeklyPlanDay[];
  weeklyPlanId: string | null;
  chat: ChatMessage[];
  conversationId: string | null;
  weights: WeightRecord[];
  dailyRecipeId: string | null;
  preparedLog: PreparedLogEntry[];
  reminders: Partial<Record<ReminderKey, boolean>>;
}

const EMPTY: PersistedState = {
  user: null,
  dogs: [],
  activeDogId: null,
  favorites: [],
  prepared: [],
  pantryItems: [],
  shopping: [],
  shoppingListId: null,
  weeklyPlan: [],
  weeklyPlanId: null,
  chat: [],
  conversationId: null,
  weights: [],
  dailyRecipeId: null,
  preparedLog: [],
  reminders: {},
};

const ACTIVE_DOG_KEY = "arimundo:activeDog";

function uid(_prefix: string) {
  return newId();
}

export interface AuthResult {
  error?: string;
  needsEmailConfirmation?: boolean;
}

interface AppContextValue extends PersistedState {
  hydrated: boolean;
  /** Nombres de los ingredientes disponibles en Mi Alacena. */
  pantry: string[];
  activeDog: Dog | null;
  trialDaysLeft: number;
  isTrialActive: boolean;
  hasAccess: boolean;
  maxDogs: number;
  canAddDog: boolean;
  dailyRecipe: Recipe | null;
  streak: number;
  achievements: Achievement[];
  signUp: (name: string, email: string, password: string) => Promise<AuthResult>;
  resendVerification: (email: string) => Promise<AuthResult>;
  resendVerification: (email: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  signOut: () => Promise<void>;
  choosePlan: (plan: PlanId) => void;
  /** Vuelve a leer el perfil (plan, suscripción) desde la base de datos. */
  refreshUser: () => Promise<void>;

  addDog: (dog: Omit<Dog, "id" | "userId" | "createdAt">) => Dog;
  updateDog: (id: string, patch: Partial<Dog>) => void;
  removeDog: (id: string) => void;
  setActiveDog: (id: string) => void;
  uploadDogPhoto: (file: File) => Promise<string | null>;
  uploadAvatar: (file: File) => Promise<string | null>;
  toggleFavorite: (recipeId: string) => void;
  togglePrepared: (recipeId: string) => void;
  markPrepared: (recipeId: string) => string;
  ratePrepared: (entryId: string, rating: number, notes?: string) => void;
  toggleReminder: (key: ReminderKey) => void;
  generateWeeklyMenu: () => void;
  replacePlanDay: (day: string, recipeId: string) => void;
  toggleShoppingBought: (id: string) => void;
  addIngredientsToShopping: (recipeId: string) => void;
  shuffleDailyRecipe: () => void;
  regenerateShopping: () => void;
  toggleShoppingOwned: (id: string) => void;
  addRecipeToShopping: (recipeId: string) => void;
  togglePantry: (name: string) => void;
  addPantryItem: (item: Omit<PantryItem, "id" | "createdAt">) => void;
  updatePantryItem: (id: string, patch: Partial<PantryItem>) => void;
  removePantryItem: (id: string) => void;
  addMissingToShopping: (recipeId: string) => void;
  sendChatMessage: (content: string) => void;
  clearChat: () => void;
  addWeightRecord: (dogId: string, weight: number, note?: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const [catalogVersion, setCatalogVersion] = useState(0);
  const userIdRef = useRef<string | null>(null);
  const syncReady = useRef(false);

  const patch = useCallback((fn: (prev: PersistedState) => PersistedState) => {
    setState(fn);
  }, []);

  // Catálogo (recetas + ingredientes) desde la base de datos.
  useEffect(() => {
    let active = true;
    void fetchCatalog().then(({ recipes, ingredients }) => {
      if (!active || !recipes.length) return;
      hydrateCatalog(recipes, ingredients);
      setCatalogVersion((v) => v + 1);
    });
    return () => {
      active = false;
    };
  }, []);

  // Sesión + datos del usuario.
  const loadProfile = useCallback(async (session: Session | null) => {
    syncReady.current = false;
    if (!session?.user) {
      userIdRef.current = null;
      setState(EMPTY);
      setHydrated(true);
      return;
    }
    const authUser = session.user;
    userIdRef.current = authUser.id;

    const [{ data: profile }, { data: roles }, data] = await Promise.all([
      supabase
        .from("profiles")
        .select("name, avatar_url, plan, trial_ends_at, created_at, email")
        .eq("id", authUser.id)
        .maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", authUser.id),
      fetchUserData(authUser.id),
    ]);

    const trialEndsAt =
      profile?.trial_ends_at ?? new Date(Date.now() + TRIAL_DAYS * 86400000).toISOString();

    const user: AppUser = {
      id: authUser.id,
      email: profile?.email ?? authUser.email ?? "",
      name:
        profile?.name ||
        (authUser.user_metadata?.["name"] as string | undefined) ||
        (authUser.email?.split("@")[0] ?? "Amigo"),
      ...(profile?.avatar_url || authUser.user_metadata?.["avatar_url"]
        ? {
            avatarUrl: (profile?.avatar_url ??
              authUser.user_metadata?.["avatar_url"]) as string,
          }
        : {}),
      role: roles?.some((r) => r.role === "admin") ? "admin" : "user",
      createdAt: profile?.created_at ?? authUser.created_at,
      trialEndsAt,
      plan: (profile?.plan ?? "trial") as PlanId,
    };

    const storedActive =
      typeof window !== "undefined" ? window.localStorage.getItem(ACTIVE_DOG_KEY) : null;
    const activeDogId =
      data.dogs.find((d) => d.id === storedActive)?.id ?? data.dogs[0]?.id ?? null;

    const dailyRecipeId =
      data.dailyRecipeId ?? RECIPES.find((r) => r.published)?.id ?? RECIPES[0]?.id ?? null;

    setState({
      ...EMPTY,
      ...data,
      user,
      activeDogId,
      dailyRecipeId,
      prepared: Array.from(new Set(data.preparedLog.map((p) => p.recipeId))),
    });
    setHydrated(true);
    // Evita reescribir en la base de datos lo que acabamos de leer.
    setTimeout(() => {
      syncReady.current = true;
    }, 0);
  }, []);

  useEffect(() => {
    let active = true;
    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        if (active) void loadProfile(session);
      },
    );
    void supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      if (active) void loadProfile(data.session);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  // Sincronización de colecciones completas (lista de compras y menú semanal).
  const shoppingKey = JSON.stringify(state.shopping);
  useEffect(() => {
    const userId = userIdRef.current;
    if (!userId || !syncReady.current) return;
    const timer = setTimeout(() => {
      void db.syncShopping(userId, state.shoppingListId, state.shopping).then((id) => {
        if (id && id !== state.shoppingListId) {
          setState((prev) => ({ ...prev, shoppingListId: id }));
        }
      });
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shoppingKey]);

  const planKey = JSON.stringify(state.weeklyPlan);
  useEffect(() => {
    const userId = userIdRef.current;
    if (!userId || !syncReady.current || !state.weeklyPlan.length) return;
    const timer = setTimeout(() => {
      void db
        .syncWeeklyPlan(userId, state.weeklyPlanId, state.activeDogId, state.weeklyPlan)
        .then((id) => {
          if (id && id !== state.weeklyPlanId) {
            setState((prev) => ({ ...prev, weeklyPlanId: id }));
          }
        });
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planKey]);

  const value = useMemo<AppContextValue>(() => {
    void catalogVersion;
    const activeDog = state.dogs.find((d) => d.id === state.activeDogId) ?? state.dogs[0] ?? null;
    const userId = state.user?.id ?? null;

    const msLeft = state.user ? new Date(state.user.trialEndsAt).getTime() - Date.now() : 0;
    const trialDaysLeft = Math.max(0, Math.ceil(msLeft / 86400000));
    const isTrialActive = state.user?.plan === "trial" && trialDaysLeft > 0;
    const hasAccess = Boolean(state.user) && (isTrialActive || state.user?.plan !== "trial");
    const maxDogs = maxDogsFor(state.user?.plan ?? "trial");

    const pantryItems = state.pantryItems ?? [];
    const pantryNames = pantryItems.filter((i) => i.status !== "consumido").map((i) => i.name);

    const achievements = computeAchievements({
      preparedLog: state.preparedLog,
      favorites: state.favorites,
      weeklyPlan: state.weeklyPlan,
      weights: state.weights,
    });

    return {
      ...state,
      hydrated,
      pantry: pantryNames,
      activeDog,
      trialDaysLeft,
      isTrialActive,
      hasAccess,
      maxDogs,
      canAddDog: state.dogs.length < maxDogs,
      dailyRecipe: RECIPES.find((r) => r.id === state.dailyRecipeId) ?? RECIPES[0] ?? null,
      streak: streakFromLog(state.preparedLog.map((p) => p.date)),
      achievements,

      signUp: async (name, email, password) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`,
            data: { name },
          },
        });
        if (error) return { error: error.message };
        return { needsEmailConfirmation: !data.session };
      },
      resendVerification: async (email) => {
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth`,
    },
  });

  if (error) return { error: error.message };
  return {};
},
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return error ? { error: error.message } : {};
      },
      signInWithGoogle: async () => {
        try {
          await lovable.auth.signInWithOAuth("google", {
            redirect_uri: window.location.origin,
          });
          return {};
        } catch (e) {
          return { error: e instanceof Error ? e.message : "No se pudo continuar con Google" };
        }
      },
      signOut: async () => {
        await supabase.auth.signOut();
        setState(EMPTY);
      },
      choosePlan: (plan) => {
        if (userId) db.setPlan(userId, plan);
        patch((prev) => (prev.user ? { ...prev, user: { ...prev.user, plan } } : prev));
      },
      refreshUser: async () => {
        const { data } = await supabase.auth.getSession();
        await loadProfile(data.session);
      },


      addDog: (dog) => {
        const created: Dog = {
          ...dog,
          id: newId(),
          userId: userId ?? "anon",
          createdAt: new Date().toISOString(),
        };
        if (userId) db.upsertDog(created);
        patch((prev) => ({
          ...prev,
          dogs: [...prev.dogs, created],
          activeDogId: prev.activeDogId ?? created.id,
        }));
        return created;
      },
      updateDog: (id, dogPatch) => {
        if (userId) db.updateDog(id, dogPatch);
        patch((prev) => ({
          ...prev,
          dogs: prev.dogs.map((d) => (d.id === id ? { ...d, ...dogPatch } : d)),
        }));
      },
      removeDog: (id) => {
        if (userId) db.deleteDog(id);
        patch((prev) => ({
          ...prev,
          dogs: prev.dogs.filter((d) => d.id !== id),
          activeDogId: prev.activeDogId === id ? null : prev.activeDogId,
        }));
      },
      setActiveDog: (id) => {
        window.localStorage.setItem(ACTIVE_DOG_KEY, id);
        patch((prev) => ({ ...prev, activeDogId: id }));
      },
      uploadDogPhoto: async (file) =>
        userId ? uploadImage("dog-photos", userId, file) : null,
      uploadAvatar: async (file) => (userId ? uploadImage("avatars", userId, file) : null),

      toggleFavorite: (recipeId) => {
        const isFav = state.favorites.includes(recipeId);
        if (userId) {
          if (isFav) db.removeFavorite(userId, recipeId);
          else db.addFavorite(userId, recipeId);
        }
        patch((prev) => ({
          ...prev,
          favorites: isFav
            ? prev.favorites.filter((f) => f !== recipeId)
            : [...prev.favorites, recipeId],
        }));
      },
      togglePrepared: (recipeId) => {
        const already = state.prepared.includes(recipeId);
        if (userId && already) db.deletePrepared(userId, recipeId);
        patch((prev) => ({
          ...prev,
          prepared: already
            ? prev.prepared.filter((f) => f !== recipeId)
            : [...prev.prepared, recipeId],
          preparedLog: already
            ? prev.preparedLog.filter((e) => e.recipeId !== recipeId)
            : prev.preparedLog,
        }));
        if (!already) {
          const entry: PreparedLogEntry = {
            id: newId(),
            recipeId,
            ...(state.activeDogId ? { dogId: state.activeDogId } : {}),
            date: new Date().toISOString(),
          };
          if (userId) db.addPrepared(userId, entry);
          patch((prev) => ({ ...prev, preparedLog: [...prev.preparedLog, entry] }));
        }
      },
      markPrepared: (recipeId) => {
        const entryId = newId();
        const recipe = RECIPES.find((r) => r.id === recipeId);
        const available = pantryItems.filter((i) => i.status !== "consumido");
        const usedIds = recipe
          ? available
              .filter((item) => recipe.ingredients.some((ing) => isCovered(ing, [item])))
              .map((i) => i.id)
          : [];
        const usedPantry = Boolean(
          recipe && recipe.ingredients.every((ing) => isCovered(ing, available)),
        );
        const entry: PreparedLogEntry = {
          id: entryId,
          recipeId,
          ...(state.activeDogId ? { dogId: state.activeDogId } : {}),
          date: new Date().toISOString(),
          ...(usedPantry ? { usedPantry: true } : {}),
        };
        if (userId) {
          db.addPrepared(userId, entry);
          const earned = achievements.filter((a) => a.earned);
          if (earned.length) db.saveAchievements(userId, earned);
        }
        patch((prev) => {
          const nextPantry = prev.pantryItems.map((i) =>
            usedIds.includes(i.id)
              ? {
                  ...i,
                  status: (i.status === "disponible" ? "poco" : "consumido") as PantryItem["status"],
                }
              : i,
          );
          if (userId) {
            for (const item of nextPantry) {
              if (usedIds.includes(item.id)) db.upsertPantry(userId, item);
            }
          }
          return {
            ...prev,
            pantryItems: nextPantry,
            prepared: prev.prepared.includes(recipeId)
              ? prev.prepared
              : [...prev.prepared, recipeId],
            preparedLog: [...prev.preparedLog, entry],
          };
        });
        return entryId;
      },
      ratePrepared: (entryId, rating, notes) => {
        if (userId) db.ratePrepared(entryId, rating, notes);
        patch((prev) => ({
          ...prev,
          preparedLog: prev.preparedLog.map((entry) =>
            entry.id === entryId ? { ...entry, rating, ...(notes ? { notes } : {}) } : entry,
          ),
        }));
      },
      toggleReminder: (key) => {
        const next = !state.reminders[key];
        if (userId) db.setReminder(userId, key, next);
        patch((prev) => ({ ...prev, reminders: { ...prev.reminders, [key]: next } }));
      },
      generateWeeklyMenu: () =>
        patch((prev) => {
          const dog = prev.dogs.find((d) => d.id === prev.activeDogId) ?? prev.dogs[0] ?? null;
          const plan = generateWeek(dog, Math.floor(Math.random() * 7));
          return {
            ...prev,
            weeklyPlan: plan,
            shopping: buildShoppingList(plan, prev.shopping, pantryNames),
          };
        }),
      replacePlanDay: (day, recipeId) =>
        patch((prev) => {
          const plan = prev.weeklyPlan.map((d) => (d.day === day ? { ...d, recipeId } : d));
          return {
            ...prev,
            weeklyPlan: plan,
            shopping: buildShoppingList(plan, prev.shopping, pantryNames),
          };
        }),
      toggleShoppingBought: (id) =>
        patch((prev) => ({
          ...prev,
          shopping: prev.shopping.map((i) => (i.id === id ? { ...i, bought: !i.bought } : i)),
        })),
      addIngredientsToShopping: (recipeId) =>
        patch((prev) => {
          const recipe = RECIPES.find((r) => r.id === recipeId);
          if (!recipe) return prev;
          const items = prev.shopping.map((i) => ({ ...i }));
          for (const ing of recipe.ingredients) {
            const found = items.find((i) => i.id === ing.ingredientId);
            if (found) found.quantity += ing.quantity;
            else
              items.push({
                id: ing.ingredientId,
                name: ing.name,
                quantity: ing.quantity,
                unit: ing.unit,
                category: guessCategory(ing.name),
                owned: false,
                bought: false,
              });
          }
          return { ...prev, shopping: items };
        }),
      shuffleDailyRecipe: () =>
        patch((prev) => {
          const pool = RECIPES.filter((r) => r.published && r.id !== prev.dailyRecipeId);
          const next = pool[Math.floor(Math.random() * pool.length)];
          if (next && userId) db.setDailyRecipe(userId, prev.activeDogId, next.id);
          return next ? { ...prev, dailyRecipeId: next.id } : prev;
        }),

      regenerateShopping: () =>
        patch((prev) => {
          const dog = prev.dogs.find((d) => d.id === prev.activeDogId) ?? prev.dogs[0] ?? null;
          const plan = prev.weeklyPlan.length ? prev.weeklyPlan : generateWeek(dog);
          return {
            ...prev,
            weeklyPlan: plan,
            shopping: buildShoppingList(plan, prev.shopping, pantryNames),
          };
        }),
      toggleShoppingOwned: (id) =>
        patch((prev) => ({
          ...prev,
          shopping: prev.shopping.map((i) => (i.id === id ? { ...i, owned: !i.owned } : i)),
        })),
      addRecipeToShopping: (recipeId) =>
        patch((prev) => {
          const recipe = RECIPES.find((r) => r.id === recipeId);
          if (!recipe) return prev;
          const items = prev.shopping.map((i) => ({ ...i }));
          for (const ing of recipe.ingredients) {
            const found = items.find((i) => i.id === ing.ingredientId);
            if (found) found.quantity += ing.quantity;
            else
              items.push({
                id: ing.ingredientId,
                name: ing.name,
                quantity: ing.quantity,
                unit: ing.unit,
                category: guessCategory(ing.name),
                owned: false,
                bought: false,
              });
          }
          return { ...prev, shopping: items };
        }),
      togglePantry: (name) =>
        patch((prev) => {
          const found = prev.pantryItems.find(
            (i) => i.name.toLowerCase() === name.toLowerCase(),
          );
          if (found) {
            if (userId) db.deletePantry(found.id);
            return { ...prev, pantryItems: prev.pantryItems.filter((i) => i.id !== found.id) };
          }
          const item: PantryItem = {
            id: newId(),
            name,
            category: guessCategory(name),
            quantity: 1,
            unit: "pza",
            status: "disponible",
            createdAt: new Date().toISOString(),
          };
          if (userId) db.upsertPantry(userId, item);
          return { ...prev, pantryItems: [...prev.pantryItems, item] };
        }),
      addPantryItem: (item) =>
        patch((prev) => {
          if (prev.pantryItems.some((i) => i.name.toLowerCase() === item.name.toLowerCase())) {
            return prev;
          }
          const created: PantryItem = {
            ...item,
            id: newId(),
            createdAt: new Date().toISOString(),
          };
          if (userId) db.upsertPantry(userId, created);
          return { ...prev, pantryItems: [...prev.pantryItems, created] };
        }),
      updatePantryItem: (id, itemPatch) =>
        patch((prev) => {
          const next = prev.pantryItems.map((i) => (i.id === id ? { ...i, ...itemPatch } : i));
          const updated = next.find((i) => i.id === id);
          if (userId && updated) db.upsertPantry(userId, updated);
          return { ...prev, pantryItems: next };
        }),
      removePantryItem: (id) => {
        if (userId) db.deletePantry(id);
        patch((prev) => ({
          ...prev,
          pantryItems: prev.pantryItems.filter((i) => i.id !== id),
        }));
      },
      addMissingToShopping: (recipeId) =>
        patch((prev) => {
          const recipe = RECIPES.find((r) => r.id === recipeId);
          if (!recipe) return prev;
          const available = prev.pantryItems.filter((i) => i.status !== "consumido");
          const missing = recipe.ingredients.filter((ing) => !isCovered(ing, available));
          const items = prev.shopping.map((i) => ({ ...i }));
          for (const ing of missing) {
            const found = items.find((i) => i.id === ing.ingredientId);
            if (found) {
              found.quantity = Math.max(found.quantity, ing.quantity);
              found.owned = false;
            } else {
              items.push({
                id: ing.ingredientId,
                name: ing.name,
                quantity: ing.quantity,
                unit: ing.unit,
                category: guessCategory(ing.name),
                owned: false,
                bought: false,
              });
            }
          }
          return { ...prev, shopping: items };
        }),

      sendChatMessage: (content) => {
        const dog = state.dogs.find((d) => d.id === state.activeDogId) ?? state.dogs[0];
        const blocked = [...(dog?.allergies ?? []), ...(dog?.forbiddenIngredients ?? [])].map((s) =>
          s.toLowerCase(),
        );
        const tokens = content
          .toLowerCase()
          .split(/[^a-záéíóúñ]+/i)
          .filter((t) => t.length > 3);
        const pantryTokens = pantryItems
          .filter((i) => i.status !== "consumido")
          .map((i) => i.name.toLowerCase());
        const searchTokens = tokens.length ? tokens : pantryTokens;
        const matches = RECIPES.filter(
          (r) =>
            r.published &&
            !r.ingredients.some((i) => blocked.some((b) => i.name.toLowerCase().includes(b))) &&
            r.ingredients.some((i) => searchTokens.some((t) => i.name.toLowerCase().includes(t))),
        ).slice(0, 3);

        const answer = matches.length
          ? `Con esos ingredientes encontré ${matches.length} receta(s) de la biblioteca de ARIMUNDO${dog ? ` que puedes preparar para ${dog.name}` : ""}. Recuerda que esta información es orientativa y no reemplaza el consejo de un veterinario.`
          : "Todavía no tengo una receta de la biblioteca con esos ingredientes. Cuéntame qué más tienes en casa y busco otra opción. Esta información es orientativa y no reemplaza el consejo de un veterinario.";

        const now = new Date().toISOString();
        const assistantId = newId();
        const messages: ChatMessage[] = [
          { id: newId(), role: "user", content, createdAt: now },
          {
            id: assistantId,
            role: "assistant",
            content: answer,
            recipeIds: matches.map((m) => m.id),
            createdAt: now,
          },
        ];
        patch((prev) => ({ ...prev, chat: [...prev.chat, ...messages] }));
        if (userId) {
          // Chef IA real: lee el perfil completo del perro y el historial en el backend.
          void (async () => {
            try {
              const { askChefIA } = await import("./chef-ia.functions");
              const res = await askChefIA({
                data: {
                  message: content,
                  ...(dog?.id ? { dogId: dog.id } : {}),
                  pantry: pantryTokens,
                },
              });
              if (res?.ready && res.reply) {
                const reply = res.reply;
                patch((prev) => ({
                  ...prev,
                  chat: prev.chat.map((m) =>
                    m.id === assistantId ? { ...m, content: reply } : m,
                  ),
                }));
                messages[1] = { ...messages[1]!, content: reply };
              }
            } catch {
              /* se mantiene la respuesta local de la biblioteca */
            }
            const conversationId = await db.ensureConversation(
              userId,
              state.conversationId,
              state.activeDogId,
            );
            setState((prev) => ({ ...prev, conversationId }));
            db.addMessages(userId, conversationId, messages);
          })();
        }
      },
      clearChat: () => {
        if (state.conversationId) db.clearMessages(state.conversationId);
        patch((prev) => ({ ...prev, chat: [] }));
      },

      addWeightRecord: (dogId, weight, note) => {
        const record: WeightRecord = {
          id: newId(),
          dogId,
          weight,
          date: new Date().toISOString(),
          ...(note ? { note } : {}),
        };
        if (userId) {
          db.addWeight(userId, record);
          db.updateDog(dogId, { weight });
        }
        patch((prev) => ({
          ...prev,
          weights: [...prev.weights, record],
          dogs: prev.dogs.map((d) => (d.id === dogId ? { ...d, weight } : d)),
        }));
      },
    };
  }, [state, hydrated, patch, catalogVersion, loadProfile]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp debe usarse dentro de AppProvider");
  return ctx;
}

export { uid };
