-- 1. Extensiones de esquema
create type public.pantry_status as enum ('disponible','poco','consumido');
create type public.reminder_key as enum ('comida','cocinar','pesar','compras','recetaDelDia');

alter table public.pantry_items
  add column if not exists category public.ingredient_category not null default 'proteina',
  add column if not exists quantity numeric not null default 1,
  add column if not exists unit text not null default 'pza',
  add column if not exists status public.pantry_status not null default 'disponible',
  add column if not exists purchased_at date,
  add column if not exists expires_at date,
  add column if not exists notes text;

alter table public.prepared_recipes
  add column if not exists rating int,
  add column if not exists notes text,
  add column if not exists used_pantry boolean not null default false;

alter table public.weight_records add column if not exists note text;
alter table public.shopping_items add column if not exists bought boolean not null default false;

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  key public.reminder_key not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, key)
);
grant select, insert, update, delete on public.reminders to authenticated;
grant all on public.reminders to service_role;
alter table public.reminders enable row level security;
create policy "reminders_own_all" on public.reminders for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create trigger reminders_updated_at before update on public.reminders
  for each row execute function public.update_updated_at_column();

-- 2. Catálogo base: ingredientes
insert into public.ingredients (id, name, category) values
 ('f3c52d07-83af-58b3-ae8f-6dca00427d9a','Pollo','proteina'),
 ('821394c5-81ee-5233-8b61-6060957b0939','Pavo','proteina'),
 ('c4b145ec-af08-5428-ad95-f91bbaf7f40a','Salmón','proteina'),
 ('6781a824-e4b5-5dde-a6d4-85d08f1b2a30','Huevo','proteina'),
 ('dcaf434d-4941-51ea-8a10-01f03ee8fe82','Arroz','cereal'),
 ('95fa9c2b-4bd2-5bab-8b63-b6044cfacb6f','Avena','cereal'),
 ('2b87f7ac-3b5c-55ee-99da-50b0b70ca38c','Zanahoria','vegetal'),
 ('e7ee6c51-2474-5cc4-97ce-2c4d1486bccb','Calabaza','vegetal'),
 ('b84e5395-178e-595b-9052-2664df898ab0','Camote','vegetal'),
 ('6f3df343-15c8-5079-b4cb-c85a9c1aacef','Ejotes','vegetal'),
 ('d7d8903d-a0aa-5b0b-b33a-fbfe25d38895','Espinaca','vegetal'),
 ('137c0e5a-c737-5698-9aa3-69c97353f9df','Plátano','fruta'),
 ('75614b72-ef41-561c-ae71-4a7f7c7278ba','Manzana','fruta'),
 ('b76f49e7-d59c-5df3-bac6-a586cd9be8e7','Arándanos','fruta'),
 ('649c1516-adfc-50db-93d5-b46c5d442fb8','Yogur natural','grasa'),
 ('9c2646bd-49ca-55fc-be63-37981d4fa197','Aceite de oliva','grasa'),
 ('f015c273-e2a5-5b50-b282-8bf09c830f49','Semillas de chía','suplemento'),
 ('fe559365-159c-54f6-ac1f-548fcec71cfc','Uva','fruta'),
 ('fc8c8231-d2ab-5f2b-9818-1aef539e19d1','Cebolla','vegetal'),
 ('de3e71e7-3267-5c33-87c7-ce38ac9b7260','Chocolate','suplemento')
on conflict (id) do nothing;

insert into public.ingredient_safety (ingredient_id, safety, note) values
 ('f3c52d07-83af-58b3-ae8f-6dca00427d9a','seguro',null),
 ('821394c5-81ee-5233-8b61-6060957b0939','seguro',null),
 ('c4b145ec-af08-5428-ad95-f91bbaf7f40a','seguro','Siempre bien cocido'),
 ('6781a824-e4b5-5dde-a6d4-85d08f1b2a30','seguro',null),
 ('dcaf434d-4941-51ea-8a10-01f03ee8fe82','seguro',null),
 ('95fa9c2b-4bd2-5bab-8b63-b6044cfacb6f','seguro',null),
 ('2b87f7ac-3b5c-55ee-99da-50b0b70ca38c','seguro',null),
 ('e7ee6c51-2474-5cc4-97ce-2c4d1486bccb','seguro',null),
 ('b84e5395-178e-595b-9052-2664df898ab0','seguro',null),
 ('6f3df343-15c8-5079-b4cb-c85a9c1aacef','seguro',null),
 ('d7d8903d-a0aa-5b0b-b33a-fbfe25d38895','moderacion','En cantidades pequeñas'),
 ('137c0e5a-c737-5698-9aa3-69c97353f9df','moderacion','Alto en azúcar natural'),
 ('75614b72-ef41-561c-ae71-4a7f7c7278ba','seguro','Sin semillas'),
 ('b76f49e7-d59c-5df3-bac6-a586cd9be8e7','seguro',null),
 ('649c1516-adfc-50db-93d5-b46c5d442fb8','moderacion','Sin azúcar ni edulcorantes'),
 ('9c2646bd-49ca-55fc-be63-37981d4fa197','seguro',null),
 ('f015c273-e2a5-5b50-b282-8bf09c830f49','seguro',null),
 ('fe559365-159c-54f6-ac1f-548fcec71cfc','evitar','No apta para perros'),
 ('fc8c8231-d2ab-5f2b-9818-1aef539e19d1','evitar','No apta para perros'),
 ('de3e71e7-3267-5c33-87c7-ce38ac9b7260','evitar','No apto para perros')
on conflict (ingredient_id) do nothing;

-- 3. Catálogo base: recetas
insert into public.recipes (id, slug, title, image_url, category, minutes, servings, needs_oven, benefit, storage, steps, published, views) values
 ('fce62a62-984d-5d8a-8252-da14d8ad6912','pollo-arroz-zanahoria','Pollo con arroz y zanahoria','/images/recipes/pollo-arroz.jpg','principal',20,2,false,'Comida suave y equilibrada, ideal para el día a día.','Refrigerar hasta 3 días en recipiente hermético.',
  array['Cocina el pollo en agua sin sal hasta que esté completamente cocido.','Cocina el arroz por separado y deja enfriar.','Hierve la zanahoria en cubos hasta que esté suave.','Desmenuza el pollo y mezcla todo con un chorrito de aceite de oliva.','Sirve a temperatura ambiente.'],true,1240),
 ('916c05c8-c62d-5613-9ee8-90f6ca38be83','galletas-avena-calabaza','Galletas de avena y calabaza','/images/recipes/galletas-avena.jpg','premio',30,12,true,'Premios caseros con fibra, perfectos para el entrenamiento.','Frasco hermético hasta 7 días.',
  array['Precalienta el horno a 180 °C.','Mezcla la avena con el puré de calabaza y el huevo.','Forma bolitas y aplánalas sobre una bandeja con papel para hornear.','Hornea 20 minutos y deja enfriar completamente antes de servir.'],true,980),
 ('b28e517d-bafe-5022-b7ce-3aeb7436af80','salmon-con-camote','Salmón con camote y ejotes','/images/recipes/salmon-camote.jpg','principal',25,2,false,'Aporta grasas buenas y un sabor que encanta.','Refrigerar hasta 2 días.',
  array['Cuece el salmón al vapor sin condimentos y retira todas las espinas.','Cocina el camote hasta que esté suave y haz un puré.','Cuece los ejotes y córtalos en trozos pequeños.','Mezcla y sirve tibio.'],true,764),
 ('1005ae09-a015-5ae0-99c1-3b49f26fa8aa','helado-de-platano','Helado de plátano y yogur','/images/recipes/helado-platano.jpg','snack',5,6,false,'Refrescante para los días calurosos.','Congelador hasta 30 días.',
  array['Machaca el plátano hasta obtener un puré.','Mezcla con el yogur natural sin azúcar.','Vierte en moldes de silicona y congela 4 horas.'],true,1502),
 ('e580cdac-d2d1-5a2a-9044-17152c19f071','avena-con-manzana','Avena tibia con manzana','/images/recipes/galletas-avena.jpg','desayuno',10,2,false,'Desayuno ligero y fácil de digerir.','Refrigerar hasta 2 días.',
  array['Cocina la avena en agua hasta que espese.','Ralla la manzana sin semillas y agrégala.','Deja enfriar antes de servir.'],true,431),
 ('5e188fe2-d3f1-5bc5-a962-9701c186f3ad','pavo-con-calabaza','Pavo con calabaza y arroz','/images/recipes/pollo-arroz.jpg','principal',20,3,false,'Proteína magra con vegetales suaves.','Refrigerar hasta 3 días.',
  array['Cocina el pavo molido en una sartén sin aceite ni sal.','Cuece la calabaza y el arroz por separado.','Mezcla todo y sirve tibio.'],true,655),
 ('ef124d19-d43d-56b3-b93c-be10d84fc582','bocados-de-arandano','Bocados de arándano y avena','/images/recipes/helado-platano.jpg','premio',10,10,false,'Premios pequeños con antioxidantes naturales.','Refrigerar hasta 5 días.',
  array['Tritura los arándanos con la avena.','Forma bolitas pequeñas con las manos.','Refrigera 1 hora antes de servir.'],true,288),
 ('088830b0-a11e-55d2-84e1-e85066625bc1','caldo-hidratante','Caldo hidratante de pollo','/images/recipes/salmon-camote.jpg','hidratacion',20,4,false,'Ayuda a que tome más líquidos en días de calor.','Refrigerar hasta 3 días o congelar en cubos.',
  array['Hierve el pollo en agua sin sal ni condimentos durante 20 minutos.','Cuela el caldo y deja enfriar completamente.','Sirve solo o mezclado con su comida.'],false,96)
on conflict (id) do nothing;

insert into public.recipe_ingredients (recipe_id, ingredient_id, name, quantity, unit) values
 ('fce62a62-984d-5d8a-8252-da14d8ad6912','f3c52d07-83af-58b3-ae8f-6dca00427d9a','Pollo',200,'g'),
 ('fce62a62-984d-5d8a-8252-da14d8ad6912','dcaf434d-4941-51ea-8a10-01f03ee8fe82','Arroz',100,'g'),
 ('fce62a62-984d-5d8a-8252-da14d8ad6912','2b87f7ac-3b5c-55ee-99da-50b0b70ca38c','Zanahoria',1,'pza'),
 ('fce62a62-984d-5d8a-8252-da14d8ad6912','9c2646bd-49ca-55fc-be63-37981d4fa197','Aceite de oliva',1,'cda'),
 ('916c05c8-c62d-5613-9ee8-90f6ca38be83','95fa9c2b-4bd2-5bab-8b63-b6044cfacb6f','Avena',150,'g'),
 ('916c05c8-c62d-5613-9ee8-90f6ca38be83','e7ee6c51-2474-5cc4-97ce-2c4d1486bccb','Calabaza',120,'g'),
 ('916c05c8-c62d-5613-9ee8-90f6ca38be83','6781a824-e4b5-5dde-a6d4-85d08f1b2a30','Huevo',1,'pza'),
 ('b28e517d-bafe-5022-b7ce-3aeb7436af80','c4b145ec-af08-5428-ad95-f91bbaf7f40a','Salmón',180,'g'),
 ('b28e517d-bafe-5022-b7ce-3aeb7436af80','b84e5395-178e-595b-9052-2664df898ab0','Camote',150,'g'),
 ('b28e517d-bafe-5022-b7ce-3aeb7436af80','6f3df343-15c8-5079-b4cb-c85a9c1aacef','Ejotes',80,'g'),
 ('1005ae09-a015-5ae0-99c1-3b49f26fa8aa','137c0e5a-c737-5698-9aa3-69c97353f9df','Plátano',1,'pza'),
 ('1005ae09-a015-5ae0-99c1-3b49f26fa8aa','649c1516-adfc-50db-93d5-b46c5d442fb8','Yogur natural',150,'g'),
 ('e580cdac-d2d1-5a2a-9044-17152c19f071','95fa9c2b-4bd2-5bab-8b63-b6044cfacb6f','Avena',80,'g'),
 ('e580cdac-d2d1-5a2a-9044-17152c19f071','75614b72-ef41-561c-ae71-4a7f7c7278ba','Manzana',1,'pza'),
 ('e580cdac-d2d1-5a2a-9044-17152c19f071','f015c273-e2a5-5b50-b282-8bf09c830f49','Semillas de chía',1,'cdta'),
 ('5e188fe2-d3f1-5bc5-a962-9701c186f3ad','821394c5-81ee-5233-8b61-6060957b0939','Pavo',220,'g'),
 ('5e188fe2-d3f1-5bc5-a962-9701c186f3ad','e7ee6c51-2474-5cc4-97ce-2c4d1486bccb','Calabaza',120,'g'),
 ('5e188fe2-d3f1-5bc5-a962-9701c186f3ad','dcaf434d-4941-51ea-8a10-01f03ee8fe82','Arroz',90,'g'),
 ('ef124d19-d43d-56b3-b93c-be10d84fc582','b76f49e7-d59c-5df3-bac6-a586cd9be8e7','Arándanos',80,'g'),
 ('ef124d19-d43d-56b3-b93c-be10d84fc582','95fa9c2b-4bd2-5bab-8b63-b6044cfacb6f','Avena',100,'g'),
 ('088830b0-a11e-55d2-84e1-e85066625bc1','f3c52d07-83af-58b3-ae8f-6dca00427d9a','Pollo',150,'g'),
 ('088830b0-a11e-55d2-84e1-e85066625bc1','2b87f7ac-3b5c-55ee-99da-50b0b70ca38c','Zanahoria',1,'pza')
on conflict do nothing;