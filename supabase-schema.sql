-- Esquema de la Comunidad Metales Julio para Supabase.
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query > Run.
-- Es seguro volver a correr este script completo aunque ya lo hayas corrido
-- antes (usa "if not exists" / "or replace" / "drop ... if exists" en todo).
--
-- Antes de correr esto, en Authentication > Sign In / Providers > Email,
-- desactivá "Confirm email".

create extension if not exists "pgcrypto";

-- La vista vieja depende de la columna actividades que vamos a borrar más
-- abajo, así que hay que sacarla de en medio primero.
drop view if exists public.directorio_publico;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  apellido text not null,
  dni text not null unique,
  cuit text,
  email text not null,
  ubicacion text,
  descripcion text,
  whatsapp text,
  instagram text,
  contacto_email text,
  created_at timestamptz not null default now()
);

-- Vestigio de una versión anterior donde la actividad vivía en el perfil;
-- ahora cada publicación tiene su propia categoría.
alter table public.profiles drop column if exists actividades;

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

-- Publicaciones: los trabajos/artesanías puntuales que publica cada persona.
-- Una persona (profiles) puede tener muchas publicaciones.
create table if not exists public.publicaciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  titulo text not null,
  categoria text not null,
  descripcion text,
  created_at timestamptz not null default now()
);

alter table public.publicaciones enable row level security;

drop policy if exists "select_own_publicaciones" on public.publicaciones;
create policy "select_own_publicaciones"
  on public.publicaciones for select
  using (auth.uid() = user_id);

drop policy if exists "insert_own_publicaciones" on public.publicaciones;
create policy "insert_own_publicaciones"
  on public.publicaciones for insert
  with check (auth.uid() = user_id);

drop policy if exists "update_own_publicaciones" on public.publicaciones;
create policy "update_own_publicaciones"
  on public.publicaciones for update
  using (auth.uid() = user_id);

drop policy if exists "delete_own_publicaciones" on public.publicaciones;
create policy "delete_own_publicaciones"
  on public.publicaciones for delete
  using (auth.uid() = user_id);

-- Vista de la comunidad: une cada publicación con los datos públicos de su
-- autor. Nunca incluye dni, cuit ni el email de la cuenta. Se otorga SOLO a
-- "authenticated": un visitante sin cuenta no puede leerla ni por API directa,
-- ni por rubro ni por nada.
create or replace view public.comunidad_publicaciones as
  select
    pub.id,
    pub.titulo,
    pub.categoria,
    pub.descripcion,
    pub.created_at,
    prof.id as autor_id,
    prof.nombre,
    prof.apellido,
    prof.ubicacion,
    prof.whatsapp,
    prof.instagram,
    prof.contacto_email
  from public.publicaciones pub
  join public.profiles prof on prof.id = pub.user_id;

revoke all on public.comunidad_publicaciones from anon;
grant select on public.comunidad_publicaciones to authenticated;

-- Conteo público de miembros: lo único visible sin cuenta. Es un número
-- (via una función security definer), nunca filas ni desglose por rubro.
create or replace function public.contar_miembros()
returns bigint
language sql
security definer
set search_path = public
as $$
  select count(*) from public.profiles;
$$;

grant execute on function public.contar_miembros() to anon, authenticated;
