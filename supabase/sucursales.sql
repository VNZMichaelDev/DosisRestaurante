-- ============================================================
-- Sucursales: pedidos por sede (Monay / Flor de Patria)
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- Columna de sede en los pedidos (monay | flor_patria)
alter table public.orders
  add column if not exists branch text;

-- Índice para filtrar pedidos por sede rápidamente
create index if not exists orders_branch_idx on public.orders (branch);

-- Pedidos existentes quedan asignados a Monay por defecto
update public.orders
set branch = 'monay'
where branch is null;
