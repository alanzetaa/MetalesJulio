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
(nombre y apellido, DNI obligatorio, CUIT, email obligatorio) para que los
perfiles se compartan entre todos los usuarios, no solo en el navegador de
quien publica.

## Estado actual

- [index.html](index.html) sigue siendo una única página autocontenida (HTML +
  CSS + JS vanilla), sin build ni npm. La única dependencia externa es la
  fuente Montserrat de Google Fonts y el cliente JS de Supabase vía CDN
  (`@supabase/supabase-js` UMD).
- El backend es **Supabase** (Postgres + Auth), elegido explícitamente por el
  dueño del proyecto sobre Firebase. El esquema completo (tablas, políticas de
  Row Level Security, vistas y funciones) vive en
  [supabase-schema.sql](supabase-schema.sql) y se corre desde el SQL Editor
  del dashboard de Supabase (es seguro volver a correrlo si hay cambios).
- **La sesión NO persiste entre recargas de página, por decisión explícita del
  dueño (mismo criterio de seguridad que en Biddit)**: el cliente de Supabase
  se crea con `{ auth: { persistSession: false } }`, y al cargar la página se
  borra cualquier resto de sesión vieja en `localStorage` (claves que
  contengan `supabase` o empiecen con `sb-`), salvo que la URL traiga
  `access_token` en el hash (login con Google o link de recuperar contraseña
  en curso, para no pisar esa sesión antes de que se procese). En la práctica:
  cada F5 desloguea a la persona y hay que volver a ingresar.
- **Login: email + contraseña, o Google** (`supabase.auth.signUp` /
  `signInWithPassword` / `signInWithOAuth({provider:"google"})`). El proveedor
  Google está configurado en el proyecto de Google Cloud `alanzeta` (cliente
  OAuth "Metales Julio - Supabase Auth", app publicada en producción, sin
  necesitar verificación de Google porque solo pide scopes básicos). El
  **Site URL** y las **Redirect URLs** de Supabase (Authentication > URL
  Configuration) están puestas en `https://alanzetaa.github.io/MetalesJulio/`
  — si esto queda en el default de fábrica (`localhost:3000`), el login con
  Google (y el de recuperar contraseña) redirige mal después de autenticar.
- **Recuperar contraseña**: implementado con el mismo patrón que se usa en el
  otro proyecto del dueño (Biddit, `piloto3`). Flujo: el link "¿Olvidaste tu
  contraseña?" en el modal de login abre `forgotPasswordModal`, que llama a
  `supabase.auth.resetPasswordForEmail(email, { redirectTo: APP_URL })`.
  Cuando la persona hace click en el link del mail, Supabase la redirige de
  vuelta a `index.html` y dispara el evento `PASSWORD_RECOVERY` en
  `onAuthStateChange`, que abre `newPasswordModal` (sin botón de cerrar, a
  propósito: hay que completar el cambio para seguir) y llama a
  `supabase.auth.updateUser({ password })`. La bandera `_enRecuperacion` evita
  que `refreshViewForSession()` mande a la persona directo a la app antes de
  que termine de poner la contraseña nueva.
- **Mostrar/ocultar contraseña**: los inputs de contraseña de login y registro
  están envueltos en `.pass-field` con un botón `.pass-toggle` (ícono 👁/🙈)
  que cambia el `type` del input entre `password`/`text`, mismo patrón visual
  que Biddit.
- **Autocompletar ubicación**: el campo "Ubicación" del perfil usa **Nominatim
  (OpenStreetMap)**, no Google Places — es gratis y no requiere API key ni
  facturación (mismo servicio que usa Biddit para validar direcciones). Al
  tipear 3+ caracteres, hace `fetch` a `nominatim.openstreetmap.org/search`
  con `countrycodes=ar`, muestra sugerencias y arma un texto legible
  (calle+altura, localidad, provincia). A diferencia de Biddit, acá NO se
  bloquea el guardado si la persona no elige una sugerencia de la lista (no
  hace falta lat/lng preciso para este campo, solo ayudar a completarlo bien).

### La página pública es solo una puerta de entrada

Por decisión explícita del dueño, `index.html` tiene dos vistas totalmente
separadas que se togglean por JS (`#publicView` / `#appView`), no rutas:

- **`#publicView`** (no logueado): hero + "Cómo funciona" + footer. NO muestra
  el directorio, ni el buscador, ni desglose de miembros por rubro. Lo único
  que puede ver alguien sin cuenta es un contador total de miembros (ej. "48
  personas ya forman parte de la comunidad"), servido por la función SQL
  `public.contar_miembros()` (devuelve un número, nunca filas). Si en algún
  momento se agrega más información visible sin login, hay que revisar que no
  viole esta regla ("ni por rubro ni por nada" sin registrarse).
- **`#appView`** (logueado): reemplaza por completo la vista pública. Tiene un
  layout de sidebar izquierdo (fondo oscuro) con 3 secciones que se togglean
  con `showAppSection(name)`, sin router ni hash de URL. El orden del menú
  (decisión explícita del dueño) es: **Buscar en la comunidad**, **Mis
  publicaciones**, **Mi perfil** — aunque a alguien que recién se registra y
  no completó su perfil igual se lo manda directo a "Mi perfil" primero
  (`enterApp()` decide la sección inicial según si `profile` existe, sin
  importar el orden visual del menú).
  1. **Mi perfil** (`#section-perfil`): datos de identidad — nombre, apellido,
     DNI, CUIT, ubicación, descripción, contacto. Usa `upsert` sobre
     `profiles`, así que el mismo formulario sirve tanto para completar el
     perfil la primera vez como para editarlo después.
  2. **Mis publicaciones** (`#section-publicaciones`): lista de las filas
     propias en `publicaciones` (con botón "+ Nueva publicación" y "Eliminar").
  3. **Buscar en la comunidad** (`#section-buscar`): el buscador/directorio,
     ahora sobre `publicaciones` en vez de sobre perfiles directamente.

### Perfiles vs. publicaciones (decisión explícita del dueño)

Se separó el modelo en dos tablas porque una persona puede publicar **varios**
trabajos/artesanías distintos, no uno solo:

- `public.profiles`: **una fila por persona** — identidad y contacto
  (`nombre`, `apellido`, `dni` obligatorio único, `cuit` opcional único,
  `email` de la cuenta, `ubicacion`, `descripcion`, `whatsapp`, `instagram`,
  `contacto_email`). Ya no tiene columna `actividades`: el rubro ahora vive en
  cada publicación, no en el perfil.
- `public.publicaciones`: **muchas filas por persona** (`user_id` →
  `auth.users`) — cada trabajo/artesanía puntual, con `titulo`, `categoria`
  (un solo rubro, de la misma lista `CATEGORIES` del JS) y `descripcion`.
- La vista `public.comunidad_publicaciones` hace el `join` entre ambas tablas
  para el buscador: expone los datos de la publicación más los datos públicos
  de su autor (nombre, apellido, ubicación, contacto), pero **nunca** dni,
  cuit ni el email de la cuenta. Al ser un `inner join`, una publicación de
  alguien que todavía no completó su perfil simplemente no aparece en el
  buscador — es el mecanismo (no una validación extra en la app) que obliga a
  completar el perfil antes de ser visible en la comunidad.
- Esta vista se otorga **solo a `authenticated`** (`grant select ... to
  authenticated`, sin `anon`), que es lo que hace cumplir la regla de "sin
  registrarte no ves nada de la comunidad". La vista vieja `directorio_publico`
  (que sí le daba acceso a `anon`) se dropeó en el esquema actual — si en
  algún momento se vuelve a exponer algo a `anon`, hay que revisar con cuidado
  que no filtre de vuelta datos que deberían quedar solo para miembros.

### Privacidad

- **DNI, CUIT y el email de la cuenta son privados por decisión explícita del
  dueño del proyecto** (dato sensible de identificación oficial). Nunca se
  exponen: la tabla `profiles` tiene RLS que solo deja leer la fila propia, y
  la vista `comunidad_publicaciones` no incluye esas columnas en su `select`.
  Si se agrega una columna sensible nueva a `profiles`, hay que acordarse de
  NO agregarla también a esa vista.
- Nombre, apellido, DNI y CUIT quedan editables desde "Mi perfil" en cualquier
  momento (no solo al completarlo la primera vez); no hay re-verificación de
  identidad si alguien los cambia después.
- La interacción entre usuarios sigue resolviéndose con enlaces directos a
  WhatsApp (`wa.me`), Instagram y un email de contacto público opcional — no
  hay chat ni mensajería propia dentro del sitio.
- El repo se despliega en GitHub en `alanzetaa/MetalesJulio` (público, para
  poder usar GitHub Pages gratis) y se sirve desde
  https://alanzetaa.github.io/MetalesJulio/. `index.html` está en la raíz.

## Configuración pendiente (acción manual, no la puede hacer Claude)

`index.html` ya tiene `SUPABASE_URL` / `SUPABASE_ANON_KEY` cargados (proyecto
`makuoimgqzquewifvuse`). Si en el futuro se cambia de proyecto de Supabase:

1. Crear el proyecto en https://supabase.com.
2. En **Authentication > Sign In / Providers > Email**, desactivar "Confirm
   email" (si queda activo, el alta no puede completar el perfil en el mismo
   paso porque Supabase exige confirmar el mail antes de dar sesión).
3. Correr [supabase-schema.sql](supabase-schema.sql) completo en **SQL Editor**
   (es idempotente, se puede volver a correr entero sin romper nada).
4. Copiar `Project URL` y la **publishable key** desde **Project Settings >
   API Keys** y pegarlos en `SUPABASE_URL` / `SUPABASE_ANON_KEY` en
   `index.html`.
5. Esa key está pensada para vivir en el cliente/repo público — no es un
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

- Si se pide mensajería propia dentro del sitio (en vez de links a WhatsApp/
  Instagram/email), eso requiere una tabla de mensajes + RLS adicional.
- No hay moderación de contenido ni verificación real de identidad más allá de
  pedir el DNI/CUIT al registrarse.
- No hay edición de publicaciones ya creadas, solo alta y borrado.

## Convenciones

- Todo el contenido de cara al usuario va en español (Argentina).
- Mantener el sitio como un único `index.html` autocontenido; no introducir un
  build step (webpack/vite) a menos que el proyecto crezca lo suficiente como
  para justificarlo. El backend vive enteramente en Supabase (DB + Auth), no
  hay servidor propio que mantener.
