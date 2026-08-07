-- ============================================================
-- Entrega de pedidos: dirección para saber a dónde llevar
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

alter table public.orders
  add column if not exists delivery_type text default 'delivery';
alter table public.orders
  add column if not exists delivery_address text;
alter table public.orders
  add column if not exists delivery_reference text;