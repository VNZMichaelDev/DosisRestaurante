-- ============================================================
--  DOSIS · MENÚ ADMINISTRABLE + BANNER  (parte 2)
--  Ejecutar una sola vez en: Supabase Dashboard > SQL Editor
--
--  Contenido:
--    1. Tabla products (menú que controlas desde el panel)
--    2. Tabla settings (banner del hero: foto + textos)
--    3. Políticas RLS
--    4. Seed del menú actual (solo si products está vacía)
--    5. Realtime para products
-- ============================================================

-- ------------------------------------------------------------
-- 1. PRODUCTOS (image_url = foto del producto, se sube por URL.
--    Si está vacía, la app muestra el icono de la columna icon)
-- ------------------------------------------------------------
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

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at
  before update on public.products
  for each row execute procedure public.handle_updated_at();

-- ------------------------------------------------------------
-- 2. AJUSTES (banner del hero)
--    keys: hero_image_url, hero_eyebrow, hero_title,
--          hero_accent, hero_text
-- ------------------------------------------------------------
create table if not exists public.settings (
  key   text primary key,
  value text
);

-- ------------------------------------------------------------
-- 3. RLS
-- ------------------------------------------------------------
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
-- 4. SEED: menú inicial (solo si products está vacía).
--    Luego editas todo desde el panel.
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
-- 5. REALTIME para products (menú en vivo)
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
