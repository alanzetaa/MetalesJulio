-- Esquema de la Comunidad Metales Julio para Supabase.
-- Ejecutar UNA sola vez en: Supabase Dashboard > SQL Editor > New query > Run.
--
-- Antes de correr esto, en Authentication > Providers > Email, desactivá
-- "Confirm email". Si queda activado, el registro no puede crear el perfil
-- en el mismo paso porque todavía no hay sesión activa hasta que la persona
-- confirma el mail.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  apellido text not null,
  dni text not null unique,
  cuit text,
  email text not null,
  ubicacion text,
  descripcion text,
  actividades text[] not null default '{}',
  whatsapp text,
  instagram text,
  contacto_email text,
  created_at timestamptz not null default now()
);

create unique index if not exists profiles_cuit_unique_idx
  on public.profiles (cuit)
  where cuit is not null and cuit <> '';

alter table public.profiles enable row level security;

drop policy if exists "select_own_profile" on public.profiles;
create policy "select_own_profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "insert_own_profile" on public.profiles;
create policy "insert_own_profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "update_own_profile" on public.profiles;
create policy "update_own_profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Vista pública: solo columnas no sensibles. Nunca incluye dni, cuit ni el
-- email de la cuenta, así que nunca pueden filtrarse a otros usuarios.
create or replace view public.directorio_publico as
  select
    id,
    nombre,
    apellido,
    ubicacion,
    descripcion,
    actividades,
    whatsapp,
    instagram,
    contacto_email,
    created_at
  from public.profiles;

grant select on public.directorio_publico to anon, authenticated;
