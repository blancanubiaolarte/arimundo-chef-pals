import type { Ingredient, Recipe } from "./types";

// Datos semilla locales. Se reemplazarán por consultas a Supabase
// (tablas: recipes, recipe_ingredients, ingredients, ingredient_safety).

export const INGREDIENTS: Ingredient[] = [
  { id: "f3c52d07-83af-58b3-ae8f-6dca00427d9a", name: "Pollo", category: "proteina", safety: "seguro" },
  { id: "821394c5-81ee-5233-8b61-6060957b0939", name: "Pavo", category: "proteina", safety: "seguro" },
  { id: "c4b145ec-af08-5428-ad95-f91bbaf7f40a", name: "Salmón", category: "proteina", safety: "seguro", note: "Siempre bien cocido" },
  { id: "6781a824-e4b5-5dde-a6d4-85d08f1b2a30", name: "Huevo", category: "proteina", safety: "seguro" },
  { id: "dcaf434d-4941-51ea-8a10-01f03ee8fe82", name: "Arroz", category: "cereal", safety: "seguro" },
  { id: "95fa9c2b-4bd2-5bab-8b63-b6044cfacb6f", name: "Avena", category: "cereal", safety: "seguro" },
  { id: "2b87f7ac-3b5c-55ee-99da-50b0b70ca38c", name: "Zanahoria", category: "vegetal", safety: "seguro" },
  { id: "e7ee6c51-2474-5cc4-97ce-2c4d1486bccb", name: "Calabaza", category: "vegetal", safety: "seguro" },
  { id: "b84e5395-178e-595b-9052-2664df898ab0", name: "Camote", category: "vegetal", safety: "seguro" },
  { id: "6f3df343-15c8-5079-b4cb-c85a9c1aacef", name: "Ejotes", category: "vegetal", safety: "seguro" },
  { id: "d7d8903d-a0aa-5b0b-b33a-fbfe25d38895", name: "Espinaca", category: "vegetal", safety: "moderacion", note: "En cantidades pequeñas" },
  { id: "137c0e5a-c737-5698-9aa3-69c97353f9df", name: "Plátano", category: "fruta", safety: "moderacion", note: "Alto en azúcar natural" },
  { id: "75614b72-ef41-561c-ae71-4a7f7c7278ba", name: "Manzana", category: "fruta", safety: "seguro", note: "Sin semillas" },
  { id: "b76f49e7-d59c-5df3-bac6-a586cd9be8e7", name: "Arándanos", category: "fruta", safety: "seguro" },
  { id: "649c1516-adfc-50db-93d5-b46c5d442fb8", name: "Yogur natural", category: "grasa", safety: "moderacion", note: "Sin azúcar ni edulcorantes" },
  { id: "9c2646bd-49ca-55fc-be63-37981d4fa197", name: "Aceite de oliva", category: "grasa", safety: "seguro" },
  { id: "f015c273-e2a5-5b50-b282-8bf09c830f49", name: "Semillas de chía", category: "suplemento", safety: "seguro" },
  { id: "fe559365-159c-54f6-ac1f-548fcec71cfc", name: "Uva", category: "fruta", safety: "evitar", note: "No apta para perros" },
  { id: "fc8c8231-d2ab-5f2b-9818-1aef539e19d1", name: "Cebolla", category: "vegetal", safety: "evitar", note: "No apta para perros" },
  { id: "de3e71e7-3267-5c33-87c7-ce38ac9b7260", name: "Chocolate", category: "suplemento", safety: "evitar", note: "No apto para perros" },
];

export const RECIPES: Recipe[] = [
  {
    id: "fce62a62-984d-5d8a-8252-da14d8ad6912",
    slug: "pollo-arroz-zanahoria",
    title: "Pollo con arroz y zanahoria",
    imageUrl: "/images/recipes/pollo-arroz.jpg",
    category: "principal",
    minutes: 20,
    servings: 2,
    needsOven: false,
    benefit: "Comida suave y equilibrada, ideal para el día a día.",
    storage: "Refrigerar hasta 3 días en recipiente hermético.",
    steps: [
      "Cocina el pollo en agua sin sal hasta que esté completamente cocido.",
      "Cocina el arroz por separado y deja enfriar.",
      "Hierve la zanahoria en cubos hasta que esté suave.",
      "Desmenuza el pollo y mezcla todo con un chorrito de aceite de oliva.",
      "Sirve a temperatura ambiente.",
    ],
    ingredients: [
      { ingredientId: "f3c52d07-83af-58b3-ae8f-6dca00427d9a", name: "Pollo", quantity: 200, unit: "g" },
      { ingredientId: "dcaf434d-4941-51ea-8a10-01f03ee8fe82", name: "Arroz", quantity: 100, unit: "g" },
      { ingredientId: "2b87f7ac-3b5c-55ee-99da-50b0b70ca38c", name: "Zanahoria", quantity: 1, unit: "pza" },
      { ingredientId: "9c2646bd-49ca-55fc-be63-37981d4fa197", name: "Aceite de oliva", quantity: 1, unit: "cda" },
    ],
    published: true,
    views: 1240,
  },
  {
    id: "916c05c8-c62d-5613-9ee8-90f6ca38be83",
    slug: "galletas-avena-calabaza",
    title: "Galletas de avena y calabaza",
    imageUrl: "/images/recipes/galletas-avena.jpg",
    category: "premio",
    minutes: 30,
    servings: 12,
    needsOven: true,
    benefit: "Premios caseros con fibra, perfectos para el entrenamiento.",
    storage: "Frasco hermético hasta 7 días.",
    steps: [
      "Precalienta el horno a 180 °C.",
      "Mezcla la avena con el puré de calabaza y el huevo.",
      "Forma bolitas y aplánalas sobre una bandeja con papel para hornear.",
      "Hornea 20 minutos y deja enfriar completamente antes de servir.",
    ],
    ingredients: [
      { ingredientId: "95fa9c2b-4bd2-5bab-8b63-b6044cfacb6f", name: "Avena", quantity: 150, unit: "g" },
      { ingredientId: "e7ee6c51-2474-5cc4-97ce-2c4d1486bccb", name: "Calabaza", quantity: 120, unit: "g" },
      { ingredientId: "6781a824-e4b5-5dde-a6d4-85d08f1b2a30", name: "Huevo", quantity: 1, unit: "pza" },
    ],
    published: true,
    views: 980,
  },
  {
    id: "b28e517d-bafe-5022-b7ce-3aeb7436af80",
    slug: "salmon-con-camote",
    title: "Salmón con camote y ejotes",
    imageUrl: "/images/recipes/salmon-camote.jpg",
    category: "principal",
    minutes: 25,
    servings: 2,
    needsOven: false,
    benefit: "Aporta grasas buenas y un sabor que encanta.",
    storage: "Refrigerar hasta 2 días.",
    steps: [
      "Cuece el salmón al vapor sin condimentos y retira todas las espinas.",
      "Cocina el camote hasta que esté suave y haz un puré.",
      "Cuece los ejotes y córtalos en trozos pequeños.",
      "Mezcla y sirve tibio.",
    ],
    ingredients: [
      { ingredientId: "c4b145ec-af08-5428-ad95-f91bbaf7f40a", name: "Salmón", quantity: 180, unit: "g" },
      { ingredientId: "b84e5395-178e-595b-9052-2664df898ab0", name: "Camote", quantity: 150, unit: "g" },
      { ingredientId: "6f3df343-15c8-5079-b4cb-c85a9c1aacef", name: "Ejotes", quantity: 80, unit: "g" },
    ],
    published: true,
    views: 764,
  },
  {
    id: "1005ae09-a015-5ae0-99c1-3b49f26fa8aa",
    slug: "helado-de-platano",
    title: "Helado de plátano y yogur",
    imageUrl: "/images/recipes/helado-platano.jpg",
    category: "snack",
    minutes: 5,
    servings: 6,
    needsOven: false,
    benefit: "Refrescante para los días calurosos.",
    storage: "Congelador hasta 30 días.",
    steps: [
      "Machaca el plátano hasta obtener un puré.",
      "Mezcla con el yogur natural sin azúcar.",
      "Vierte en moldes de silicona y congela 4 horas.",
    ],
    ingredients: [
      { ingredientId: "137c0e5a-c737-5698-9aa3-69c97353f9df", name: "Plátano", quantity: 1, unit: "pza" },
      { ingredientId: "649c1516-adfc-50db-93d5-b46c5d442fb8", name: "Yogur natural", quantity: 150, unit: "g" },
    ],
    published: true,
    views: 1502,
  },
  {
    id: "e580cdac-d2d1-5a2a-9044-17152c19f071",
    slug: "avena-con-manzana",
    title: "Avena tibia con manzana",
    imageUrl: "/images/recipes/galletas-avena.jpg",
    category: "desayuno",
    minutes: 10,
    servings: 2,
    needsOven: false,
    benefit: "Desayuno ligero y fácil de digerir.",
    storage: "Refrigerar hasta 2 días.",
    steps: [
      "Cocina la avena en agua hasta que espese.",
      "Ralla la manzana sin semillas y agrégala.",
      "Deja enfriar antes de servir.",
    ],
    ingredients: [
      { ingredientId: "95fa9c2b-4bd2-5bab-8b63-b6044cfacb6f", name: "Avena", quantity: 80, unit: "g" },
      { ingredientId: "75614b72-ef41-561c-ae71-4a7f7c7278ba", name: "Manzana", quantity: 1, unit: "pza" },
      { ingredientId: "f015c273-e2a5-5b50-b282-8bf09c830f49", name: "Semillas de chía", quantity: 1, unit: "cdta" },
    ],
    published: true,
    views: 431,
  },
  {
    id: "5e188fe2-d3f1-5bc5-a962-9701c186f3ad",
    slug: "pavo-con-calabaza",
    title: "Pavo con calabaza y arroz",
    imageUrl: "/images/recipes/pollo-arroz.jpg",
    category: "principal",
    minutes: 20,
    servings: 3,
    needsOven: false,
    benefit: "Proteína magra con vegetales suaves.",
    storage: "Refrigerar hasta 3 días.",
    steps: [
      "Cocina el pavo molido en una sartén sin aceite ni sal.",
      "Cuece la calabaza y el arroz por separado.",
      "Mezcla todo y sirve tibio.",
    ],
    ingredients: [
      { ingredientId: "821394c5-81ee-5233-8b61-6060957b0939", name: "Pavo", quantity: 220, unit: "g" },
      { ingredientId: "e7ee6c51-2474-5cc4-97ce-2c4d1486bccb", name: "Calabaza", quantity: 120, unit: "g" },
      { ingredientId: "dcaf434d-4941-51ea-8a10-01f03ee8fe82", name: "Arroz", quantity: 90, unit: "g" },
    ],
    published: true,
    views: 655,
  },
  {
    id: "ef124d19-d43d-56b3-b93c-be10d84fc582",
    slug: "bocados-de-arandano",
    title: "Bocados de arándano y avena",
    imageUrl: "/images/recipes/helado-platano.jpg",
    category: "premio",
    minutes: 10,
    servings: 10,
    needsOven: false,
    benefit: "Premios pequeños con antioxidantes naturales.",
    storage: "Refrigerar hasta 5 días.",
    steps: [
      "Tritura los arándanos con la avena.",
      "Forma bolitas pequeñas con las manos.",
      "Refrigera 1 hora antes de servir.",
    ],
    ingredients: [
      { ingredientId: "b76f49e7-d59c-5df3-bac6-a586cd9be8e7", name: "Arándanos", quantity: 80, unit: "g" },
      { ingredientId: "95fa9c2b-4bd2-5bab-8b63-b6044cfacb6f", name: "Avena", quantity: 100, unit: "g" },
    ],
    published: true,
    views: 288,
  },
  {
    id: "088830b0-a11e-55d2-84e1-e85066625bc1",
    slug: "caldo-hidratante",
    title: "Caldo hidratante de pollo",
    imageUrl: "/images/recipes/salmon-camote.jpg",
    category: "hidratacion",
    minutes: 20,
    servings: 4,
    needsOven: false,
    benefit: "Ayuda a que tome más líquidos en días de calor.",
    storage: "Refrigerar hasta 3 días o congelar en cubos.",
    steps: [
      "Hierve el pollo en agua sin sal ni condimentos durante 20 minutos.",
      "Cuela el caldo y deja enfriar completamente.",
      "Sirve solo o mezclado con su comida.",
    ],
    ingredients: [
      { ingredientId: "f3c52d07-83af-58b3-ae8f-6dca00427d9a", name: "Pollo", quantity: 150, unit: "g" },
      { ingredientId: "2b87f7ac-3b5c-55ee-99da-50b0b70ca38c", name: "Zanahoria", quantity: 1, unit: "pza" },
    ],
    published: false,
    views: 96,
  },
];

export const CATEGORY_LABEL: Record<string, string> = {
  desayuno: "Desayuno",
  principal: "Plato principal",
  snack: "Snack",
  premio: "Premio",
  hidratacion: "Hidratación",
};

export const DIETARY_DISCLAIMER =
  "La información de ARIMUNDO MASCOTAS es orientativa y no reemplaza el consejo de un veterinario. Consulta siempre con un profesional antes de cambiar la alimentación de tu perro.";

/**
 * Reemplaza en sitio el catálogo local con el que vive en la base de datos.
 * Los módulos que importan RECIPES/INGREDIENTS siguen funcionando igual.
 */
export function hydrateCatalog(recipes: Recipe[], ingredients: Ingredient[]) {
  if (recipes.length) RECIPES.splice(0, RECIPES.length, ...recipes);
  if (ingredients.length) INGREDIENTS.splice(0, INGREDIENTS.length, ...ingredients);
}
