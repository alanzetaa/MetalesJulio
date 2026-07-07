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

-- Provincia (solo eso, no la dirección completa) para mostrar en el
-- buscador de la comunidad: la dirección exacta de "ubicacion" es privada,
-- solo la ve el dueño del perfil (y HQ Metales). Se completa sola cuando la
-- persona elige una sugerencia de Nominatim al cargar su ubicación.
alter table public.profiles add column if not exists provincia text;

-- Backfill de una sola vez para perfiles que ya tenían "ubicacion" cargada
-- antes de que existiera esta columna (el formato ya generado por Nominatim
-- termina siempre en la provincia, separado por coma).
update public.profiles
set provincia = trim(split_part(ubicacion, ',', -1))
where provincia is null and ubicacion is not null and ubicacion <> '';

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

-- Tipo de publicación: si la persona ofrece un trabajo/artesanía o si está
-- buscando que alguien se lo haga/venda. Se usa para diferenciar visualmente
-- las tarjetas en el buscador.
alter table public.publicaciones add column if not exists tipo text not null default 'ofrezco';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'publicaciones_tipo_check'
  ) then
    alter table public.publicaciones
      add constraint publicaciones_tipo_check check (tipo in ('ofrezco', 'busco'));
  end if;
end $$;

-- Fotos opcionales de la publicación (hasta 3, el tope se valida en el
-- cliente): guarda los paths dentro del bucket de Storage (no la URL
-- completa), la URL pública se arma en el cliente con getPublicUrl() -- así,
-- si el bucket cambia de nombre algún día, no hay que migrar datos.
alter table public.publicaciones add column if not exists foto_paths text[] not null default '{}';

-- Migración de la columna vieja foto_path (una sola foto) a foto_paths
-- (array). Guardado con un chequeo de information_schema para que sea
-- idempotente: la segunda vez que se corre este script, foto_path ya no
-- existe y este bloque no hace nada. Hay que dropear antes la vista
-- comunidad_publicaciones porque en la base ya depende de foto_path -- se
-- vuelve a crear más abajo, en su sección, con las columnas nuevas.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'publicaciones' and column_name = 'foto_path'
  ) then
    drop view if exists public.comunidad_publicaciones;
    update public.publicaciones
    set foto_paths = array[foto_path]
    where foto_path is not null and cardinality(foto_paths) = 0;
    alter table public.publicaciones drop column foto_path;
  end if;
end $$;

-- Bucket público para las fotos de publicaciones: no son datos sensibles
-- (mismo nivel de privacidad que nombre/ubicación), así que no hace falta
-- URLs firmadas -- se sirven por URL pública directa.
insert into storage.buckets (id, name, public)
values ('publicaciones-fotos', 'publicaciones-fotos', true)
on conflict (id) do nothing;

-- Cada persona sube/reemplaza/borra solo dentro de su propia carpeta
-- ({user_id}/...) -- patrón estándar de Supabase Storage.
drop policy if exists "insert_own_foto" on storage.objects;
create policy "insert_own_foto" on storage.objects for insert
  with check (
    bucket_id = 'publicaciones-fotos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "update_own_foto" on storage.objects;
create policy "update_own_foto" on storage.objects for update
  using (
    bucket_id = 'publicaciones-fotos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "delete_own_foto" on storage.objects;
create policy "delete_own_foto" on storage.objects for delete
  using (
    bucket_id = 'publicaciones-fotos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "select_fotos_publicaciones" on storage.objects;
create policy "select_fotos_publicaciones" on storage.objects for select
  using (bucket_id = 'publicaciones-fotos');

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

-- Me gusta de una publicación (estilo Instagram). No es dato sensible, así
-- que cualquier miembro autenticado puede ver quién dio like; lo que sí está
-- restringido es que cada quien solo puede dar/sacar su propio like.
create table if not exists public.publicacion_likes (
  publicacion_id uuid not null references public.publicaciones (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (publicacion_id, user_id)
);

alter table public.publicacion_likes enable row level security;

drop policy if exists "select_likes" on public.publicacion_likes;
create policy "select_likes"
  on public.publicacion_likes for select
  using (true);

drop policy if exists "insert_own_like" on public.publicacion_likes;
create policy "insert_own_like"
  on public.publicacion_likes for insert
  with check (
    auth.uid() = user_id
    and not exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.suspendido_hasta is not null and p.suspendido_hasta > now()
    )
  );

drop policy if exists "delete_own_like" on public.publicacion_likes;
create policy "delete_own_like"
  on public.publicacion_likes for delete
  using (auth.uid() = user_id);

revoke all on public.publicacion_likes from anon;
grant select, insert, delete on public.publicacion_likes to authenticated;

-- Conteo de likes por publicación, para que "Mis publicaciones" (que
-- consulta la tabla publicaciones directo, no la vista de comunidad) pueda
-- traerlo con una sola query extra.
create or replace view public.publicaciones_likes_count as
  select publicacion_id, count(*) as cantidad
  from public.publicacion_likes
  group by publicacion_id;

revoke all on public.publicaciones_likes_count from anon;
grant select on public.publicaciones_likes_count to authenticated;

-- Mensajes privados entre miembros, siempre atados a una publicación (para
-- que quien recibe sepa a cuál se refiere si tiene varias). No hay tabla de
-- "conversaciones": el hilo se arma en el cliente agrupando por
-- (publicacion_id, la otra persona).
create table if not exists public.mensajes (
  id uuid primary key default gen_random_uuid(),
  publicacion_id uuid not null references public.publicaciones (id) on delete cascade,
  remitente_id uuid not null references auth.users (id) on delete cascade,
  destinatario_id uuid not null references auth.users (id) on delete cascade,
  cuerpo text not null,
  created_at timestamptz not null default now(),
  leido_at timestamptz,
  constraint mensajes_no_autoenvio check (remitente_id <> destinatario_id)
);

alter table public.mensajes enable row level security;

drop policy if exists "select_mis_mensajes" on public.mensajes;
create policy "select_mis_mensajes"
  on public.mensajes for select
  using (auth.uid() = remitente_id or auth.uid() = destinatario_id);

drop policy if exists "insert_mensajes" on public.mensajes;
create policy "insert_mensajes"
  on public.mensajes for insert
  with check (
    auth.uid() = remitente_id
    and not exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.suspendido_hasta is not null and p.suspendido_hasta > now()
    )
  );

-- El destinatario puede marcar un mensaje como leído, pero no puede
-- reescribir su contenido: se restringe el update a nivel de columna,
-- además de la política de RLS.
revoke update on public.mensajes from authenticated;
grant update (leido_at) on public.mensajes to authenticated;

drop policy if exists "marcar_leido" on public.mensajes;
create policy "marcar_leido"
  on public.mensajes for update
  using (auth.uid() = destinatario_id)
  with check (auth.uid() = destinatario_id);

grant select, insert on public.mensajes to authenticated;
revoke all on public.mensajes from anon;

-- Vista con los datos de nombre/apellido de ambas puntas y el título de la
-- publicación, para no tener que exponer profiles.select a cualquiera: el
-- "where" de acá adentro reemplaza a la RLS de profiles/mensajes (mismo
-- mecanismo que ya usa comunidad_publicaciones).
create or replace view public.mensajes_detalle as
  select
    m.id, m.publicacion_id, m.remitente_id, m.destinatario_id, m.cuerpo, m.created_at, m.leido_at,
    pub.titulo as publicacion_titulo,
    rem.nombre as remitente_nombre, rem.apellido as remitente_apellido,
    dest.nombre as destinatario_nombre, dest.apellido as destinatario_apellido
  from public.mensajes m
  join public.publicaciones pub on pub.id = m.publicacion_id
  join public.profiles rem on rem.id = m.remitente_id
  join public.profiles dest on dest.id = m.destinatario_id
  where m.remitente_id = auth.uid() or m.destinatario_id = auth.uid();

revoke all on public.mensajes_detalle from anon;
grant select on public.mensajes_detalle to authenticated;

-- Registro de "contactos" (clicks reales en WhatsApp/Instagram/email desde
-- el modal de contacto), para que HQ Metales pueda medir cuánto tráfico le
-- genera la comunidad a cada persona. Es analítica interna: no tiene
-- política de select para usuarios normales (mismo patrón que
-- super_admins), solo se lee a través de funciones de admin.
create table if not exists public.contactos (
  id uuid primary key default gen_random_uuid(),
  publicacion_id uuid not null references public.publicaciones (id) on delete cascade,
  autor_id uuid not null references auth.users (id) on delete cascade,
  visitante_id uuid not null references auth.users (id) on delete cascade,
  medio text not null check (medio in ('whatsapp', 'instagram', 'email')),
  created_at timestamptz not null default now()
);

alter table public.contactos enable row level security;

drop policy if exists "insert_propio_contacto" on public.contactos;
create policy "insert_propio_contacto"
  on public.contactos for insert
  with check (auth.uid() = visitante_id);

revoke all on public.contactos from anon;
grant insert on public.contactos to authenticated;

-- Vista de la comunidad: une cada publicación con los datos públicos de su
-- autor. Nunca incluye dni, cuit ni el email de la cuenta -- **ni la
-- dirección exacta**: solo se expone "provincia" (ej. "CABA"), nunca
-- "ubicacion" completa (eso quedó guardando la dirección con calle y altura,
-- que solo debe ver el dueño del perfil y HQ Metales). Se otorga SOLO a
-- "authenticated": un visitante sin cuenta no puede leerla ni por API directa,
-- ni por rubro ni por nada. Tampoco muestra publicaciones de alguien
-- suspendido mientras dure la suspensión.
-- Se dropea antes de recrear (en vez de "create or replace") porque Postgres
-- no permite reordenar/insertar/cambiar columnas en el medio de una vista
-- existente con "or replace", solo agregar al final.
drop view if exists public.comunidad_publicaciones;
create view public.comunidad_publicaciones as
  select
    pub.id,
    pub.titulo,
    pub.categoria,
    pub.descripcion,
    pub.tipo,
    pub.created_at,
    prof.id as autor_id,
    prof.nombre,
    prof.apellido,
    prof.provincia,
    prof.whatsapp,
    prof.instagram,
    prof.contacto_email,
    pub.foto_paths,
    (select count(*) from public.publicacion_likes pl where pl.publicacion_id = pub.id) as likes_count
  from public.publicaciones pub
  join public.profiles prof on prof.id = pub.user_id
  where prof.suspendido_hasta is null or prof.suspendido_hasta < now();

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

-- Gestión de súper admins desde HQ Metales (sección "Seguridad"), para no
-- depender de correr un insert a mano en el SQL Editor cada vez.
create or replace function public.admin_listar_super_admins()
returns table (user_id uuid, nombre text, apellido text, email text)
language sql
security definer
set search_path = public
as $$
  select sa.user_id, p.nombre, p.apellido, p.email
  from public.super_admins sa
  join public.profiles p on p.id = sa.user_id
  where public.es_super_admin();
$$;

grant execute on function public.admin_listar_super_admins() to authenticated;

create or replace function public.admin_agregar_super_admin(target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.es_super_admin() then
    raise exception 'No autorizado';
  end if;
  insert into public.super_admins (user_id) values (target_id)
  on conflict (user_id) do nothing;
end;
$$;

grant execute on function public.admin_agregar_super_admin(uuid) to authenticated;

-- No deja quitar al último súper admin, para que la comunidad nunca se
-- quede sin nadie que pueda entrar a HQ Metales.
create or replace function public.admin_quitar_super_admin(target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.es_super_admin() then
    raise exception 'No autorizado';
  end if;
  if (select count(*) from public.super_admins) <= 1 then
    raise exception 'No se puede quitar al último súper admin';
  end if;
  delete from public.super_admins where user_id = target_id;
end;
$$;

grant execute on function public.admin_quitar_super_admin(uuid) to authenticated;

grant execute on function public.es_super_admin() to authenticated;

-- Listado completo de miembros para el panel de admin, incluida su última
-- conexión (auth.users.last_sign_in_at no es accesible directo vía API; esta
-- función security definer lo expone, pero solo devuelve filas si quien
-- llama es super admin).
-- Se dropea antes de recrear porque Postgres no permite cambiar el "returns
-- table" de una función existente con "or replace" (a diferencia de las
-- vistas, acá ni siquiera se puede agregar una columna al final).
drop function if exists public.admin_listar_miembros();
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
  suspendido_hasta timestamptz,
  mensajes_recibidos bigint,
  contactos_recibidos bigint,
  whatsapp text,
  instagram text,
  contacto_email text
)
language sql
security definer
set search_path = public
as $$
  select p.id, p.nombre, p.apellido, p.dni, p.email, p.ubicacion, p.created_at,
         u.last_sign_in_at, p.suspendido_hasta,
         (select count(*) from public.mensajes m where m.destinatario_id = p.id),
         (select count(*) from public.contactos c where c.autor_id = p.id),
         p.whatsapp, p.instagram, p.contacto_email
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

create or replace function public.admin_stats_mensajes_por_dia()
returns table (dia date, cantidad bigint)
language sql
security definer
set search_path = public
as $$
  select date_trunc('day', created_at)::date as dia, count(*) as cantidad
  from public.mensajes
  where public.es_super_admin()
  group by dia
  order by dia;
$$;

grant execute on function public.admin_stats_mensajes_por_dia() to authenticated;

create or replace function public.admin_stats_contactos_por_dia()
returns table (dia date, cantidad bigint)
language sql
security definer
set search_path = public
as $$
  select date_trunc('day', created_at)::date as dia, count(*) as cantidad
  from public.contactos
  where public.es_super_admin()
  group by dia
  order by dia;
$$;

grant execute on function public.admin_stats_contactos_por_dia() to authenticated;

-- Listado completo de mensajes de la plataforma, para que HQ Metales tenga
-- acceso al total de los mensajes (no solo estadísticas agregadas).
create or replace function public.admin_listar_mensajes()
returns table (
  id uuid,
  created_at timestamptz,
  publicacion_titulo text,
  remitente_nombre text,
  remitente_apellido text,
  destinatario_nombre text,
  destinatario_apellido text,
  cuerpo text
)
language sql
security definer
set search_path = public
as $$
  select
    m.id, m.created_at, pub.titulo,
    rem.nombre, rem.apellido,
    dest.nombre, dest.apellido,
    m.cuerpo
  from public.mensajes m
  join public.publicaciones pub on pub.id = m.publicacion_id
  join public.profiles rem on rem.id = m.remitente_id
  join public.profiles dest on dest.id = m.destinatario_id
  where public.es_super_admin()
  order by m.created_at desc;
$$;

grant execute on function public.admin_listar_mensajes() to authenticated;

-- Después de correr todo lo de arriba, para convertir a alguien en súper
-- admin: que se registre normalmente en el sitio con su email, y después
-- correr (reemplazando el email):
--
-- insert into public.super_admins (user_id)
-- select id from auth.users where email = 'bruno@metalesjulio.com.ar'
-- on conflict (user_id) do nothing;
