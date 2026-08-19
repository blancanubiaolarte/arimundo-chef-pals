import type { Plan, PlanId } from "./types";

export const TRIAL_DAYS = 3;

export const PLANS: Plan[] = [
  {
    id: "basico",
    name: "Plan Básico",
    price: 2.99,
    maxDogs: 1,
    tagline: "Para un compañero",
    features: [
      "1 perro",
      "Receta del día personalizada",
      "Biblioteca completa de recetas",
      "Lista de compras semanal",
    ],
  },
  {
    id: "familiar",
    name: "Plan Familiar",
    price: 5.99,
    maxDogs: 2,
    tagline: "Para dos peluditos",
    highlighted: true,
    features: [
      "Hasta 2 perros",
      "Todo lo del plan Básico",
      "Plan semanal automático",
      "Chef IA sin límites",
    ],
  },
  {
    id: "premium",
    name: "Plan Premium",
    price: 9.99,
    maxDogs: 5,
    tagline: "Para toda la manada",
    features: [
      "Hasta 5 perros",
      "Todo lo del plan Familiar",
      "Seguimiento de progreso y peso",
      "Notificaciones y logros",
    ],
  },
];

export function planById(id: PlanId): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

export function maxDogsFor(id: PlanId): number {
  if (id === "trial") return 5;
  return planById(id)?.maxDogs ?? 1;
}
