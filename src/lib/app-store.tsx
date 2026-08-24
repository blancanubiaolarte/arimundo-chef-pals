import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { RECIPES } from "./mock-data";
import { buildShoppingList, generateWeek, streakFromLog } from "./planner";
import { TRIAL_DAYS, maxDogsFor } from "./plans";
import type {
  AppUser,
  ChatMessage,
  Dog,
  PreparedLogEntry,
  PlanId,
  Recipe,
  ShoppingItem,
  WeeklyPlanDay,
  WeightRecord,
} from "./types";

/**
 * Estado de la aplicación en el cliente.
 *
 * Hoy persiste en localStorage. La forma de los datos ya corresponde al
 * esquema previsto en Supabase, por lo que sustituir esta capa por
 * consultas reales no requiere cambiar la interfaz de los componentes.
 */

const STORAGE_KEY = "arimundo:state:v1";

interface PersistedState {
  user: AppUser | null;
  dogs: Dog[];
  activeDogId: string | null;
  favorites: string[];
  prepared: string[];
  pantry: string[];
  shopping: ShoppingItem[];
  weeklyPlan: WeeklyPlanDay[];
  chat: ChatMessage[];
  weights: WeightRecord[];
  dailyRecipeId: string | null;
  preparedLog: PreparedLogEntry[];
}

const EMPTY: PersistedState = {
  user: null,
  dogs: [],
  activeDogId: null,
  favorites: [],
  prepared: [],
  pantry: [],
  shopping: [],
  weeklyPlan: [],
  chat: [],
  weights: [],
  dailyRecipeId: null,
  preparedLog: [],
};

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildWeeklyPlan(): WeeklyPlanDay[] {
  const published = RECIPES.filter((r) => r.published);
  return DAYS.map((day, i) => ({ day, recipeId: published[i % published.length]!.id }));
}




export interface AuthResult {
  error?: string;
  needsEmailConfirmation?: boolean;
}

interface AppContextValue extends PersistedState {
  hydrated: boolean;
  activeDog: Dog | null;
  trialDaysLeft: number;
  isTrialActive: boolean;
  hasAccess: boolean;
  maxDogs: number;
  canAddDog: boolean;
  dailyRecipe: Recipe | null;
  streak: number;
  signUp: (name: string, email: string, password: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  signOut: () => Promise<void>;
  choosePlan: (plan: PlanId) => void;
  addDog: (dog: Omit<Dog, "id" | "userId" | "createdAt">) => Dog;
  updateDog: (id: string, patch: Partial<Dog>) => void;
  removeDog: (id: string) => void;
  setActiveDog: (id: string) => void;
  toggleFavorite: (recipeId: string) => void;
  togglePrepared: (recipeId: string) => void;
  markPrepared: (recipeId: string) => void;
  generateWeeklyMenu: () => void;
  replacePlanDay: (day: string, recipeId: string) => void;
  toggleShoppingBought: (id: string) => void;
  addIngredientsToShopping: (recipeId: string) => void;
  shuffleDailyRecipe: () => void;
  regenerateShopping: () => void;
  toggleShoppingOwned: (id: string) => void;
  addRecipeToShopping: (recipeId: string) => void;
  togglePantry: (name: string) => void;
  sendChatMessage: (content: string) => void;
  clearChat: () => void;
  addWeightRecord: (dogId: string, weight: number) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(EMPTY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...EMPTY, ...(JSON.parse(raw) as PersistedState), user: null });
    } catch {
      /* estado inicial vacío */
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, user: null }));
  }, [state, hydrated]);

  const patch = useCallback((fn: (prev: PersistedState) => PersistedState) => {
    setState(fn);
  }, []);

  // Sesión real de Lovable Cloud: perfil + rol se leen de la base de datos.
  const loadProfile = useCallback(
    async (session: Session | null) => {
      if (!session?.user) {
        setState((prev) => ({ ...prev, user: null }));
        setHydrated(true);
        return;
      }
      const authUser = session.user;
      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase
          .from("profiles")
          .select("name, avatar_url, plan, trial_ends_at, created_at, email")
          .eq("id", authUser.id)
          .maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", authUser.id),
      ]);

      const trialEndsAt =
        profile?.trial_ends_at ??
        new Date(Date.now() + TRIAL_DAYS * 86400000).toISOString();

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

      setState((prev) => ({
        ...prev,
        user,
        weeklyPlan: prev.weeklyPlan.length ? prev.weeklyPlan : buildWeeklyPlan(),
        dailyRecipeId: prev.dailyRecipeId ?? RECIPES[0]!.id,
      }));
      setHydrated(true);
    },
    [],
  );

  useEffect(() => {
    let active = true;
    const { data: sub } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      if (active) void loadProfile(session);
    });
    void supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      if (active) void loadProfile(data.session);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);


  const value = useMemo<AppContextValue>(() => {
    const activeDog = state.dogs.find((d) => d.id === state.activeDogId) ?? state.dogs[0] ?? null;

    const msLeft = state.user ? new Date(state.user.trialEndsAt).getTime() - Date.now() : 0;
    const trialDaysLeft = Math.max(0, Math.ceil(msLeft / 86400000));
    const isTrialActive = state.user?.plan === "trial" && trialDaysLeft > 0;
    const hasAccess = Boolean(state.user) && (isTrialActive || state.user?.plan !== "trial");
    const maxDogs = maxDogsFor(state.user?.plan ?? "trial");

    return {
      ...state,
      hydrated,
      activeDog,
      trialDaysLeft,
      isTrialActive,
      hasAccess,
      maxDogs,
      canAddDog: state.dogs.length < maxDogs,
      dailyRecipe: RECIPES.find((r) => r.id === state.dailyRecipeId) ?? RECIPES[0]!,
      streak: streakFromLog(state.preparedLog.map((p) => p.date)),

      signUp: async (name, email, password) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { name },
          },
        });
        if (error) return { error: error.message };
        return { needsEmailConfirmation: !data.session };
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
        setState((prev) => ({ ...prev, user: null }));
      },
      choosePlan: (plan) =>
        patch((prev) => (prev.user ? { ...prev, user: { ...prev.user, plan } } : prev)),

      addDog: (dog) => {
        const created: Dog = {
          ...dog,
          id: uid("dog"),
          userId: state.user?.id ?? "anon",
          createdAt: new Date().toISOString(),
        };
        patch((prev) => ({
          ...prev,
          dogs: [...prev.dogs, created],
          activeDogId: prev.activeDogId ?? created.id,
        }));
        return created;
      },
      updateDog: (id, dogPatch) =>
        patch((prev) => ({
          ...prev,
          dogs: prev.dogs.map((d) => (d.id === id ? { ...d, ...dogPatch } : d)),
        })),
      removeDog: (id) =>
        patch((prev) => ({
          ...prev,
          dogs: prev.dogs.filter((d) => d.id !== id),
          activeDogId: prev.activeDogId === id ? null : prev.activeDogId,
        })),
      setActiveDog: (id) => patch((prev) => ({ ...prev, activeDogId: id })),

      toggleFavorite: (recipeId) =>
        patch((prev) => ({
          ...prev,
          favorites: prev.favorites.includes(recipeId)
            ? prev.favorites.filter((f) => f !== recipeId)
            : [...prev.favorites, recipeId],
        })),
      togglePrepared: (recipeId) =>
        patch((prev) => ({
          ...prev,
          prepared: prev.prepared.includes(recipeId)
            ? prev.prepared.filter((f) => f !== recipeId)
            : [...prev.prepared, recipeId],
        })),
      markPrepared: (recipeId) =>
        patch((prev) => ({
          ...prev,
          prepared: prev.prepared.includes(recipeId)
            ? prev.prepared
            : [...prev.prepared, recipeId],
          preparedLog: [
            ...prev.preparedLog,
            {
              id: uid("prep"),
              recipeId,
              ...(prev.activeDogId ? { dogId: prev.activeDogId } : {}),
              date: new Date().toISOString(),
            },
          ],
        })),
      generateWeeklyMenu: () =>
        patch((prev) => {
          const dog = prev.dogs.find((d) => d.id === prev.activeDogId) ?? prev.dogs[0] ?? null;
          const plan = generateWeek(dog, Math.floor(Math.random() * 7));
          return { ...prev, weeklyPlan: plan, shopping: buildShoppingList(plan, prev.shopping) };
        }),
      replacePlanDay: (day, recipeId) =>
        patch((prev) => {
          const plan = prev.weeklyPlan.map((d) => (d.day === day ? { ...d, recipeId } : d));
          return { ...prev, weeklyPlan: plan, shopping: buildShoppingList(plan, prev.shopping) };
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
                category: "proteina",
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
          return next ? { ...prev, dailyRecipeId: next.id } : prev;
        }),

      regenerateShopping: () =>
        patch((prev) => {
          const dog = prev.dogs.find((d) => d.id === prev.activeDogId) ?? prev.dogs[0] ?? null;
          const plan = prev.weeklyPlan.length ? prev.weeklyPlan : generateWeek(dog);
          return { ...prev, weeklyPlan: plan, shopping: buildShoppingList(plan, prev.shopping) };
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
          const items = [...prev.shopping];
          for (const ing of recipe.ingredients) {
            const found = items.find((i) => i.id === ing.ingredientId);
            if (found) found.quantity += ing.quantity;
            else
              items.push({
                id: ing.ingredientId,
                name: ing.name,
                quantity: ing.quantity,
                unit: ing.unit,
                category: "proteina",
                owned: false,
              });
          }
          return { ...prev, shopping: items };
        }),
      togglePantry: (name) =>
        patch((prev) => ({
          ...prev,
          pantry: prev.pantry.includes(name)
            ? prev.pantry.filter((p) => p !== name)
            : [...prev.pantry, name],
        })),

      sendChatMessage: (content) =>
        patch((prev) => {
          const dog = prev.dogs.find((d) => d.id === prev.activeDogId) ?? prev.dogs[0];
          const blocked = [
            ...(dog?.allergies ?? []),
            ...(dog?.forbiddenIngredients ?? []),
          ].map((s) => s.toLowerCase());
          const tokens = content
            .toLowerCase()
            .split(/[^a-záéíóúñ]+/i)
            .filter((t) => t.length > 3);
          const matches = RECIPES.filter(
            (r) =>
              r.published &&
              !r.ingredients.some((i) => blocked.some((b) => i.name.toLowerCase().includes(b))) &&
              r.ingredients.some((i) => tokens.some((t) => i.name.toLowerCase().includes(t))),
          ).slice(0, 3);

          const answer = matches.length
            ? `Con esos ingredientes encontré ${matches.length} receta(s) de la biblioteca de ARIMUNDO${dog ? ` que puedes preparar para ${dog.name}` : ""}. Recuerda que esta información es orientativa y no reemplaza el consejo de un veterinario.`
            : "Todavía no tengo una receta de la biblioteca con esos ingredientes. Cuéntame qué más tienes en casa y busco otra opción. Esta información es orientativa y no reemplaza el consejo de un veterinario.";

          const now = new Date().toISOString();
          return {
            ...prev,
            chat: [
              ...prev.chat,
              { id: uid("msg"), role: "user", content, createdAt: now },
              {
                id: uid("msg"),
                role: "assistant",
                content: answer,
                recipeIds: matches.map((m) => m.id),
                createdAt: now,
              },
            ],
          };
        }),
      clearChat: () => patch((prev) => ({ ...prev, chat: [] })),

      addWeightRecord: (dogId, weight) =>
        patch((prev) => ({
          ...prev,
          weights: [
            ...prev.weights,
            { id: uid("w"), dogId, weight, date: new Date().toISOString() },
          ],
          dogs: prev.dogs.map((d) => (d.id === dogId ? { ...d, weight } : d)),
        })),
    };
  }, [state, hydrated, patch]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp debe usarse dentro de AppProvider");
  return ctx;
}
