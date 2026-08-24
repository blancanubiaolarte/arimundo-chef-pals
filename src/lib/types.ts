// Modelo de dominio de ARIMUNDO MASCOTAS.
// Los nombres de tipos y campos siguen el esquema previsto en Supabase
// (users, dogs, recipes, ingredients, ...) para facilitar la conexión posterior.

export type UUID = string;

export type PlanId = "trial" | "basico" | "familiar" | "premium";

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  maxDogs: number;
  tagline: string;
  features: string[];
  highlighted?: boolean;
}

export interface AppUser {
  id: UUID;
  email: string;
  name: string;
  avatarUrl?: string;
  role: "user" | "admin";
  createdAt: string;
  trialEndsAt: string;
  plan: PlanId;
}

export type Sex = "macho" | "hembra";
export type WeightUnit = "kg" | "lb";
export type ActivityLevel = "bajo" | "moderado" | "alto";
export type CookingTime = "5" | "10" | "20" | "30+";

export interface Dog {
  id: UUID;
  userId: UUID;
  name: string;
  photoUrl?: string;
  sex: Sex;
  ageYears: number;
  birthDate?: string;
  weight: number;
  weightUnit: WeightUnit;
  breed: string;
  activityLevel: ActivityLevel;
  goal: string;
  favoriteIngredients: string[];
  dislikedIngredients: string[];
  forbiddenIngredients: string[];
  allergies: string[];
  cookingTime: CookingTime;
  hasOven: boolean;
  weeklyBudget: number;
  createdAt: string;
}

export type IngredientCategory =
  | "proteina"
  | "vegetal"
  | "cereal"
  | "fruta"
  | "grasa"
  | "suplemento";

export type SafetyLevel = "seguro" | "moderacion" | "evitar";

export interface Ingredient {
  id: UUID;
  name: string;
  category: IngredientCategory;
  safety: SafetyLevel;
  note?: string;
}

export interface RecipeIngredient {
  ingredientId: UUID;
  name: string;
  quantity: number;
  unit: string;
}

export type RecipeCategory =
  | "desayuno"
  | "principal"
  | "snack"
  | "premio"
  | "hidratacion";

export interface Recipe {
  id: UUID;
  slug: string;
  title: string;
  imageUrl: string;
  category: RecipeCategory;
  minutes: number;
  servings: number;
  needsOven: boolean;
  benefit: string;
  storage: string;
  steps: string[];
  ingredients: RecipeIngredient[];
  published: boolean;
  views: number;
}

export interface ShoppingItem {
  id: UUID;
  name: string;
  quantity: number;
  unit: string;
  category: IngredientCategory;
  /** Ya lo tengo en casa */
  owned: boolean;
  /** Ya lo compré */
  bought?: boolean;
}

export interface WeeklyPlanDay {
  day: string;
  recipeId: UUID;
}

export interface PreparedLogEntry {
  id: UUID;
  recipeId: UUID;
  dogId?: UUID;
  date: string;
}

export interface ChatMessage {
  id: UUID;
  role: "user" | "assistant";
  content: string;
  recipeIds?: UUID[];
  createdAt: string;
}

export interface WeightRecord {
  id: UUID;
  dogId: UUID;
  date: string;
  weight: number;
}
