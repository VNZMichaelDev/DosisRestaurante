-- ============================================================
--  DOSIS · Migración: columna stock en products
--  Ejecutar en: Supabase Dashboard > SQL Editor
--
--  stock: integer nullable
--    null  = sin control de stock (siempre disponible)
--    0     = agotado
--    > 0   = unidades disponibles
-- ============================================================

-- 1. Agregar columna stock
alter table public.products
  add column if not exists stock integer default null;

-- 2. Comentario para claridad
comment on column public.products.stock is
  'null=sin control (disponible), 0=agotado, >0=unidades disponibles';

-- 3. Decremento atómico de stock al confirmar pedido
create or replace function public.decrement_stock(
  p_product_id uuid,
  p_qty int
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.products
  set stock = stock - p_qty
  where id = p_product_id
    and stock is not null
    and stock >= p_qty;
end;
$$;
