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

-- Suspensión temporal de miembros: si suspendido_hasta está en el futuro, la
-- persona está suspendida. No hace falta un cron para "levantar" la
-- suspensión: se compara contra now() en cada lectura. Va acá arriba (y no
-- más abajo) porque las políticas de "publicaciones" ya la necesitan.
alter table public.profiles add column if not exists suspendido_hasta timestamptz;

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

-- No deja insertar si la persona está suspendida (chequeo a nivel de base de
-- datos, no solo en la interfaz: alguien suspendido no puede publicar aunque
-- llame a la API directamente).
drop policy if exists "insert_own_publicaciones" on public.publicaciones;
create policy "insert_own_publicaciones"
  on public.publicaciones for insert
  with check (
    auth.uid() = user_id
    and not exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.suspendido_hasta is not null and p.suspendido_hasta > now()
    )
  );

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

-- Actualizamos la vista de la comunidad para que las publicaciones de
-- alguien suspendido no aparezcan en el buscador mientras dure la suspensión.
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
  join public.profiles prof on prof.id = pub.user_id
  where prof.suspendido_hasta is null or prof.suspendido_hasta < now();

revoke all on public.comunidad_publicaciones from anon;
grant select on public.comunidad_publicaciones to authenticated;

-- Súper admins: quiénes pueden ver el panel de administración de la
-- comunidad. Nadie puede leer esta tabla directamente vía API (no tiene
-- política de select); solo se consulta indirectamente a través de
-- es_super_admin(), que es security definer.
create table if not exists public.super_admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

alter table public.super_admins enable row level security;

create or replace function public.es_super_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(select 1 from public.super_admins where user_id = auth.uid());
$$;

grant execute on function public.es_super_admin() to authenticated;

-- Listado completo de miembros para el panel de admin, incluida su última
-- conexión (auth.users.last_sign_in_at no es accesible directo vía API; esta
-- función security definer lo expone, pero solo devuelve filas si quien
-- llama es super admin).
create or replace function public.admin_listar_miembros()
returns table (
  id uuid,
  nombre text,
  apellido text,
  dni text,
  email text,
  ubicacion text,
  created_at timestamptz,
  ultima_conexion timestamptz,
  suspendido_hasta timestamptz
)
language sql
security definer
set search_path = public
as $$
  select p.id, p.nombre, p.apellido, p.dni, p.email, p.ubicacion, p.created_at,
         u.last_sign_in_at, p.suspendido_hasta
  from public.profiles p
  join auth.users u on u.id = p.id
  where public.es_super_admin();
$$;

grant execute on function public.admin_listar_miembros() to authenticated;

-- Suspender (o reactivar, pasando hasta = null) a un miembro. Verifica adentro
-- que quien llama sea super admin; si no lo es, no hace nada y no rompe nada
-- (no se usa RLS acá porque profiles.update ya está limitado al dueño de la
-- fila, así que un admin necesita esta función para poder tocar filas ajenas).
create or replace function public.admin_suspender_usuario(target_id uuid, hasta timestamptz)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.es_super_admin() then
    raise exception 'No autorizado';
  end if;
  update public.profiles set suspendido_hasta = hasta where id = target_id;
end;
$$;

grant execute on function public.admin_suspender_usuario(uuid, timestamptz) to authenticated;

-- Elimina el perfil de un miembro (y en cascada sus publicaciones). OJO: esto
-- NO elimina la cuenta de autenticación (auth.users) -- eso requiere la
-- service_role key, que nunca debe vivir en el cliente. La persona podría
-- volver a entrar, pero sin perfil (se le pediría completarlo de nuevo). Para
-- borrar la cuenta de verdad, hay que hacerlo a mano desde Supabase Dashboard
-- > Authentication > Users.
create or replace function public.admin_eliminar_perfil(target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.es_super_admin() then
    raise exception 'No autorizado';
  end if;
  delete from public.profiles where id = target_id;
end;
$$;

grant execute on function public.admin_eliminar_perfil(uuid) to authenticated;

-- Estadísticas para los gráficos del panel de admin.
create or replace function public.admin_stats_categorias()
returns table (categoria text, cantidad bigint)
language sql
security definer
set search_path = public
as $$
  select categoria, count(*) as cantidad
  from public.publicaciones
  where public.es_super_admin()
  group by categoria
  order by cantidad desc;
$$;

grant execute on function public.admin_stats_categorias() to authenticated;

create or replace function public.admin_stats_altas_por_dia()
returns table (dia date, cantidad bigint)
language sql
security definer
set search_path = public
as $$
  select date_trunc('day', created_at)::date as dia, count(*) as cantidad
  from public.profiles
  where public.es_super_admin()
  group by dia
  order by dia;
$$;

grant execute on function public.admin_stats_altas_por_dia() to authenticated;

-- Después de correr todo lo de arriba, para convertir a alguien en súper
-- admin: que se registre normalmente en el sitio con su email, y después
-- correr (reemplazando el email):
--
-- insert into public.super_admins (user_id)
-- select id from auth.users where email = 'bruno@metalesjulio.com.ar'
-- on conflict (user_id) do nothing;
