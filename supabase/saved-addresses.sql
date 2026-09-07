-- ============================================================
-- Direcciones guardadas por cada cliente
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

create table if not exists public.saved_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'Mi dirección',
  address text not null,
  reference text,
  created_at timestamptz not null default now()
);

alter table public.saved_addresses enable row level security;

-- Cada usuario administra sus propias direcciones.
create policy "adr_insert_own" on public.saved_addresses
  for insert with check (auth.uid() = user_id);

create policy "adr_select_own" on public.saved_addresses
  for select using (auth.uid() = user_id);

create policy "adr_delete_own" on public.saved_addresses
  for delete using (auth.uid() = user_id);

create index if not exists saved_addresses_user_idx
  on public.saved_addresses (user_id);