-- ============================================================
--  DOSIS · Esquema de Supabase (PostgreSQL)
--  Ejecutar en: Supabase Dashboard > SQL Editor
--
--  Contenido:
--    1. Tabla de perfiles de usuario (profiles)
--    2. Tabla de pedidos (orders)
--    3. Triggers (perfil automático + updated_at)
--    4. Políticas RLS (Row Level Security)
--    5. Activación de Realtime para la tabla orders
-- ============================================================

-- ------------------------------------------------------------
-- 1. PERFILES (usuarios)
--    Se crea automáticamente cuando alguien se registra.
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  full_name  text,
  phone      text,
  is_admin   boolean not null default false,
  created_at timestamptz not null default now()
);

-- Trigger: al registrarse un usuario, creamos su perfil.
-- Cambia la lista de correos admin en la línea marcada (*) para
-- promover al dueño automáticamente.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, is_admin)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    -- (*) Correos que se crean como administradores:
    case when lower(new.email) = 'admin@dosis.com' then true else false end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------
-- 2. PEDIDOS
--    items es JSONB: [{"id","name","price","qty"}, ...]
--    Estado inicial: 'pendiente' (Pendiente por verificar).
-- ------------------------------------------------------------
create table if not exists public.orders (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  items             jsonb not null default '[]'::jsonb,
  total             numeric(12,2) not null default 0,
  payment_phone     text not null,              -- teléfono emisor del pago móvil
  payment_reference text not null,              -- últimos 6 dígitos de la referencia
  status            text not null default 'pendiente'
    check (status in ('pendiente', 'en_preparacion', 'en_camino', 'entregado', 'cancelado')),
  branch            text default 'monay'
    check (branch in ('monay', 'flor_patria')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_branch_idx on public.orders (branch);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

-- Trigger: actualiza updated_at en cada UPDATE
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at
  before update on public.orders
  for each row execute procedure public.handle_updated_at();

-- ------------------------------------------------------------
-- 3. ROW LEVEL SECURITY
-- ------------------------------------------------------------
-- Función helper: ¿el usuario autenticado es administrador?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_admin = true
  );
$$;

alter table public.profiles enable row level security;
alter table public.orders enable row level security;

-- --- Políticas de profiles ---
create policy "profiles: select propio"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: update propio"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles: insert propio"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles: admin puede leer todo"
  on public.profiles for select
  using (public.is_admin());

-- --- Políticas de orders ---
create policy "orders: el cliente crea su pedido"
  on public.orders for insert
  with check (auth.uid() = user_id);

create policy "orders: el cliente ve sus pedidos y el admin todos"
  on public.orders for select
  using (auth.uid() = user_id or public.is_admin());

create policy "orders: solo el admin actualiza estados"
  on public.orders for update
  using (public.is_admin());

-- ------------------------------------------------------------
-- 4. REALTIME
--    Publica la tabla orders para que llegue en vivo al panel
--    del admin y al tracking del cliente (sin recargar la página).
-- ------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;

-- ============================================================
--  NOTA PARA EL DUEÑO
--  ------------------
--  Si registras el dueño con otro correo, promuévelo con:
--
--     update public.profiles
--     set is_admin = true
--     where email = 'correo-del-dueno@gmail.com';
--
--  (Solo si el perfil ya existe; si no, primero registra el
--   usuario y luego ejecuta el UPDATE.)
-- ============================================================

-- ============================================================
-- 5. PRODUCTOS (menú administrable desde el panel)
--    image_url es la foto del producto (se sube por URL).
--    Si está vacía, la app muestra el icono (columna icon).
-- ============================================================
create table if not exists public.products (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  description text,
  price      numeric(10,2) not null default 0,
  category   text not null default 'cachapas'
    check (category in ('cachapas','burgers','perros','papas','parrilla','bebidas')),
  image_url  text,
  icon       text not null default 'cachapa'
    check (icon in ('cachapa','burger','hotdog','papas','parrilla','bebida')),
  tag        text check (tag in ('best','popular','save','new')),
  tag_label  text,
  rating     numeric(3,1) not null default 4.5,
  reviews    text not null default '0',
  active     boolean not null default true,
  sort       int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger updated_at para products
drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at
  before update on public.products
  for each row execute procedure public.handle_updated_at();

-- ------------------------------------------------------------
-- 6. AJUSTES (banner del hero: foto + textos)
--    key/value, ej: hero_image_url, hero_eyebrow, hero_title,
--    hero_accent, hero_text
-- ------------------------------------------------------------
create table if not exists public.settings (
  key   text primary key,
  value text
);

-- --- RLS: productos ---
alter table public.products enable row level security;

create policy "products: lectura de activos"
  on public.products for select
  using (active = true or public.is_admin());

create policy "products: admin inserta"
  on public.products for insert
  with check (public.is_admin());

create policy "products: admin actualiza"
  on public.products for update
  using (public.is_admin());

create policy "products: admin elimina"
  on public.products for delete
  using (public.is_admin());

-- --- RLS: settings ---
alter table public.settings enable row level security;

create policy "settings: lectura pública"
  on public.settings for select
  using (true);

create policy "settings: admin escribe"
  on public.settings for insert
  with check (public.is_admin());

create policy "settings: admin actualiza"
  on public.settings for update
  using (public.is_admin());

create policy "settings: admin elimina"
  on public.settings for delete
  using (public.is_admin());

-- ------------------------------------------------------------
-- 7. SEED: menú inicial (solo si la tabla products está vacía).
--    Desde el panel podrás editar precios, fotos, etiquetas,
--    agregar/ocultar productos.
-- ------------------------------------------------------------
insert into public.products (name, description, price, category, icon, tag, tag_label, rating, reviews, sort)
select * from (values
  ('Cachapa Dosis','Cachapa rellena de queso de mano y carne mechada', 8.5,  'cachapas','cachapa','best','Estrella',4.9,'3.2K',1),
  ('Cachapa de Queso','Cachapa de maíz tierno con queso de mano fundido', 6, 'cachapas','cachapa',null,null,4.7,'2.1K',2),
  ('Cachapa Catira','Cachapa con queso amarillo y mantequilla', 7.5, 'cachapas','cachapa',null,null,4.6,'1.5K',3),
  ('Cachapa Mixta','Cachapa con queso, carne mechada y jamón', 10, 'cachapas','cachapa',null,null,4.8,'2.4K',4),
  ('Burger Doble Dosis','Doble carne, queso cheddar, tocineta y papas', 9.99, 'burgers','burger','popular','Popular',4.7,'2.8K',5),
  ('Burger Clásica','Carne 100% res, queso americano y salsa de la casa', 7.5, 'burgers','burger',null,null,4.6,'1.9K',6),
  ('Burger BBQ','Carne a la parrilla, cebolla caramelizada y salsa BBQ', 8.99, 'burgers','burger',null,null,4.7,'1.2K',7),
  ('Burger de Pollo','Pechuga de pollo crocante, lechuga y mayo de la casa', 7.99, 'burgers','burger',null,null,4.5,'980',8),
  ('Perro Especial','Perro con todos los toppings + papas', 6.5, 'perros','hotdog','save','Ahorra 15%',4.6,'1.9K',9),
  ('Perro Sencillo','Salchicha, repollo, salsa de la casa y papa tostada', 4.5, 'perros','hotdog',null,null,4.4,'860',10),
  ('Perro Doble','Doble salchicha con queso y tocineta', 7.5, 'perros','hotdog',null,null,4.7,'740',11),
  ('Papas Fritas','Papas fritas crocantes con sal y toque de orégano', 3.5, 'papas','papas',null,null,4.5,'2.2K',12),
  ('Papa Asada','Papa al horno con mantequilla y queso', 4.5, 'papas','papas',null,null,4.6,'1.1K',13),
  ('Papas Cheddar y Tocineta','Papas fritas bañadas en cheddar y tocineta', 5.5, 'papas','papas',null,null,4.8,'1.6K',14),
  ('Parrillada Mixta','Carne, pollo y chorizo a la parrilla + guarniciones', 16.9, 'parrilla','parrilla','new','Nuevo',4.9,'980',15),
  ('Churrasco Completo','Churrasco con tostones, ensalada y chimichurri', 14.5, 'parrilla','parrilla',null,null,4.8,'720',16),
  ('Pechuga a la Plancha','Pechuga de pollo con guarniciones a elegir', 9.9, 'parrilla','parrilla',null,null,4.6,'640',17),
  ('Coca-Cola 500ml','Bebida gaseosa helada', 1.5, 'bebidas','bebida',null,null,4.5,'5.1K',18),
  ('Agua Mineral','Botella de agua 500ml', 1, 'bebidas','bebida',null,null,4.3,'2.8K',19),
  ('Jugo Natural','Naranja, parchita o piña', 2.5, 'bebidas','bebida',null,null,4.7,'1.4K',20),
  ('Malta','Malta Polar bien fría', 2, 'bebidas','bebida',null,null,4.6,'1.7K',21)
) as v(name, description, price, category, icon, tag, tag_label, rating, reviews, sort)
where not exists (select 1 from public.products);

-- ------------------------------------------------------------
-- 8. REALTIME también para products (el menú se actualiza en vivo)
-- ------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'products'
  ) then
    alter publication supabase_realtime add table public.products;
  end if;
end $$;

