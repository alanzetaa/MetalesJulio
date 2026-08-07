-- Esquema de la Comunidad Metales Julio para Supabase.
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query > Run.
-- Es seguro volver a correr este script completo aunque ya lo hayas corrido
-- antes (usa "if not exists" / "or replace" / "drop ... if exists" en todo).
--
-- Antes de correr esto, en Authentication > Sign In / Providers > Email,
-- desactivá "Confirm email".

create extension if not exists "pgcrypto";

-- Filtro de lenguaje ofensivo (ver reglas.md, "Filtro de lenguaje
-- ofensivo"): bloquea el insert de una publicación o un mensaje si el
-- texto contiene alguna de estas palabras. NO es un detector real de
-- "cualquier idioma" -- es una lista mantenible a mano de insultos
-- comunes en español (Argentina) e inglés, fácil de esquivar con
-- variantes raras. Se define acá arriba de todo porque las policies de
-- publicaciones y mensajes la referencian más abajo.
-- IMPORTANTE: esta lista tiene que coincidir con
-- web/src/constants/palabrasProhibidas.ts (esa es la que da el aviso
-- rápido en el navegador; esta es la que de verdad bloquea el insert).
-- translate() saca acentos/ñ antes de comparar, mismo motivo que
-- normalizarTexto() del lado de React.
create or replace function public.contiene_insulto(texto text)
returns boolean
language sql
immutable
as $$
  select texto is not null and translate(lower(texto), 'áéíóúñ', 'aeioun') ~ (
    '\y(' || array_to_string(array[
      'boludo', 'boluda', 'pelotudo', 'pelotuda', 'gil', 'forro', 'forra',
      'puto', 'puta', 'maricon', 'conchudo', 'conchuda', 'pajero', 'pajera',
      'hijodeputa', 'hdp', 'imbecil', 'idiota', 'estupido', 'estupida',
      'mierda', 'garca', 'chorro', 'tarado', 'tarada', 'subnormal',
      'cornudo', 'malparido',
      'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'dumbass', 'moron', 'retard'
    ], '|') || ')\y'
  );
$$;

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

-- Ciudad, obligatoria desde el formulario (a diferencia de "ubicacion", que
-- pasa a ser opcional) -- se completa solo eligiendo una sugerencia de
-- Nominatim, igual que provincia, para que quede estandarizada en vez de
-- texto libre tipo "CABA" en un perfil y "Ciudad Autónoma de Buenos Aires"
-- en otro. Nullable acá a propósito: los perfiles que ya existían no tienen
-- este dato y no hay forma de pedírselo retroactivamente -- la obligación
-- real es del lado del formulario, para adelante.
alter table public.profiles add column if not exists ciudad text;

-- Backfill cosmético para perfiles viejos que ya tienen provincia pero
-- todavía no cargaron ciudad (por ejemplo, completaron su perfil antes de
-- que este campo existiera): mientras no entren a "Mi perfil" y elijan su
-- ciudad de la lista, mostramos la provincia como ciudad para que no quede
-- en blanco en HQ Metales ni en las vistas públicas. Es idempotente -- una
-- vez que alguien complete su ciudad de verdad, esta condición ya no la
-- vuelve a tocar.
update public.profiles set ciudad = provincia
where ciudad is null and provincia is not null;

-- Vestigio de una versión anterior donde la actividad vivía en el perfil;
-- ahora cada publicación tiene su propia categoría.
alter table public.profiles drop column if exists actividades;

-- Suspensión temporal de miembros: si suspendido_hasta está en el futuro, la
-- persona está suspendida. No hace falta un cron para "levantar" la
-- suspensión: se compara contra now() en cada lectura. Va acá arriba (y no
-- más abajo) porque las políticas de "publicaciones" ya la necesitan.
alter table public.profiles add column if not exists suspendido_hasta timestamptz;

-- Preferencia de la persona: si quiere recibir un mail cada vez que le
-- llega un mensaje nuevo (ver reglas.md, "Notificaciones de mensajes
-- nuevos"). Tildada por default -- si alguien la destilda desde "Mi
-- perfil", la Edge Function notificar-mensaje deja de mandarle mail (el
-- mensaje se sigue viendo igual adentro de la plataforma).
alter table public.profiles add column if not exists notificar_mensajes boolean not null default true;

-- Aceptación de Términos y Condiciones: obligatoria para publicar o mandar
-- mensajes (ver reglas.md, "Términos y Condiciones"). Se versiona con un
-- número en vez de un simple boolean: si el texto cambia de forma
-- relevante, se sube TERMINOS_VERSION_ACTUAL (en
-- web/src/constants/terminos.ts) y automáticamente a TODOS les vuelve a
-- pedir aceptar, sin importar que ya hayan aceptado una versión vieja.
-- 0 = nunca aceptó nada. terminos_aceptados_at queda como registro de
-- cuándo se aceptó la versión actual, por las dudas.
alter table public.profiles add column if not exists terminos_version_aceptada integer not null default 0;
alter table public.profiles add column if not exists terminos_aceptados_at timestamptz;
alter table public.profiles drop column if exists terminos_aceptados;

-- "Latido" para saber quién está usando la plataforma ahora mismo (ver
-- reglas.md, "En línea ahora" en HQ Metales) -- distinto de
-- last_sign_in_at (que solo se actualiza al loguearse): el cliente pisa
-- esta columna cada 60s mientras la app está abierta y logueada
-- (useHeartbeat), así que sirve para saber quién está activo de verdad en
-- este momento, no solo quién inició sesión en algún momento del día.
alter table public.profiles add column if not exists ultima_actividad timestamptz;

create unique index if not exists profiles_cuit_unique_idx
  on public.profiles (cuit)
  where cuit is not null and cuit <> '';

alter table public.profiles enable row level security;

drop policy if exists "select_own_profile" on public.profiles;
create policy "select_own_profile"
  on public.profiles for select
  using (auth.uid() = id);

-- El "Contanos sobre vos" (descripcion) se muestra publico en el perfil de
-- cada persona -- mismo chequeo de lenguaje ofensivo que ya se le hace a
-- titulo/descripcion de publicaciones y al cuerpo de los mensajes (se
-- habia quedado afuera de este chequeo, se coló un insulto real ahi antes
-- de agregarlo).
drop policy if exists "insert_own_profile" on public.profiles;
create policy "insert_own_profile"
  on public.profiles for insert
  with check (auth.uid() = id and not public.contiene_insulto(descripcion));

drop policy if exists "update_own_profile" on public.profiles;
create policy "update_own_profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and not public.contiene_insulto(descripcion));

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

-- Borrado "blando" (pedido explícito del dueño): cuando alguien borra su
-- propia publicación desde "Mis publicaciones", no se borra la fila de
-- verdad -- se marca con deleted_at y listo. Así HQ Metales conserva el
-- historial completo de publicaciones y mensajes para siempre (los
-- mensajes/likes/denuncias no se cascadean porque la fila sigue
-- existiendo), en vez de perderlo apenas alguien borra algo. Solo el
-- super admin puede borrar de verdad, con admin_eliminar_publicacion (ver
-- más abajo), que sigue siendo un delete real.
alter table public.publicaciones add column if not exists deleted_at timestamptz;

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

-- No deja insertar si la persona está suspendida, si todavía no aceptó la
-- versión ACTUAL de los Términos y Condiciones (ver reglas.md, "Términos y
-- Condiciones"), o si el título/descripción tienen lenguaje ofensivo (ver
-- reglas.md, "Filtro de lenguaje ofensivo") -- chequeo a nivel de base de
-- datos, no solo en la interfaz: nada de esto se puede esquivar llamando a
-- la API directamente.
-- IMPORTANTE: el número de acá (">= N") tiene que coincidir siempre con
-- TERMINOS_VERSION_ACTUAL en web/src/constants/terminos.ts -- si se sube
-- ese número porque cambió el texto, hay que volver a correr este policy
-- con el número nuevo (mismo patrón que CATEGORIES/CATEGORY_COLORS).
drop policy if exists "insert_own_publicaciones" on public.publicaciones;
create policy "insert_own_publicaciones"
  on public.publicaciones for insert
  with check (
    auth.uid() = user_id
    and not public.contiene_insulto(titulo)
    and not public.contiene_insulto(descripcion)
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.terminos_version_aceptada >= 2
        and (p.suspendido_hasta is null or p.suspendido_hasta <= now())
    )
  );

drop policy if exists "update_own_publicaciones" on public.publicaciones;
create policy "update_own_publicaciones"
  on public.publicaciones for update
  using (auth.uid() = user_id);

-- Ya no existe una policy de delete para el dueño de la publicación: borrar
-- "de verdad" ahora es solo cosa del super admin (admin_eliminar_publicacion,
-- security definer). El botón "Eliminar" de "Mis publicaciones" hace un
-- update de deleted_at, cubierto por update_own_publicaciones más abajo.
drop policy if exists "delete_own_publicaciones" on public.publicaciones;

-- Editar título/rubro/descripción/tipo solo está permitido hasta 20
-- minutos después de creada la publicación (pedido explícito del dueño);
-- pasado ese tiempo solo se puede seguir agregando/quitando fotos, sin
-- límite de tiempo (por eso este chequeo no toca foto_paths). Va como
-- trigger y no como parte de update_own_publicaciones porque una policy
-- normal no puede comparar el valor VIEJO contra el NUEVO de cada columna,
-- solo el trigger tiene acceso a OLD/NEW. También revalida que no se
-- cuelen insultos al editar, mismo chequeo que ya hace insert_own_publicaciones.
create or replace function public.limitar_edicion_publicacion()
returns trigger
language plpgsql
as $$
begin
  if (new.titulo is distinct from old.titulo
      or new.categoria is distinct from old.categoria
      or new.descripcion is distinct from old.descripcion
      or new.tipo is distinct from old.tipo)
  then
    if old.created_at <= now() - interval '20 minutes' then
      raise exception 'Ya pasaron los 20 minutos: no se puede editar el título, rubro, descripción o tipo de esta publicación.';
    end if;
    if public.contiene_insulto(new.titulo) or public.contiene_insulto(new.descripcion) then
      raise exception 'El título o la descripción contienen lenguaje que no está permitido.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trigger_limitar_edicion_publicacion on public.publicaciones;
create trigger trigger_limitar_edicion_publicacion
  before update on public.publicaciones
  for each row execute function public.limitar_edicion_publicacion();

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

-- Publicaciones guardadas/favoritas -- a diferencia de los likes, esto SÍ es
-- privado (nadie más necesita ver qué guardó cada quien), por eso el select
-- está restringido a la propia fila, no "using (true)" como los likes.
create table if not exists public.publicaciones_guardadas (
  publicacion_id uuid not null references public.publicaciones (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (publicacion_id, user_id)
);

alter table public.publicaciones_guardadas enable row level security;

drop policy if exists "select_own_guardadas" on public.publicaciones_guardadas;
create policy "select_own_guardadas"
  on public.publicaciones_guardadas for select
  using (auth.uid() = user_id);

drop policy if exists "insert_own_guardada" on public.publicaciones_guardadas;
create policy "insert_own_guardada"
  on public.publicaciones_guardadas for insert
  with check (
    auth.uid() = user_id
    and not exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.suspendido_hasta is not null and p.suspendido_hasta > now()
    )
  );

drop policy if exists "delete_own_guardada" on public.publicaciones_guardadas;
create policy "delete_own_guardada"
  on public.publicaciones_guardadas for delete
  using (auth.uid() = user_id);

revoke all on public.publicaciones_guardadas from anon;
grant select, insert, delete on public.publicaciones_guardadas to authenticated;

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

-- Mismo requisito de Términos y Condiciones que insert_own_publicaciones
-- (ver ese comentario) -- el número (">= N") tiene que coincidir con
-- TERMINOS_VERSION_ACTUAL. También bloquea mensajes con lenguaje ofensivo
-- (ver reglas.md, "Filtro de lenguaje ofensivo").
drop policy if exists "insert_mensajes" on public.mensajes;
create policy "insert_mensajes"
  on public.mensajes for insert
  with check (
    auth.uid() = remitente_id
    and not public.contiene_insulto(cuerpo)
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.terminos_version_aceptada >= 2
        and (p.suspendido_hasta is null or p.suspendido_hasta <= now())
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
    dest.nombre as destinatario_nombre, dest.apellido as destinatario_apellido,
    pub.user_id as publicacion_autor_id
  from public.mensajes m
  join public.publicaciones pub on pub.id = m.publicacion_id
  join public.profiles rem on rem.id = m.remitente_id
  join public.profiles dest on dest.id = m.destinatario_id
  where m.remitente_id = auth.uid() or m.destinatario_id = auth.uid();

revoke all on public.mensajes_detalle from anon;
grant select on public.mensajes_detalle to authenticated;

-- Las reseñas/calificaciones entre miembros se eliminaron por completo de la
-- plataforma -- decisión de raíz de Bruno (dueño del proyecto). No quedó
-- nada del concepto: ni tabla, ni vista, ni función de admin, ni pantalla.
-- Este drop está acá (y no simplemente borrado del archivo) porque el
-- esquema se corre sobre una base que ya existe: sin él, la tabla vieja
-- quedaría dando vueltas con sus datos. "cascade" se lleva puestas las
-- policies y cualquier vista que dependiera de ella. Es seguro volver a
-- correrlo: si la tabla ya no está, no hace nada.
drop table if exists public.resenas cascade;

-- Denuncias entre miembros (ver reglas.md, "Denuncias"): solo se puede
-- denunciar tras haber intercambiado mensajes reales con esa persona sobre
-- esa publicación puntual, y es visible solo para HQ Metales (nunca para
-- otros miembros). "motivo" es un valor fijo de una lista cerrada (ver
-- MOTIVOS_DENUNCIA en web/src/constants/denuncias.ts, tiene que coincidir
-- con el check de acá abajo) para poder filtrar/entender de un vistazo sin
-- depender de que la persona describa bien el problema en texto libre.
create table if not exists public.denuncias (
  id uuid primary key default gen_random_uuid(),
  publicacion_id uuid not null references public.publicaciones (id) on delete cascade,
  denunciante_id uuid not null references auth.users (id) on delete cascade,
  denunciado_id uuid not null references auth.users (id) on delete cascade,
  motivo text not null,
  comentario text,
  created_at timestamptz not null default now(),
  constraint denuncias_motivo_valido check (
    motivo in ('estafa', 'producto_no_coincide', 'lenguaje_inapropiado', 'acoso', 'spam', 'otro')
  ),
  constraint denuncias_no_autodenuncia check (denunciante_id <> denunciado_id),
  constraint denuncias_unica_por_publicacion unique (denunciante_id, publicacion_id)
);

alter table public.denuncias enable row level security;

-- Nadie puede leer denuncias por API directa, ni siquiera la propia (mismo
-- criterio que "super_admins"/"impersonaciones") -- solo se accede a través
-- de admin_listar_denuncias(), gateada por es_super_admin().
drop policy if exists "select_denuncias" on public.denuncias;
create policy "select_denuncias"
  on public.denuncias for select
  using (false);

drop policy if exists "insert_denuncia_tras_intercambio" on public.denuncias;
create policy "insert_denuncia_tras_intercambio"
  on public.denuncias for insert
  with check (
    auth.uid() = denunciante_id
    and denunciante_id <> denunciado_id
    and not public.contiene_insulto(comentario)
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.terminos_version_aceptada >= 2
        and (p.suspendido_hasta is null or p.suspendido_hasta <= now())
    )
    and exists (
      select 1 from public.mensajes m
      where m.publicacion_id = denuncias.publicacion_id
        and (
          (m.remitente_id = denuncias.denunciante_id and m.destinatario_id = denuncias.denunciado_id)
          or (m.remitente_id = denuncias.denunciado_id and m.destinatario_id = denuncias.denunciante_id)
        )
    )
  );

revoke all on public.denuncias from anon;
grant select, insert on public.denuncias to authenticated;

-- "Contactos" (clicks en WhatsApp/Instagram/email desde el modal de
-- contacto) se eliminó de raíz: el botón que los generaba ya no existe --
-- ahora todo el contacto entre miembros pasa por la mensajería interna
-- (public.mensajes), así que esta tabla quedaba sin nada que la siga
-- alimentando. Se dropea junto con lo que dependía de ella
-- (admin_stats_contactos_por_dia, la columna contactos_recibidos de
-- admin_listar_miembros y el gráfico/tarjeta/columna correspondientes en
-- HQ Metales). Si en algún momento se vuelve a pedir medir tráfico, el
-- historial de git tiene la implementación completa anterior.
drop function if exists public.admin_stats_contactos_por_dia();
drop table if exists public.contactos cascade;

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
    prof.ciudad,
    prof.whatsapp,
    prof.instagram,
    prof.contacto_email,
    pub.foto_paths,
    (select count(*) from public.publicacion_likes pl where pl.publicacion_id = pub.id) as likes_count
  from public.publicaciones pub
  join public.profiles prof on prof.id = pub.user_id
  where pub.deleted_at is null
    and (prof.suspendido_hasta is null or prof.suspendido_hasta < now());

revoke all on public.comunidad_publicaciones from anon;
grant select on public.comunidad_publicaciones to authenticated;

-- Mini perfil público por persona (ver reglas.md, "Mini perfil público"):
-- se accede clickeando el nombre de alguien en un resultado de búsqueda.
-- Nunca expone dni, cuit, email de cuenta ni la dirección exacta -- mismo
-- criterio que comunidad_publicaciones.
drop view if exists public.perfil_publico;
create view public.perfil_publico as
  select
    p.id,
    p.nombre,
    p.apellido,
    p.provincia,
    p.ciudad,
    p.descripcion,
    p.created_at
  from public.profiles p
  where p.suspendido_hasta is null or p.suspendido_hasta < now();

revoke all on public.perfil_publico from anon;
grant select on public.perfil_publico to authenticated;

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

-- Uso de los límites del plan gratuito, para el chequeo semanal automático
-- (.github/workflows/chequeo-semanal.yml) -- ver reglas.md, "Avisos de
-- capacidad". Se mide directo por SQL en vez de con la Management API de
-- Supabase, que necesitaría un token de administración de la cuenta entera:
-- así el chequeo semanal no tiene que guardar ese token en ningún lado.
--
-- Devuelve SOLO números agregados de infraestructura -- ni un dato de
-- ninguna persona. Por eso se puede otorgar a "anon" sin riesgo (el chequeo
-- semanal corre sin sesión de usuario, con la misma clave publishable que ya
-- es pública). Lo único que se "filtra" es cuánto pesa la base, que no dice
-- nada de nadie.
--
-- Ojo: el egress (los datos servidos hacia afuera, el límite que más rápido
-- se agota con las fotos) NO se puede medir desde acá -- es un dato de la
-- infraestructura de Supabase, solo visible en su panel de facturación.
create or replace function public.uso_plataforma()
returns table (
  base_bytes bigint,
  fotos_bytes bigint,
  fotos_cantidad bigint,
  mensajes_mes bigint,
  denuncias_mes bigint
)
language sql
security definer
set search_path = public
as $$
  select
    pg_database_size(current_database()),
    (select coalesce(sum((o.metadata->>'size')::bigint), 0)
       from storage.objects o where o.bucket_id = 'publicaciones-fotos'),
    (select count(*) from storage.objects o where o.bucket_id = 'publicaciones-fotos'),
    -- Sirve para estimar los mails de Resend: se manda uno por mensaje
    -- nuevo (agrupando los de una misma conversación dentro de 5 minutos,
    -- así que esto es una cota máxima, nunca menos que lo real).
    (select count(*) from public.mensajes m where m.created_at >= date_trunc('month', now())),
    (select count(*) from public.denuncias d where d.created_at >= date_trunc('month', now()));
$$;

grant execute on function public.uso_plataforma() to anon, authenticated;

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

-- Registro de auditoría de "Ver como" (HQ Metales > tabla de miembros,
-- botón "Ver como") -- pedido explícito del dueño para que quede trazado
-- quién entró a la cuenta de quién y cuándo. Nadie la lee por API directa,
-- ni siquiera el propio super admin (mismo criterio que super_admins y
-- contactos): el insert lo hace la Edge Function ver-como con la
-- service_role key, que bypassea RLS. Se consulta directo desde el SQL
-- Editor de Supabase si hace falta revisarla.
create table if not exists public.impersonaciones (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users (id) on delete cascade,
  target_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.impersonaciones enable row level security;
revoke all on public.impersonaciones from anon, authenticated;

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
  ciudad text,
  created_at timestamptz,
  ultima_conexion timestamptz,
  ultima_actividad timestamptz,
  suspendido_hasta timestamptz,
  mensajes_recibidos bigint,
  whatsapp text,
  instagram text,
  contacto_email text,
  terminos_version_aceptada integer
)
language sql
security definer
set search_path = public
as $$
  select p.id, p.nombre, p.apellido, p.dni, p.email, p.ubicacion, p.ciudad, p.created_at,
         u.last_sign_in_at, p.ultima_actividad, p.suspendido_hasta,
         (select count(*) from public.mensajes m where m.destinatario_id = p.id),
         p.whatsapp, p.instagram, p.contacto_email, p.terminos_version_aceptada
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

-- Listado completo de mensajes de la plataforma, para que HQ Metales tenga
-- acceso al total de los mensajes (no solo estadísticas agregadas).
-- Se dropea antes de recrear (no alcanza con "or replace" para cambiar el
-- "returns table") porque se agregan los ids de remitente/destinatario/
-- publicación (para poder armar el hilo completo entre dos personas desde
-- la tabla de HQ, ver "Ver charla").
drop function if exists public.admin_listar_mensajes();
create or replace function public.admin_listar_mensajes()
returns table (
  id uuid,
  created_at timestamptz,
  publicacion_id uuid,
  publicacion_titulo text,
  remitente_id uuid,
  remitente_nombre text,
  remitente_apellido text,
  destinatario_id uuid,
  destinatario_nombre text,
  destinatario_apellido text,
  cuerpo text,
  publicacion_eliminada_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    m.id, m.created_at, pub.id, pub.titulo,
    rem.id, rem.nombre, rem.apellido,
    dest.id, dest.nombre, dest.apellido,
    m.cuerpo,
    pub.deleted_at
  from public.mensajes m
  join public.publicaciones pub on pub.id = m.publicacion_id
  join public.profiles rem on rem.id = m.remitente_id
  join public.profiles dest on dest.id = m.destinatario_id
  where public.es_super_admin()
  order by m.created_at desc;
$$;

grant execute on function public.admin_listar_mensajes() to authenticated;

-- Las reseñas se eliminaron por completo (ver el drop table más arriba), así
-- que admin_listar_resenas() ya no existe -- se dropea acá por si quedó
-- creada de una corrida anterior de este mismo script.
drop function if exists public.admin_listar_resenas();

-- Listado completo de denuncias para HQ Metales -- ver reglas.md,
-- "Denuncias". Esta función es el único acceso: la tabla denuncias no tiene
-- ninguna policy de select para authenticated.
-- denunciante_id y denunciante_whatsapp se agregaron para poder escribirle
-- al denunciante desde HQ Metales (botón "Mensaje" en la tabla de Denuncias,
-- ver reglas.md) y para mostrar su celular en la tabla, sin tener que
-- exponer su email (eso lo resuelve del lado del servidor la Edge Function
-- notificar-denuncia-respuesta, con la service_role key).
drop function if exists public.admin_listar_denuncias();
create or replace function public.admin_listar_denuncias()
returns table (
  id uuid,
  created_at timestamptz,
  publicacion_titulo text,
  denunciante_id uuid,
  denunciante_nombre text,
  denunciante_apellido text,
  denunciante_dni text,
  denunciante_whatsapp text,
  denunciado_id uuid,
  denunciado_nombre text,
  denunciado_apellido text,
  denunciado_dni text,
  motivo text,
  comentario text
)
language sql
security definer
set search_path = public
as $$
  select
    d.id, d.created_at, pub.titulo,
    denunciante.id, denunciante.nombre, denunciante.apellido, denunciante.dni, denunciante.whatsapp,
    denunciado.id, denunciado.nombre, denunciado.apellido, denunciado.dni,
    d.motivo, d.comentario
  from public.denuncias d
  join public.publicaciones pub on pub.id = d.publicacion_id
  join public.profiles denunciante on denunciante.id = d.denunciante_id
  join public.profiles denunciado on denunciado.id = d.denunciado_id
  where public.es_super_admin()
  order by d.created_at desc;
$$;

grant execute on function public.admin_listar_denuncias() to authenticated;

-- Listado completo de publicaciones (incluye datos del autor, para poder
-- buscar por usuario) y función para eliminarlas -- ver reglas.md,
-- "Moderación de publicaciones desde HQ Metales".
drop function if exists public.admin_listar_publicaciones();
create or replace function public.admin_listar_publicaciones()
returns table (
  id uuid,
  created_at timestamptz,
  titulo text,
  categoria text,
  tipo text,
  descripcion text,
  autor_id uuid,
  autor_nombre text,
  autor_apellido text,
  autor_email text,
  autor_dni text,
  likes_count bigint,
  deleted_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    pub.id, pub.created_at, pub.titulo, pub.categoria, pub.tipo, pub.descripcion,
    prof.id, prof.nombre, prof.apellido, prof.email, prof.dni,
    (select count(*) from public.publicacion_likes pl where pl.publicacion_id = pub.id),
    pub.deleted_at
  from public.publicaciones pub
  join public.profiles prof on prof.id = pub.user_id
  where public.es_super_admin()
  order by pub.created_at desc;
$$;

grant execute on function public.admin_listar_publicaciones() to authenticated;

create or replace function public.admin_eliminar_publicacion(target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.es_super_admin() then
    raise exception 'No autorizado';
  end if;
  delete from public.publicaciones where id = target_id;
end;
$$;

grant execute on function public.admin_eliminar_publicacion(uuid) to authenticated;

-- Después de correr todo lo de arriba, para convertir a alguien en súper
-- admin: que se registre normalmente en el sitio con su email, y después
-- correr (reemplazando el email):
--
-- insert into public.super_admins (user_id)
-- select id from auth.users where email = 'bruno@metalesjulio.com.ar'
-- on conflict (user_id) do nothing;
