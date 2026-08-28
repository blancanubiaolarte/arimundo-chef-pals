import type { Plan, PlanId } from "./types";

export const TRIAL_DAYS = 3;

export const PLANS: Plan[] = [
  {
    id: "basico",
    name: "ARIMUNDO Chef Básico",
    price: 4.99,
    maxDogs: 1,
    tagline: "Para un compañero",
    features: [
      "Hasta 1 perro",
      "Receta del día personalizada",
      "Biblioteca completa de recetas",
      "Lista de compras semanal",
      "Hasta 30 recetas personalizadas con Chef IA por mes",
    ],
  },
  {
    id: "familiar",
    name: "ARIMUNDO Chef Plus",
    price: 7.99,
    maxDogs: 2,
    tagline: "Para dos peluditos",
    highlighted: true,
    features: [
      "Hasta 2 perros",
      "Todo lo del ARIMUNDO Chef Básico",
      "Plan semanal automático",
      "Chef IA",
      "Hasta 60 recetas personalizadas con Chef IA por mes",
    ],
  },
  {
    id: "premium",
    name: "ARIMUNDO Chef Premium",
    price: 10.99,
    maxDogs: 5,
    tagline: "Para toda la manada",
    features: [
      "Hasta 5 perros",
      "Todo lo del ARIMUNDO Chef Plus",
      "Seguimiento de progreso y peso",
      "Notificaciones y logros",
      "Hasta 100 recetas personalizadas con Chef IA por mes",
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
