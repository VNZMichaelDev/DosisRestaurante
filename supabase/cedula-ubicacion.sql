-- ============================================================
-- Cédula y ubicación (GPS): anti pedidos falsos
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- Cédula + coordenadas en el perfil del usuario
alter table public.profiles
  add column if not exists cedula text,
  add column if not exists lat double precision,
  add column if not exists lng double precision;

-- Coordenadas del punto de entrega en cada pedido
alter table public.orders
  add column if not exists lat double precision,
  add column if not exists lng double precision;

-- El trigger de registro ahora también guarda cédula y ubicación
-- que vienen del formulario (raw_user_meta_data).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, cedula, lat, lng, is_admin)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data->>'cedula', ''),
    nullif(new.raw_user_meta_data->>'lat', '')::double precision,
    nullif(new.raw_user_meta_data->>'lng', '')::double precision,
    -- (*) Correos que se crean como administradores:
    case when lower(new.email) = 'admin@dosis.com' then true else false end
  );
  return new;
end;
$$;
