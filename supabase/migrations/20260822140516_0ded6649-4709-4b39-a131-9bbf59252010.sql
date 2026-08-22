-- ENUMS
create type public.app_role as enum ('admin','user');
create type public.plan_id as enum ('trial','basico','familiar','premium');
create type public.dog_sex as enum ('macho','hembra');
create type public.weight_unit as enum ('kg','lb');
create type public.activity_level as enum ('bajo','moderado','alto');
create type public.ingredient_category as enum ('proteina','vegetal','cereal','fruta','grasa','suplemento');
create type public.safety_level as enum ('seguro','moderacion','evitar');
create type public.recipe_category as enum ('desayuno','principal','snack','premio','hidratacion');
create type public.chat_role as enum ('user','assistant');

-- updated_at helper
create or replace function public.update_updated_at_column()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text not null default '',
  avatar_url text,
  plan public.plan_id not null default 'trial',
  trial_ends_at timestamptz not null default (now() + interval '3 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (auth.uid() = id);
create trigger profiles_updated_at before update on public.profiles for each row execute function public.update_updated_at_column();

-- USER ROLES
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "user_roles_select_own" on public.user_roles for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));

-- signup trigger
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (new.id, new.email,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email,''),'@',1)),
    new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- DOGS
create table public.dogs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  photo_url text,
  sex public.dog_sex not null default 'macho',
  age_years numeric not null default 1,
  birth_date date,
  weight numeric not null default 10,
  weight_unit public.weight_unit not null default 'kg',
  breed text not null default '',
  activity_level public.activity_level not null default 'moderado',
  goal text not null default '',
  favorite_ingredients text[] not null default '{}',
  disliked_ingredients text[] not null default '{}',
  forbidden_ingredients text[] not null default '{}',
  allergies text[] not null default '{}',
  cooking_time text not null default '20',
  has_oven boolean not null default true,
  weekly_budget numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.dogs to authenticated;
grant all on public.dogs to service_role;
alter table public.dogs enable row level security;
create policy "dogs_own_all" on public.dogs for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "dogs_admin_select" on public.dogs for select to authenticated using (public.has_role(auth.uid(),'admin'));
create trigger dogs_updated_at before update on public.dogs for each row execute function public.update_updated_at_column();

-- INGREDIENTS
create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category public.ingredient_category not null default 'proteina',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.ingredients to authenticated, anon;
grant insert, update, delete on public.ingredients to authenticated;
grant all on public.ingredients to service_role;
alter table public.ingredients enable row level security;
create policy "ingredients_read_all" on public.ingredients for select to authenticated, anon using (true);
create policy "ingredients_admin_write" on public.ingredients for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger ingredients_updated_at before update on public.ingredients for each row execute function public.update_updated_at_column();

create table public.ingredient_safety (
  id uuid primary key default gen_random_uuid(),
  ingredient_id uuid not null unique references public.ingredients(id) on delete cascade,
  safety public.safety_level not null default 'seguro',
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.ingredient_safety to authenticated, anon;
grant insert, update, delete on public.ingredient_safety to authenticated;
grant all on public.ingredient_safety to service_role;
alter table public.ingredient_safety enable row level security;
create policy "ingredient_safety_read_all" on public.ingredient_safety for select to authenticated, anon using (true);
create policy "ingredient_safety_admin_write" on public.ingredient_safety for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger ingredient_safety_updated_at before update on public.ingredient_safety for each row execute function public.update_updated_at_column();

-- RECIPES
create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  image_url text,
  category public.recipe_category not null default 'principal',
  minutes int not null default 15,
  servings int not null default 2,
  needs_oven boolean not null default false,
  benefit text not null default '',
  storage text not null default '',
  steps text[] not null default '{}',
  published boolean not null default false,
  views int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.recipes to authenticated, anon;
grant insert, update, delete on public.recipes to authenticated;
grant all on public.recipes to service_role;
alter table public.recipes enable row level security;
create policy "recipes_read_published" on public.recipes for select to authenticated, anon using (published or public.has_role(auth.uid(),'admin'));
create policy "recipes_admin_write" on public.recipes for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger recipes_updated_at before update on public.recipes for each row execute function public.update_updated_at_column();

create table public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  ingredient_id uuid references public.ingredients(id) on delete set null,
  name text not null,
  quantity numeric not null default 1,
  unit text not null default 'g',
  created_at timestamptz not null default now()
);
grant select on public.recipe_ingredients to authenticated, anon;
grant insert, update, delete on public.recipe_ingredients to authenticated;
grant all on public.recipe_ingredients to service_role;
alter table public.recipe_ingredients enable row level security;
create policy "recipe_ingredients_read_all" on public.recipe_ingredients for select to authenticated, anon using (true);
create policy "recipe_ingredients_admin_write" on public.recipe_ingredients for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- FAVORITES / PREPARED / DAILY
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, recipe_id)
);
grant select, insert, delete on public.favorites to authenticated;
grant all on public.favorites to service_role;
alter table public.favorites enable row level security;
create policy "favorites_own_all" on public.favorites for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.prepared_recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  dog_id uuid references public.dogs(id) on delete set null,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  prepared_at timestamptz not null default now()
);
grant select, insert, delete on public.prepared_recipes to authenticated;
grant all on public.prepared_recipes to service_role;
alter table public.prepared_recipes enable row level security;
create policy "prepared_own_all" on public.prepared_recipes for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.daily_recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  dog_id uuid references public.dogs(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  date date not null default current_date,
  created_at timestamptz not null default now(),
  unique (user_id, dog_id, date)
);
grant select, insert, update, delete on public.daily_recipes to authenticated;
grant all on public.daily_recipes to service_role;
alter table public.daily_recipes enable row level security;
create policy "daily_recipes_own_all" on public.daily_recipes for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- WEEKLY PLANS
create table public.weekly_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  dog_id uuid references public.dogs(id) on delete cascade,
  week_start date not null default current_date,
  days jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.weekly_plans to authenticated;
grant all on public.weekly_plans to service_role;
alter table public.weekly_plans enable row level security;
create policy "weekly_plans_own_all" on public.weekly_plans for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create trigger weekly_plans_updated_at before update on public.weekly_plans for each row execute function public.update_updated_at_column();

-- SHOPPING
create table public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.shopping_lists to authenticated;
grant all on public.shopping_lists to service_role;
alter table public.shopping_lists enable row level security;
create policy "shopping_lists_own_all" on public.shopping_lists for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create trigger shopping_lists_updated_at before update on public.shopping_lists for each row execute function public.update_updated_at_column();

create table public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.shopping_lists(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  quantity numeric not null default 1,
  unit text not null default 'g',
  category public.ingredient_category not null default 'proteina',
  owned boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.shopping_items to authenticated;
grant all on public.shopping_items to service_role;
alter table public.shopping_items enable row level security;
create policy "shopping_items_own_all" on public.shopping_items for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.pantry_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);
grant select, insert, update, delete on public.pantry_items to authenticated;
grant all on public.pantry_items to service_role;
alter table public.pantry_items enable row level security;
create policy "pantry_own_all" on public.pantry_items for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- SUBSCRIPTIONS
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  plan public.plan_id not null default 'trial',
  status text not null default 'trialing',
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.subscriptions to authenticated;
grant all on public.subscriptions to service_role;
alter table public.subscriptions enable row level security;
create policy "subscriptions_select_own" on public.subscriptions for select to authenticated using (auth.uid() = user_id);
create trigger subscriptions_updated_at before update on public.subscriptions for each row execute function public.update_updated_at_column();

-- NOTIFICATIONS
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null default '',
  read boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, update, delete on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "notifications_own_select" on public.notifications for select to authenticated using (auth.uid() = user_id);
create policy "notifications_own_update" on public.notifications for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notifications_own_delete" on public.notifications for delete to authenticated using (auth.uid() = user_id);

-- WEIGHT RECORDS
create table public.weight_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  dog_id uuid not null references public.dogs(id) on delete cascade,
  date date not null default current_date,
  weight numeric not null,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.weight_records to authenticated;
grant all on public.weight_records to service_role;
alter table public.weight_records enable row level security;
create policy "weight_records_own_all" on public.weight_records for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ACHIEVEMENTS
create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  title text not null,
  earned_at timestamptz not null default now(),
  unique (user_id, code)
);
grant select, insert on public.achievements to authenticated;
grant all on public.achievements to service_role;
alter table public.achievements enable row level security;
create policy "achievements_own_all" on public.achievements for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- AI CONVERSATIONS
create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  dog_id uuid references public.dogs(id) on delete set null,
  title text not null default 'Chef IA',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.ai_conversations to authenticated;
grant all on public.ai_conversations to service_role;
alter table public.ai_conversations enable row level security;
create policy "ai_conversations_own_all" on public.ai_conversations for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create trigger ai_conversations_updated_at before update on public.ai_conversations for each row execute function public.update_updated_at_column();

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.chat_role not null,
  content text not null,
  recipe_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.ai_messages to authenticated;
grant all on public.ai_messages to service_role;
alter table public.ai_messages enable row level security;
create policy "ai_messages_own_all" on public.ai_messages for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- INDEXES
create index on public.dogs(user_id);
create index on public.recipe_ingredients(recipe_id);
create index on public.favorites(user_id);
create index on public.shopping_items(list_id);
create index on public.ai_messages(conversation_id);