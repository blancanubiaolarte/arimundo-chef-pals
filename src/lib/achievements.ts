import type { Achievement, PreparedLogEntry, WeeklyPlanDay } from "./types";
import { RECIPES } from "./mock-data";
import { streakFromLog } from "./planner";

interface AchievementInput {
  preparedLog: PreparedLogEntry[];
  favorites: string[];
  weeklyPlan: WeeklyPlanDay[];
  weights: { id: string }[];
}

function make(
  code: string,
  emoji: string,
  title: string,
  description: string,
  progress: number,
  target: number,
): Achievement {
  return {
    code,
    emoji,
    title,
    description,
    progress: Math.min(progress, target),
    target,
    earned: progress >= target,
  };
}

/** Insignias del diario del perro. Se calculan a partir del historial local. */
export function computeAchievements({
  preparedLog,
  favorites,
  weeklyPlan,
  weights,
}: AchievementInput): Achievement[] {
  const total = preparedLog.length;
  const streak = streakFromLog(preparedLog.map((p) => p.date));
  const healthy = preparedLog.filter((entry) => {
    const recipe = RECIPES.find((r) => r.id === entry.recipeId);
    return recipe?.ingredients.some((i) =>
      ["zanahoria", "manzana", "calabaza", "espinaca", "avena", "brócoli", "arándano"].some((v) =>
        i.name.toLowerCase().includes(v),
      ),
    );
  }).length;

  return [
    make("primera-receta", "🥇", "Primera receta", "Preparaste tu primera receta", total, 1),
    make("racha-7", "🔥", "7 días consecutivos", "Una semana cocinando sin parar", streak, 7),
    make("recetas-25", "🏆", "25 recetas", "25 preparaciones registradas", total, 25),
    make("favoritas-10", "❤️", "10 favoritas", "Guardaste 10 recetas favoritas", favorites.length, 10),
    make("menu-semanal", "📅", "Primer menú semanal", "Generaste un plan de 7 días", weeklyPlan.length, 7),
    make("saludable", "🥕", "Primera receta saludable", "Con frutas o vegetales", healthy, 1),
    make("peso-registrado", "⚖️", "Primer registro de peso", "Empezaste el historial de peso", weights.length, 1),
    make("constancia", "🌟", "10 preparaciones", "El hábito ya está en marcha", total, 10),
  ];
}
