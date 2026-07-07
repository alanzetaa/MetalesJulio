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
- El backend es **Supabase** (Postgres + Auth + Storage), elegido explícitamente
  por el dueño del proyecto sobre Firebase. El esquema completo (tablas,
  políticas de Row Level Security, vistas, funciones y el bucket de Storage
  para fotos) vive en [supabase-schema.sql](supabase-schema.sql) y se corre
  desde el SQL Editor del dashboard de Supabase (es seguro volver a correrlo
  si hay cambios). Además hay una Edge Function en
  [supabase/functions/notificar-mensaje](supabase/functions/notificar-mensaje/index.ts)
  (avisa por mail cuando llega un mensaje — ver sección de Mensajería).
- **La sesión NO persiste entre recargas de página, por decisión explícita del
  dueño (mismo criterio de seguridad que en Biddit)**: el cliente de Supabase
  se crea con `{ auth: { persistSession: false } }`, y al cargar la página se
  borra cualquier resto de sesión vieja en `localStorage` (claves que
  contengan `supabase` o empiecen con `sb-`), salvo que la URL traiga
  `access_token` en el hash (login con Google o link de recuperar contraseña
  en curso, para no pisar esa sesión antes de que se procese). En la práctica:
  cada F5 desloguea a la persona y hay que volver a ingresar. Importante:
  `enterApp()` limpia ese hash de la URL con `history.replaceState` apenas
  entra a la app — si no se limpia, el login con Google queda con
  `#access_token=...` pegado en la URL y cada F5 vuelve a loguear a la
  persona leyendo ese token viejo, sin importar que `persistSession` esté en
  `false` (eso pasó y costó detectarlo).
- **Login: email + contraseña, o Google** (`supabase.auth.signUp` /
  `signInWithPassword` / `signInWithOAuth({provider:"google"})`). El proveedor
  Google está configurado en el proyecto de Google Cloud `alanzeta` (cliente
  OAuth "Metales Julio - Supabase Auth", app publicada en producción, sin
  necesitar verificación de Google porque solo pide scopes básicos). El
  **Site URL** y las **Redirect URLs** de Supabase (Authentication > URL
  Configuration) están puestas en `https://metalesjulio.vercel.app` — si esto
  queda en el default de fábrica (`localhost:3000`), el login con Google (y
  el de recuperar contraseña) redirige mal después de autenticar. La URL de
  GitHub Pages (`https://alanzetaa.github.io/MetalesJulio/`) se dejó también
  en la lista de Redirect URLs por si se vuelve a usar ese hosting, pero ya
  no es el dominio principal (ver sección de Hosting más abajo). En Google
  Cloud Console (dominios autorizados + orígenes de JavaScript del cliente
  OAuth) también hay que tener cargado el dominio que esté sirviendo el sitio
  en cada momento.
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
  Al elegir una sugerencia, además del texto completo (que se guarda en
  `profiles.ubicacion`, privado), se guarda por separado `d.address.state`
  en el atributo `data-provincia` del input — eso es lo único que se manda a
  `profiles.provincia` al guardar el perfil, y lo único de ubicación que se
  expone públicamente en el buscador (ver "Privacidad" más abajo).

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
  layout de sidebar izquierdo (fondo oscuro) con secciones que se togglean
  con `showAppSection(name)`, sin router ni hash de URL. El orden del menú es:
  **Buscar en la comunidad**, **Mis publicaciones**, **Mensajes**, **Mi
  perfil** — aunque a alguien que recién se registra y no completó su perfil
  igual se lo manda directo a "Mi perfil" primero (`enterApp()` decide la
  sección inicial según si `profile` existe, sin importar el orden visual del
  menú). Los súper admins ven además, arriba de todo, "⚙ HQ Metales"
  (`#section-admin`, ver más abajo). `showAppSection(name)` también dispara
  `loadUnreadCount()` en cada cambio de sección, para que el badge de
  "Mensajes" se mantenga al día sin depender de Realtime (ver sección de
  Mensajería).
  1. **Mi perfil** (`#section-perfil`): datos de identidad — nombre, apellido,
     DNI, CUIT, ubicación, descripción, contacto. Usa `upsert` sobre
     `profiles`, así que el mismo formulario sirve tanto para completar el
     perfil la primera vez como para editarlo después.
  2. **Mis publicaciones** (`#section-publicaciones`): lista de las filas
     propias en `publicaciones` (con botón "+ Nueva publicación", foto
     opcional y "Eliminar" — ver secciones de Fotos y Likes más abajo).
  3. **Buscar en la comunidad** (`#section-buscar`): el buscador/directorio,
     ahora sobre `publicaciones` en vez de sobre perfiles directamente.
  4. **Mensajes** (`#section-mensajes`): lista de conversaciones propias, ver
     sección de Mensajería privada más abajo.
- **`#suspendedView`**: si el perfil de la persona tiene `suspendido_hasta` en
  el futuro, `enterApp()` no la deja entrar a `#appView` — le muestra esta
  vista en cambio (solo un botón de "Salir"), sin importar cómo haya logueado.

### HQ Metales (panel de súper admins)

- Se llama **"HQ Metales"** (no "Panel de administración" — nombre pedido
  explícitamente por el dueño, calcado del botón "Biddit HQ" del otro
  proyecto), tanto en el botón del sidebar como en el título de la sección.
- Quién es súper admin vive en `public.super_admins` (una fila por
  `user_id`), una tabla sin política de `select` — nadie la lee directo por
  API, solo a través de `es_super_admin()` (security definer).
- **Sección "Seguridad: súper admins"**, al final de HQ Metales: permite
  agregar o quitar súper admins desde la propia app, sin depender de correr
  SQL a mano (el `insert` comentado al final de `supabase-schema.sql` queda
  solo como método alternativo/de emergencia). Usa 3 funciones nuevas,
  todas `security definer` y gateadas por `es_super_admin()` como el resto:
  `admin_listar_super_admins()`, `admin_agregar_super_admin(target_id)` (el
  `<select>` para elegir a quién agregar se arma con la misma lista de
  `state.adminMembers` que ya usa la tabla de miembros, no hay una query
  aparte) y `admin_quitar_super_admin(target_id)` — esta última **no deja
  quitar al último súper admin que queda** (tanto a nivel de base de datos
  como deshabilitando el botón "Quitar" en el cliente cuando solo queda uno),
  para que la comunidad nunca se quede sin nadie que pueda entrar a HQ
  Metales.
- **Importante para depurar "¿por qué esta persona ve HQ Metales?"**: lo único
  que importa es si su `user_id` está en `super_admins` — el nombre que
  esa persona haya cargado en "Mi perfil" es irrelevante y puede llevar a
  confusión (una cuenta de prueba puede tener el nombre de otra persona
  cargado ahí). Para verificar rápido quién es admin de verdad, cruzar
  `auth.users` contra `super_admins` directo por `user_id`, no fiarse del
  nombre mostrado en pantalla.
- El botón amarillo/dorado "⚙ HQ Metales" en el sidebar solo se muestra si
  `checkSuperAdmin()` (que llama a `es_super_admin()` vía RPC) devuelve
  `true`. La protección real no es esa: son las funciones `security definer`
  (`admin_listar_miembros`, `admin_suspender_usuario`, `admin_eliminar_perfil`,
  `admin_stats_*`), que devuelven vacío o lanzan excepción si quien llama no
  es super admin, sin importar qué haga el JS del cliente.
- Layout pedido explícitamente por el dueño: la tabla de miembros va
  **arriba de todo** (antes que las tarjetas y los gráficos), no al final.
- `#section-admin` vive **fuera** de `.app-content-inner` (a diferencia de
  las otras 3 secciones), a propósito: `.app-content-inner` está acotado a
  960px de ancho, y la tabla de miembros necesitaba más espacio horizontal
  para que las columnas entraran sin scroll. Tiene su propio `max-width:1400px`
  centrado. Si se agrega contenido nuevo a esta sección hay que acordarse de
  que no comparte el ancho angosto del resto de la app.
- Si quien inicia sesión es súper admin, `enterApp()` lo manda directo a
  "HQ Metales" (no a "Buscar en la comunidad") una vez que el perfil ya está
  completo, aunque en el sidebar el botón "⚙ HQ Metales" va **al final**
  (después de "Mi perfil"), no primero — el auto-redirect al entrar es
  independiente del orden visual del menú.
- La tabla combina nombre + apellido en una sola columna angosta (antes eran
  dos columnas separadas) y usa `table-layout:fixed` con un `<colgroup>` que
  define el ancho inicial de cada columna (en vez de `.admin-table
  th:nth-child(N)`, que se sacó — el `colgroup` es lo que ahora manda) +
  `text-overflow:ellipsis` (más el atributo `title` para ver el valor
  completo al pasar el mouse). La columna "Acciones" es la única con
  `overflow:visible` y `white-space:normal` — si los botones quedan muy
  angostos, el texto se envuelve dentro del botón en vez de que la fila haga
  wrap por botón entero (ya pasó una vez: hay que mantener `.admin-table
  .btn{white-space:nowrap;flex-shrink:0;}` para que cada botón se ajuste como
  bloque, no que la palabra se corte a la mitad).
- **Las columnas de HQ Metales se pueden ensanchar a mano** (pedido explícito
  del dueño): `setupAdminTableResize()` agrega un `.admin-table-resize-handle`
  al borde derecho de cada `<th>` (menos el último) y, al arrastrarlo, ajusta
  el `width` en píxeles del `<col>` correspondiente del `colgroup`. Se llama
  una sola vez al cargar la página (el `thead`/`colgroup` son estáticos; solo
  el `tbody` se vuelve a renderizar en cada `renderAdminTable()`), no hay que
  volver a llamarla en cada render o se duplicarían los handles.
- El orden de los botones de acción es **Suspender, Eliminar, Reactivar**
  (decisión explícita del dueño, no alfabético ni por severidad).
- **Nombre y apellido se capitalizan siempre** (primera letra de cada
  palabra en mayúscula), tanto al guardar el perfil (`capitalizarNombre()`
  en el submit de `profileForm`) como al mostrarlos en cualquier lado (tabla
  de HQ Metales, resultados del buscador, modal de contacto, saludo del
  header, precarga del formulario de "Mi perfil"). Se aplica en las dos
  puntas a propósito: así los nombres que ya estaban guardados en minúscula
  (de antes de esta regla) también se ven bien, sin necesitar una migración
  de datos.
- Suspender/Reactivar/Eliminar van uno al lado del otro (no apilados), **los
  3 siempre visibles en cada fila** (decisión explícita del dueño: en vez de
  ocultar "Reactivar" cuando la persona ya está activa, el botón siempre está
  ahí pero no hace nada si se lo clickea sobre alguien activo — se chequea
  `data-suspendido="true"/"false"` en el handler de click antes de llamar a
  `admin_suspender_usuario`). Colores distintos por severidad: `.btn-warning`
  (naranja) para Suspender, `.btn-success` (verde) para Reactivar, `.btn-danger`
  (rojo) para Eliminar.
- El título "HQ Metales" tiene fondo amarillo/dorado con letras negras
  (`#section-admin .app-section-head h2`, no afecta el estilo de título de
  las otras secciones porque está scopeado a `#section-admin`).
- Los headers ordenables (`th[data-sort]`) siempre muestran un ⇅ tenue como
  pista de que son clickeables; al ordenar, cambia a ▲/▼ según la dirección.
- Los gráficos son barras hechas a mano en HTML/CSS (sin librería):
  - "Publicaciones por rubro" usa un color fijo por categoría
    (`CATEGORY_COLORS`, mismas claves que el array `CATEGORIES` del buscador
    — si se agrega un rubro nuevo hay que sumarlo en los dos lugares).
  - "Altas de miembros por día", "Mensajes por día" y "Contactos por día"
    comparten el mismo relleno de 30 días en cero (`construirRangoDias()`,
    reutilizado por `renderAdminChartPorDia()` para las tres) aunque no haya
    datos ese día (si no, con pocos datos el gráfico se ve vacío/inentendible),
    y solo ponen etiqueta de fecha cada 6 días para no amontonar texto — pero
    el tooltip al pasar el mouse siempre tiene la fecha completa. Los cuatro
    gráficos muestran un subtítulo con el total del período al lado del
    título, para que el número tenga contexto.
- El panel muestra, de arriba a abajo: la tabla de miembros (con las columnas
  de tráfico, ver más abajo), 5 tarjetas de estadísticas (miembros totales,
  nuevos en los últimos 7 días, suspendidos, mensajes totales, contactos en
  los últimos 7 días), 4 gráficos de barras (publicaciones por rubro, altas
  de miembros, mensajes y contactos por día) y una segunda tabla, "Mensajes
  de la comunidad", con **todos** los mensajes de la plataforma (De, Para,
  Publicación, Mensaje, Fecha) y un buscador de texto libre — a diferencia de
  la tabla de miembros, esta no tiene columnas ordenables (se mantiene
  siempre por fecha descendente, para no complicar el framework de sorteo
  existente por una tabla de solo-lectura).
- La tabla de miembros suma dos columnas sorteables más, **"Mensajes"** y
  **"Contactos"** (cuántos mensajes/contactos recibió cada persona), que
  vienen de `admin_listar_miembros()` — así HQ Metales puede ver, sin tabla
  nueva, quién le está generando más tráfico a la comunidad ("si a alguien le
  llevamos muchos clientes, que se pueda medir", pedido explícito del dueño).
  Como `admin_listar_miembros()` ya existía con otro `returns table`, hay que
  dropear la función antes de recrearla (`create or replace function` no deja
  cambiar el shape de retorno, a diferencia de las vistas que sí dejan
  *agregar* columnas al final).
- **Suspender**: `admin_suspender_usuario(target_id, hasta)` solo pisa
  `profiles.suspendido_hasta`. Un miembro suspendido:
  - No puede entrar a la app (ve `#suspendedView`).
  - No puede crear nuevas publicaciones (la policy `insert_own_publicaciones`
    de `publicaciones` chequea la suspensión a nivel de base de datos, no solo
    en el JS — alguien suspendido no puede publicar aunque llame a la API
    directo).
  - Sus publicaciones existentes desaparecen del buscador de la comunidad
    (`comunidad_publicaciones` filtra `suspendido_hasta`).
  No hace falta un cron para "reactivar" automáticamente: todo se compara
  contra `now()` en cada lectura, así que una suspensión con fecha vencida
  deja de aplicar sola.
- **Eliminar**: `admin_eliminar_perfil(target_id)` borra la fila de
  `profiles` (y en cascada sus `publicaciones`). **Importante**: esto NO
  elimina la cuenta de `auth.users` — hace falta la `service_role key` de
  Supabase para eso, que nunca debe vivir en el cliente (es la clave que
  bypassea todo RLS). La persona podría volver a entrar con su mismo login,
  pero sin perfil (se le pediría completarlo de nuevo, como si fuera nueva).
  Para borrar la cuenta de verdad — que no pueda ni loguearse — hay que
  hacerlo a mano desde el dashboard de Supabase (Authentication > Users).
  Si en algún momento se necesita hacerlo desde la app, requiere una Edge
  Function con la service_role key del lado del servidor, no del cliente.

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
  (un solo rubro, de la misma lista `CATEGORIES` del JS), `descripcion` y
  `tipo` (`'ofrezco'` o `'busco'`, con un `check` constraint en la base —
  distingue a quien ofrece un trabajo/artesanía de quien está buscando que
  se lo hagan o se lo vendan). El tipo se elige con un toggle de dos botones
  al crear la publicación (`#pubTipoToggle`, sin radios nativos) y se muestra
  en cada tarjeta con un borde de color + una badge: verde/"Ofrezco"
  (`.card-tipo-ofrezco` / `.badge-tipo-ofrezco`) o azul/"Busco"
  (`.card-tipo-busco` / `.badge-tipo-busco`).
- El buscador (`matchesFilters`) separa el término de búsqueda en palabras y
  exige que **todas** aparezcan en el texto de la publicación (título,
  descripción, categoría, nombre, ubicación), sin importar el orden — así
  "pulsera grabada" encuentra "pulsera plata grabada". No es una búsqueda
  exacta de substring.
- La vista `public.comunidad_publicaciones` hace el `join` entre ambas tablas
  para el buscador: expone los datos de la publicación (incluidos
  `foto_paths` y `likes_count`, agregados al **final** de la lista de
  columnas — nunca en el medio, por el mismo motivo del bug ya documentado
  más abajo) más los datos públicos de su autor (nombre, apellido,
  **`provincia`** — nunca `ubicacion` completa, ver "Privacidad" — y
  contacto), pero **nunca** dni, cuit ni el email de la cuenta. Al ser un
  `inner join`, una publicación de alguien que todavía no completó su
  perfil simplemente no aparece en el buscador — es el mecanismo (no una
  validación extra en la app) que obliga a completar el perfil antes de ser
  visible en la comunidad.
- Esta vista se otorga **solo a `authenticated`** (`grant select ... to
  authenticated`, sin `anon`), que es lo que hace cumplir la regla de "sin
  registrarte no ves nada de la comunidad". La vista vieja `directorio_publico`
  (que sí le daba acceso a `anon`) se dropeó en el esquema actual — si en
  algún momento se vuelve a exponer algo a `anon`, hay que revisar con cuidado
  que no filtre de vuelta datos que deberían quedar solo para miembros.
- **Importante sobre `create or replace view` vs. columnas nuevas**: Postgres
  no permite reordenar/insertar columnas en el medio de una vista existente
  con `or replace`, solo agregar al final (ya pasó una vez con la columna
  `tipo` y volvió a pasar al diseñar esto: hay que `drop view` + `create view`
  si se necesita insertar en el medio, o simplemente agregar siempre al final
  para no tener que dropear). Lo mismo aplica a funciones (`admin_listar_miembros`),
  pero ahí ni siquiera agregar al final funciona con `or replace` — las
  funciones necesitan `drop function` sí o sí para cambiar su `returns table`.

### Fotos en publicaciones

- Cada publicación puede tener **hasta 3 fotos opcionales**
  (`publicaciones.foto_paths`, un array de `text`), guardadas en un bucket de
  Supabase Storage llamado `publicaciones-fotos`. Se guardan los **paths**
  dentro del bucket, no las URLs completas — la URL pública de cada una se
  arma en el cliente con `fotoUrl(path)` (usa
  `supabase.storage.from(...).getPublicUrl()`), así que si el bucket cambia
  de nombre algún día no hace falta migrar datos. Originalmente era una sola
  foto (`foto_path`, columna simple) — se migró a array (`foto_paths`)
  cuando el dueño pidió permitir hasta 3; la migración en
  `supabase-schema.sql` mueve el valor viejo al array y dropea la columna
  vieja, con un chequeo de `information_schema` para que sea idempotente.
- **El bucket es público** (decisión explícita del dueño, confirmada antes de
  implementar): la URL de la foto es de acceso directo, igual que cualquier
  imagen pública en internet. Se consideró un bucket privado con URLs
  firmadas, pero se descartó por ser más complejo (URLs con vencimiento) para
  un dato que no es sensible (mismo nivel de privacidad que nombre/ubicación,
  nada que ver con DNI/CUIT).
- Cada persona solo puede subir/reemplazar/borrar archivos dentro de su
  propia carpeta (`{user_id}/...` dentro del bucket) — políticas de RLS sobre
  `storage.objects` que chequean `(storage.foldername(name))[1] = auth.uid()::text`,
  patrón estándar de Supabase Storage.
- Al crear una publicación (`#pubFoto` en el modal "Nueva publicación", con
  `multiple` y tope de 3 validado en el cliente), las fotos se suben todas en
  paralelo a Storage (con nombres aleatorios vía `crypto.randomUUID()`) y
  recién después se inserta la fila en `publicaciones` con el array de paths
  resultante — si falla la subida de alguna, no se crea la publicación.
- En "Mis publicaciones" cada card muestra sus fotos como una fila de
  miniaturas (`misPubFotosHtml()`), cada una con su propio botón "×" para
  quitarla, más un tile "+" para agregar otra si todavía hay menos de 3 — no
  hay edición de recorte/rotación (decisión explícita del dueño, para no
  meterse en la complejidad de un cropper), solo agregar/quitar fotos
  individuales del array. Al quitar una foto se borra su objeto de Storage
  recién después de confirmar que la fila se actualizó bien, para no perder
  datos si algo falla a mitad de camino.
- **Mostrar sin recortar + lightbox**: las cards (tanto en el buscador como
  en "Mis publicaciones") muestran la **primera** foto como miniatura
  (`.card-foto` usa `object-fit:contain`, no `cover`, para no recortarla; el
  tinte de fondo de la card — ver "Ofrezco/Busco" — se ve por detrás si la
  imagen no llena el recuadro) con un contador "1/3" si hay más de una.
  Clickearla abre `#lightboxModal`: una foto grande centrada con flechas
  para pasar a la siguiente/anterior si la publicación tiene más de una
  (`openLightbox(fotoPaths, indiceInicial)` / `state.lightboxFotos` /
  `state.lightboxIndex`). Desde "Mis publicaciones" se puede abrir el
  lightbox directo en cualquiera de las miniaturas, no solo la primera.
- Validación: solo `image/*`, tope de 5MB por foto, chequeado en el cliente
  antes de subir (no hay límite adicional configurado en el bucket de
  Supabase).

### Me gusta (likes)

- Corazón estilo Instagram en cada publicación (`.like-btn`), tanto en
  "Buscar en la comunidad" como (de solo lectura, sin toggle) en "Mis
  publicaciones" — no tendría sentido que alguien le dé like a su propio
  trabajo, así que en "Mis publicaciones" el corazón es solo un contador.
- Tabla `public.publicacion_likes` (PK compuesta `publicacion_id` + `user_id`):
  no es un dato sensible, así que cualquier `authenticated` puede leer toda
  la tabla (para poder mostrar el contador de cualquier publicación), pero
  insertar/borrar un like está limitado a la propia fila (`user_id = auth.uid()`).
  El insert también chequea que la persona no esté suspendida, mismo patrón
  que `insert_own_publicaciones`.
- El conteo se resuelve de dos formas distintas según el contexto (a
  propósito, cada una es la más simple para su caso): en el buscador, la
  vista `comunidad_publicaciones` ya trae `likes_count` calculado con una
  subquery; en "Mis publicaciones" (que consulta `publicaciones` directo, no
  la vista), se hace una segunda query contra la vista
  `public.publicaciones_likes_count` filtrada por los ids propios.
- Saber si **yo** ya le di like a algo (para pintar el corazón lleno/vacío)
  se resuelve con una query extra al cargar el buscador
  (`publicacion_likes` filtrada por mi `user_id`), guardada en
  `state.misLikedIds`. El toggle (`toggleLike()`) actualiza el estado y el
  contador in-place sin recargar toda la lista de resultados.

### Mensajería privada

- Pedido explícito del dueño: que los miembros puedan escribirse entre sí
  **a partir de una publicación puntual** (no un chat genérico), y que la
  persona que recibe un mensaje sepa siempre a cuál de sus publicaciones se
  refiere (importante si alguien tiene varias) — por eso `public.mensajes`
  tiene `publicacion_id` como columna obligatoria, no hay concepto de
  "conversación general" sin publicación asociada.
- No existe una tabla de "conversaciones": un hilo es simplemente el conjunto
  de filas de `mensajes` con el mismo `publicacion_id` y las mismas dos
  personas — se agrupa **en el cliente** (`agruparConversaciones()`), no en
  la base de datos.
- **Nueva sección "Mensajes"** (`#section-mensajes`, después de "Mis
  publicaciones" en el sidebar): lista de conversaciones
  con nombre de la otra persona, título de la publicación, último mensaje y
  un badge rojo si hay mensajes sin leer. Al clickear una, abre
  `#conversationModal` con el hilo completo (burbujas `.msg-bubble-mine` /
  `.msg-bubble-other`) y un textarea para responder.
- Desde una card del buscador se puede arrancar una conversación nueva con el
  botón "Mensaje" (no se muestra en las publicaciones propias, no tendría
  sentido escribirse a uno mismo — el `check (remitente_id <> destinatario_id)`
  en la tabla lo bloquea también a nivel de base de datos). Tanto "abrir un
  hilo existente" como "empezar uno nuevo" pasan por la misma función,
  `openConversation(publicacionId, otraId, publicacionTitulo, otraNombre)`.
- La vista `public.mensajes_detalle` resuelve el problema de mostrar nombre y
  apellido de ambas puntas de la conversación sin exponer `profiles` en
  general: hace el join con `profiles` dos veces (remitente y destinatario) y
  filtra con `where remitente_id = auth.uid() or destinatario_id = auth.uid()`
  **dentro de la vista misma** — mismo mecanismo ya usado en
  `comunidad_publicaciones` para exponer datos de terceros de forma
  controlada.
- **Marcar como leído está restringido a nivel de columna, no solo de fila**:
  `revoke update on public.mensajes from authenticated; grant update (leido_at) ...`
  — así el destinatario puede marcar un mensaje como leído, pero no puede
  reescribir su contenido (`cuerpo`) llamando a la API directo. Se marca como
  leído automáticamente al abrir el hilo de esa conversación
  (`marcarComoLeidos()`).
- **Notificaciones sin Realtime, a propósito** (decisión explícita, para no
  sumar otra integración frágil a un proyecto que ya tuvo bastantes dolores
  de cabeza con OAuth/hash): el contador de no-leídos (`loadUnreadCount()`)
  se refresca al entrar a la app, en cada cambio de sección
  (`showAppSection()` lo llama siempre) y con un `setInterval` cada 45
  segundos mientras `appView` está visible (se limpia el intervalo al salir
  de la app o desloguearse, para no dejarlo corriendo en segundo plano).
- **Aviso por mail**: además del badge dentro del sitio, cuando se inserta un
  mensaje se dispara un mail al destinatario mediante una Edge Function de
  Supabase (`supabase/functions/notificar-mensaje/index.ts`) conectada por un
  Database Webhook (`insert` en `public.mensajes`). La función usa la
  `service_role key` (inyectada automáticamente por Supabase en cualquier
  Edge Function, nunca vive en el cliente) para buscar el email del
  destinatario y manda el mail vía la API de **Resend**. Ver "Configuración
  pendiente" más abajo para los pasos manuales de despliegue — **importante**:
  sin verificar un dominio propio en Resend, solo se puede mandar mail a la
  casilla con la que te registraste ahí (modo sandbox), no a cualquier
  miembro de la comunidad.

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
- **La dirección exacta (`profiles.ubicacion`, con calle y altura) nunca se
  expone al resto de la comunidad** — solo la ve el dueño del perfil (en "Mi
  perfil") y HQ Metales (`admin_listar_miembros()`). Al resto de los
  miembros, el buscador les muestra únicamente `profiles.provincia` (ej.
  "CABA"), una columna separada que se completa sola con `address.state` de
  la sugerencia de Nominatim elegida — nunca se deriva de `ubicacion` en el
  cliente, porque exponer eso significaría igual mandar la dirección
  completa al navegador y solo recortarla visualmente (fácil de esquivar
  mirando la respuesta de la red). Fue un ajuste que se hizo después de
  notar que el buscador mostraba la dirección completa de la gente a
  cualquier miembro logueado, no solo la provincia — si se vuelve a tocar
  esta vista, hay que tener cuidado de no reintroducir esa columna.
- La interacción entre usuarios se resuelve tanto con enlaces directos a
  WhatsApp (`wa.me`), Instagram y un email de contacto público opcional, como
  con la mensajería privada propia del sitio (ver sección de Mensajería más
  arriba) — los mensajes solo los pueden leer las dos personas de la
  conversación (y HQ Metales, ver más abajo), nunca terceros.
- **Los clicks reales en un botón de contacto (WhatsApp/Instagram/email) se
  registran** en `public.contactos` (publicación, quién visitó, por cuál
  medio) para que HQ Metales pueda medir cuánto tráfico le genera la
  comunidad a cada persona — pedido explícito del dueño ("si a alguien le
  llevamos muchos clientes, que se pueda medir"). Es analítica **interna**:
  la tabla no tiene política de `select` para usuarios normales (mismo patrón
  que `super_admins`), solo se lee a través de las funciones de admin. Ni la
  persona que contactó ni la que fue contactada pueden ver este registro
  desde la app.
- **HQ Metales tiene acceso a todos los mensajes de la plataforma**
  (`admin_listar_mensajes()`, ver sección de HQ Metales), no solo a
  estadísticas agregadas — es una decisión explícita del dueño ("acceso al
  total de los mensajes que pasan en la página"), a diferencia del resto de
  la privacidad del sitio donde ni siquiera el admin ve DNI/CUIT/email de
  cuenta. Si en algún momento se quiere restringir esto (por ejemplo, que el
  admin solo vea metadata y no el `cuerpo` del mensaje), hay que tocar
  `admin_listar_mensajes()` en `supabase-schema.sql`.
- El código fuente vive en GitHub en `alanzetaa/MetalesJulio` (público),
  `index.html` en la raíz. El sitio se sirve en producción desde **Vercel**
  (https://metalesjulio.vercel.app/), conectado a ese repo: cada `git push` a
  la rama principal dispara un deploy automático, sin build step (Vercel lo
  sirve como estático, preset "Other"). GitHub Pages se usó al principio pero
  quedó con un bug de deploys que no se pudo resolver, así que se migró a
  Vercel; el repo en sí sigue siendo público solo porque así se creó, no
  porque GitHub Pages lo requiera ya.

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

Para que el **aviso por mail de mensajes nuevos** funcione (ver sección de
Mensajería privada), faltan estos pasos manuales, ninguno lo puede hacer
Claude porque requieren crear cuentas/pegar código en dashboards externos:

1. Crear una cuenta gratis en https://resend.com y conseguir un API key.
2. En Supabase Dashboard > Edge Functions > "New function", pegar tal cual el
   contenido de
   [supabase/functions/notificar-mensaje/index.ts](supabase/functions/notificar-mensaje/index.ts)
   (no hace falta instalar la CLI de Supabase ni Node para esto).
3. Cargar `RESEND_API_KEY` como secret de esa función (Edge Functions >
   Settings). `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` ya los inyecta
   Supabase automáticamente, no hace falta cargarlos a mano.
4. En Supabase Dashboard > Database > Webhooks, crear un webhook: evento
   `insert` sobre la tabla `mensajes`, apuntando a la Edge Function del
   paso 2.
5. Mandar un mensaje de prueba y confirmar que llega el mail. **Ojo**: sin
   verificar un dominio propio en Resend (Resend > Domains, un par de
   registros DNS), solo va a llegar si el destinatario de la prueba es la
   misma casilla con la que te registraste en Resend (modo sandbox) — para
   que le llegue a cualquier miembro de la comunidad hace falta verificar un
   dominio real (por ejemplo un subdominio de tiendametalesjulio.com.ar).

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

- No hay moderación de contenido ni verificación real de identidad más allá de
  pedir el DNI/CUIT al registrarse.
- No hay edición de publicaciones ya creadas más allá de la foto (título,
  categoría, descripción y tipo son solo alta y borrado).
- Publicaciones "guardadas/favoritas" para que alguien pueda volver a
  encontrarlas después sin tener que buscarlas de nuevo.
- Mini perfil público al hacer click en el nombre de alguien en un resultado
  de búsqueda, mostrando todas sus publicaciones juntas (hoy cada resultado
  se ve de forma aislada, sin poder ver el resto del trabajo de esa persona).
- Reseñas o calificación entre usuarios después de concretar un contacto.

## Convenciones

- Todo el contenido de cara al usuario va en español (Argentina).
- Mantener el sitio como un único `index.html` autocontenido; no introducir un
  build step (webpack/vite) a menos que el proyecto crezca lo suficiente como
  para justificarlo. El backend vive enteramente en Supabase (DB + Auth +
  Storage + Edge Functions), no hay servidor propio que mantener.
