# Comunidad Metales Julio

## Qué es esto

Un sitio comunitario para que artesanos y oficios del metal (soldadores, herreros,
joyeros, torneros, escultores, etc.) se registren, publiquen su trabajo y
cualquiera pueda buscarlos y contactarlos directamente. Es un proyecto derivado
de Metales Julio, la casa de venta de metales e insumos (Av. Warnes 702, CABA —
https://www.tiendametalesjulio.com.ar/), pero es un espacio de comunidad, no la
tienda en sí.

Idea central pedida por el dueño del proyecto: "que todos los artesanos puedan
publicitar en esta comunidad, sean trabajos o artesanías", con un buscador para
encontrar artesanías o gente que hace trabajos (ej. soldadura), que la gente
pueda interactuar entre sí para ayudarse, y con un sistema de registro real
(nombre y apellido, DNI obligatorio, CUIT, email obligatorio y casilleros de
actividad/vínculo con la comunidad) para que los perfiles se compartan entre
todos los usuarios, no solo en el navegador de quien publica.

## Estado actual

- [index.html](index.html) sigue siendo una única página autocontenida (HTML +
  CSS + JS vanilla), sin build ni npm. La única dependencia externa es la
  fuente Montserrat de Google Fonts y el cliente JS de Supabase vía CDN
  (`@supabase/supabase-js` UMD).
- El backend es **Supabase** (Postgres + Auth), elegido explícitamente por el
  dueño del proyecto sobre Firebase. El esquema completo (tabla, políticas de
  Row Level Security y la vista pública) vive en
  [supabase-schema.sql](supabase-schema.sql) y se corre una sola vez desde el
  SQL Editor del dashboard de Supabase.
- **Login: email + contraseña** (`supabase.auth.signUp` / `signInWithPassword`),
  también decidido explícitamente por el dueño sobre la alternativa de enlace
  mágico.
- **El alta es en dos pasos, por decisión explícita del dueño**: el modal
  "Crear mi cuenta" solo pide email + contraseña (`supabase.auth.signUp`). Una
  vez logueado, se abre automáticamente (o vía el botón "Completar perfil" en
  el header, en acento dorado mientras falte) el modal de perfil, que pide
  nombre, apellido, DNI, CUIT, ubicación, descripción, actividades y contacto.
  Ese mismo modal se reutiliza después para editar el perfil ("Mi perfil"),
  usando `upsert` en vez de `insert`/`update` separados. Mientras alguien tenga
  cuenta pero no haya completado el perfil, no tiene fila en `profiles` y por
  lo tanto no aparece en el directorio público — es esperado, no un bug.
- Cada persona tiene una fila en `public.profiles` con: `nombre`, `apellido`,
  `dni` (obligatorio, único), `cuit` (opcional, único si se carga), `email`
  (se completa automáticamente con el email de la cuenta, no se pide de nuevo),
  `ubicacion`, `descripcion`, `actividades` (array de texto — los oficios/rubros
  con los que se vincula a la comunidad), `whatsapp`, `instagram`,
  `contacto_email`.
- Nombre, apellido, DNI y CUIT quedaron editables desde el modal de perfil en
  cualquier momento (no solo al registrarse) para simplificar el flujo; no hay
  re-verificación de identidad si alguien los cambia después. Si en el futuro
  se necesita evitar eso, hay que sacar esos campos del modal de edición y
  dejarlos fijos tras la creación inicial.
- **DNI, CUIT y el email de la cuenta son privados por decisión explícita del
  dueño del proyecto** (dato sensible de identificación oficial). Nunca se
  exponen: la tabla tiene RLS que solo deja leer la fila propia, y el
  directorio público lee de la vista `public.directorio_publico`, que
  directamente no incluye esas columnas en su `select`. Si en algún momento se
  agrega una nueva columna sensible a `profiles`, hay que acordarse de NO
  agregarla también a esa vista.
- La interacción entre usuarios sigue resolviéndose con enlaces directos a
  WhatsApp (`wa.me`), Instagram y un email de contacto público opcional — no
  hay chat ni mensajería propia dentro del sitio.
- El repo se despliega en GitHub en `alanzetaa/MetalesJulio`. `index.html` está
  en la raíz para poder habilitar GitHub Pages directamente sobre `main`/`master`
  sin carpeta `docs/`.

## Configuración pendiente (acción manual, no la puede hacer Claude)

`index.html` trae placeholders `SUPABASE_URL` / `SUPABASE_ANON_KEY` al principio
del `<script>` (buscar el comentario "Configuración de Supabase"). Mientras no
se reemplacen, el sitio muestra un banner de aviso y el directorio no funciona.
Pasos para dejarlo andando:

1. Crear un proyecto gratis en https://supabase.com (requiere cuenta propia del
   dueño del proyecto; Claude no puede crear esto de forma autónoma).
2. En **Authentication > Providers > Email**, desactivar "Confirm email" (si
   queda activo, el alta no puede crear el perfil en el mismo paso porque
   Supabase exige confirmar el mail antes de abrir sesión).
3. Correr [supabase-schema.sql](supabase-schema.sql) completo en **SQL Editor**.
4. Copiar `Project URL` y `anon public key` desde **Project Settings > API** y
   pegarlos en `SUPABASE_URL` / `SUPABASE_ANON_KEY` en `index.html`.
5. La `anon key` está pensada para vivir en el cliente/repo público — no es un
   secreto, la seguridad la dan las políticas de RLS del paso 3, no ocultar
   esta clave.

## Identidad visual (tomada de la tienda oficial)

Extraída del CSS de https://www.tiendametalesjulio.com.ar/ (tema "amazonas" de
Tiendanube), no son valores inventados:

- Color primario (casi negro): `#040404`
- Color de acento (dorado/bronce): `#b3986a`
- Texto: `#080808` / Fondo: `#ffffff`
- Tipografía: "Montserrat"
- Botones redondeados (`border-radius: 40px`), tarjetas con esquinas suaves
  (`10–20px`) y sombras sutiles.

El logo no se copió tal cual (está hosteado en el CDN de Tiendanube y sería
frágil hotlinkearlo); en su lugar se recreó un isotipo simple ("MJ" en círculo
color acento) que respeta la paleta.

## Próximos pasos posibles (no implementados)

- Recuperación de contraseña ("olvidé mi contraseña") — no está implementada.
- Si se pide mensajería propia dentro del sitio (en vez de links a WhatsApp/
  Instagram/email), eso requiere una tabla de mensajes + RLS adicional, no solo
  el esquema actual de `profiles`.
- No hay moderación de contenido ni verificación real de identidad más allá de
  pedir el DNI/CUIT al registrarse — si se necesita eso, es trabajo aparte.

## Convenciones

- Todo el contenido de cara al usuario va en español (Argentina).
- Mantener el sitio como un único `index.html` autocontenido; no introducir un
  build step (webpack/vite) a menos que el proyecto crezca lo suficiente como
  para justificarlo. El backend vive enteramente en Supabase (DB + Auth), no
  hay servidor propio que mantener.
