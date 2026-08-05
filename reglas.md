# Reglas de la plataforma — Comunidad Metales Julio

Este archivo es distinto de [CLAUDE.md](CLAUDE.md): CLAUDE.md documenta **cómo
está armado** el código (arquitectura, componentes, tablas). Acá se
documentan las **reglas de negocio** — el "por qué" y "cómo se comporta" la
comunidad de cara a la gente que la usa — para que se puedan leer y discutir
sin tener que meterse en detalles de implementación. Cuando una regla de acá
tiene un impacto técnico concreto, se linkea a la sección correspondiente de
CLAUDE.md.

## Mi perfil — validaciones

- **CUIT con check verde en vivo**: mismo patrón que Biddit — al escribir un
  CUIT que pasa la validación de dígito verificador (algoritmo mod 11, el
  mismo que usa AFIP/ARCA, en `web/src/utils/cuit.ts`) aparece un ✓ verde al
  lado del campo, igual que ya pasaba con "Ubicación" al elegir una
  sugerencia de Nominatim (mismas clases CSS `.check-wrap`/`.check-status`,
  copiadas de `.dir-wrap`/`.dir-status` pero con nombre genérico porque ya no
  es solo para direcciones). El campo sigue siendo opcional; si se completa,
  tiene que pasar la validación para poder guardar el perfil.
- **Bug real encontrado y arreglado — sugerencias de ubicación duplicadas**:
  Nominatim a veces devuelve varios resultados crudos (distintos tramos de
  la misma calle, distintos IDs internos) que, una vez simplificados con
  `formatUbicacionSugerencia` (calle + localidad + provincia, sin el resto
  del detalle), quedan con exactamente el mismo texto — la lista de
  sugerencias mostraba "Avenida San Martín, Buenos Aires..." repetido 4 o 5
  veces. Se arregló deduplicando en `useNominatimSearch` **por el texto ya
  formateado**, no por el resultado crudo de la API (deduplicar por ID no
  hubiera arreglado nada, porque el problema es que texto distinto-por-ID se
  ve igual una vez simplificado).

## Mensajería interna exclusiva (sin contacto directo)

**La plataforma sobrevive del intercambio de mensajes.** Si desde el primer
segundo le mostramos a cualquiera el WhatsApp o el Instagram de la persona
que publicó, esa persona se va de la plataforma apenas encuentra lo que
buscaba y no vuelve más — ni ella ni quien la contactó. Manteniendo todo el
intercambio adentro (mensajería propia del sitio), la gente tiene un motivo
para volver a entrar.

Por eso:

- **Ya no hay botón "Contactar"** en las publicaciones ni en el buscador.
  El único canal para que alguien se comunique con otra persona es el botón
  **"Mensaje"** (mensajería privada interna, ya existente).
- Los campos `whatsapp`, `instagram` y `contacto_email` del perfil **no se
  borraron** (siguen en la base y en el formulario de "Mi perfil") por si en
  algún momento se decide reactivar el contacto directo — pero hoy no se
  muestran a otros miembros ni se usan para nada visible en el buscador ni
  en las publicaciones.
- La tabla `contactos` (que registraba cada click en un botón de contacto,
  para medir tráfico en HQ Metales) deja de sumar filas nuevas a partir de
  este cambio — los datos viejos quedan como registro histórico, y las
  tarjetas/gráficos de "Contactos" en HQ Metales siguen andando pero ya no
  van a crecer. Si en el futuro se reactiva el contacto directo, vuelven a
  sumar solas.

**Buscador en "Mensajes"**: la lista de conversaciones (`MensajesPage`) tiene
un buscador de texto libre (`matchesConversacionSearch` en
`utils/conversations.ts`) con el mismo criterio que el buscador de "Buscar en
la comunidad" (`matchesFilters`): separa el término en palabras y exige que
todas aparezcan, sin importar el orden, sobre el nombre de la otra persona,
el título de la publicación y el texto del último mensaje — así "pulsera
sofia" encuentra una conversación con Sofía sobre una pulsera aunque esas
palabras no estén juntas. Solo se muestra si la persona ya tiene alguna
conversación (no tiene sentido mostrar un buscador vacío antes del primer
mensaje).

## Orden del feed ("Buscar en la comunidad")

Objetivo: que una publicación nueva tenga visibilidad inmediata, pero que
con el tiempo **no sean siempre las mismas 3 personas** las que aparecen
arriba de todo — y que el "me gusta" (♥) sí cuente para destacarse.

- **Primeras 24 horas**: la publicación aparece arriba de todo, ordenada por
  fecha de creación (más nueva primero) — mismo criterio de siempre.
- **Después de 24 horas**: la publicación pasa a un "pozo" que se reordena
  de forma **aleatoria pero ponderada por likes**: cuantos más "me gusta"
  tiene, más probabilidad (no garantía) tiene de aparecer arriba. Nunca es
  un ranking fijo por likes — sigue habiendo variedad, solo que el esfuerzo
  se nota más que en un sorteo 100% ciego.
- El orden aleatorio **se recalcula una vez por día** (semilla = fecha del
  día + id de la publicación), no en cada visita ni en cada scroll — así
  todos los que entran el mismo día ven un orden parecido y estable (no
  cambia si volvés a entrar 10 veces en la misma tarde), y al día siguiente
  se vuelve a barajar solo.
- Fórmula (ver `src/utils/feedOrder.ts`): `score = azarDelDía(id) × (1 +
  likes × 0.15)`. Un valor de peso más alto haría que los likes pesen más
  fuerte; 0.15 fue elegido para que influya sin volverse un ranking rígido.

**"Buscar en la comunidad" no muestra las publicaciones propias** (pedido
explícito del dueño) — cada persona ve las suyas desde "Mis publicaciones",
no mezcladas con los resultados de búsqueda de terceros. Se filtran por
`autor_id !== userId` antes de aplicar el resto de los filtros
(`BuscarPage.tsx`, `sinPropias`).

**Pantalla de búsqueda simplificada** (pedido explícito del dueño, "tiene
que ser muy sencillo"): se sacó el contador de "N resultados" (para ganar
espacio en pantalla, sobre todo en celular) y la fila de chips de rubro
("Todos", "Soldadura", etc.) — quedaba redundante con el desplegable
"Rubro" que ya existe en el panel de búsqueda y mareaba con dos controles
haciendo lo mismo. El desplegable sigue siendo el único filtro de rubro.

## Feed infinito (scroll estilo Instagram)

**Pedido explícito del dueño**: en el celular, "Buscar en la comunidad"
tiene que sentirse como Instagram — aparece una publicación, uno va
scrolleando y van apareciendo más solas, sin tener que tocar un botón de
"página siguiente" ni nada parecido.

- `useInfiniteReveal` (`src/hooks/`) va revelando de a 10 publicaciones más
  a medida que el usuario se acerca al final de la lista (un
  `IntersectionObserver` sobre un elemento invisible al final). Cada
  búsqueda o cambio de rubro nuevo arranca mostrando de nuevo solo las
  primeras 10, no arrastra la cantidad que se había revelado antes.
- **Importante — esto NO es paginado real contra el servidor todavía**: la
  lista completa de publicaciones de la comunidad se sigue trayendo en una
  sola consulta (como ya se hacía), y lo que cambia es cuánto se dibuja en
  pantalla. Para el tamaño actual de la comunidad esto anda perfecto y es
  mucho más simple que coordinar paginado real del servidor con el orden
  aleatorio ponderado del feed (ver sección de arriba). **Si la comunidad
  crece mucho** (miles de publicaciones), en algún momento va a hacer falta
  pasar a traer de a tandas desde la base de datos en vez de todo junto —
  eso sí es un cambio más grande, para charlar cuando haga falta.
- En el celular esto ya se siente como Instagram porque las cards ya
  ocupan una sola columna en pantallas angostas (el grid de tarjetas ya
  estaba armado así, `minmax(270px, 1fr)` no deja entrar una segunda
  columna en un teléfono común) — no hizo falta un diseño nuevo para eso,
  solo el scroll infinito.

## Notificaciones de mensajes nuevos

- **Dentro de la plataforma**: el badge rojo en "Mensajes" del menú lateral
  ya mostraba la cantidad de mensajes sin leer. Se suma un aviso tipo toast
  al entrar a la app ("Tenés 2 mensajes nuevos") la primera vez que se
  detectan mensajes sin leer en la sesión, para que sea prácticamente
  imposible no darse cuenta.
- **Por mail**: cada persona puede elegir en "Mi perfil" si quiere recibir
  un mail cada vez que le llega un mensaje nuevo — casilla **"Avisarme por
  mail cuando reciba un mensaje"**, **tildada por default**. Si alguien la
  destilda, no le llega más mail (el mensaje sigue estando disponible
  adentro de la plataforma con su badge, esto solo apaga el mail).
  La Edge Function `notificar-mensaje` chequea esta preferencia antes de
  mandar el mail — ver [CLAUDE.md, sección de Mensajería](CLAUDE.md).
- **Por WhatsApp**: no implementado. Mandar un WhatsApp automático (a
  diferencia del mail, que es gratis con Resend hasta cierto volumen)
  requiere un servicio de terceros de pago (por ejemplo la API oficial de
  WhatsApp Business, o un intermediario como Twilio), con un proceso de
  verificación de negocio y un costo por mensaje enviado — no es algo que
  se pueda activar gratis ni en un rato. Queda anotado como posible mejora
  futura si en algún momento se decide pagar ese servicio.
- **Agrupado de mensajes seguidos (evita mandar un mail por cada uno)**:
  pedido explícito del dueño, le preocupa el costo por mail además de ser
  molesto para quien lo recibe — alguien que escribe "Hola", "como",
  "estas", "?" en globitos separados generaba 4 mails distintos por una
  sola idea. `notificar-mensaje` ahora chequea, antes de mandar el mail, si
  ya existe otro mensaje del mismo remitente al mismo destinatario sobre la
  misma publicación en los **últimos 5 minutos** — si lo hay, no manda
  otro mail (el resto de los mensajes de esa tanda se ven igual adentro de
  la plataforma, con su badge de no-leídos). El mail que sí se manda **no
  muestra el texto del mensaje** (a propósito: al poder representar varios
  mensajes seguidos agrupados, mostrar solo el primero quedaba confuso o
  cortado a la mitad de una idea — pasó en la prueba real, ver más abajo),
  solo el aviso genérico + un link para entrar a la plataforma y leer la
  conversación completa ahí.
  **Importante**: como esta función se despliega copiando el archivo a
  mano en el dashboard de Supabase (no hay auto-deploy vía git para Edge
  Functions en este proyecto), cualquier cambio a
  `supabase/functions/notificar-mensaje/index.ts` necesita que alguien
  vuelva a pegarlo en Supabase Dashboard > Edge Functions > notificar-mensaje
  para que tenga efecto real — el commit a git por sí solo no alcanza.

## Actualización de datos sin recargar la página a mano

**El pedido original era "que la página se recargue cada 30 segundos"** para
que a nadie se le pasen mensajes nuevos por no apretar F5. Se implementó el
mismo objetivo de otra forma, a propósito:

- La app ya consultaba solita, en segundo plano, si había mensajes nuevos
  (antes cada 45 segundos) sin que la persona tuviera que hacer nada — esto
  se bajó a **cada 30 segundos**, como se pidió.
- **No se implementó como un recargado completo de la página** (`F5`
  automático) porque eso resetea cualquier cosa que la persona esté haciendo
  en ese momento — a mitad de escribir una publicación, un mensaje, con un
  modal abierto — lo cual sería una experiencia peor que el problema que se
  quiere resolver (y en el celular, further, se nota mucho más). Con la
  consulta en segundo plano cada 30 segundos, el badge y el aviso de
  mensajes nuevos se actualizan solos sin que nadie pierda lo que estaba
  haciendo. Si en algún momento se prefiere el recargado literal de la
  página, es un cambio chico de revertir — avisar antes de tocarlo de nuevo
  porque ya se decidió así una vez.

## Velocidad al cambiar de pantalla (caché de React Query)

**Pedido del dueño**: que la plataforma se sienta más rápida y dinámica al
moverse entre pantallas. Midiendo antes de tocar nada, la causa principal
era que `new QueryClient()` estaba **sin configurar** en `App.tsx`: el
default de React Query es `staleTime: 0`, o sea que considera todos los
datos vencidos al instante y **vuelve a pedirle todo a Supabase en cada
cambio de pantalla**, mostrando "Cargando…" aunque se hubiera estado ahí
tres segundos antes. Entrar a "Buscar en la comunidad" son 4 consultas
(publicaciones, mis likes, mis guardados, no-leídos), y la latencia medida
contra Supabase es de ~140ms cada una.

La configuración que se puso:
- `staleTime: 60_000` — un minuto de "fresco". Moverse entre pantallas
  dentro de ese rato no pide nada de red: se muestra al instante lo que ya
  está en memoria. Pasado el minuto vuelve a pedir, pero mostrando los
  datos viejos mientras tanto (sin pantalla de carga).
- `refetchOnWindowFocus: false` — volver a la pestaña del navegador ya no
  recarga todo. Los mensajes nuevos se siguen detectando aparte, con el
  chequeo propio cada 30s de `useUnreadCount`.
- `retry: 1` — el default son 3 reintentos con espera creciente; si
  Supabase no responde, la persona se comía varios segundos antes de ver
  el error.

**Verificado con una medición, no a ojo**: navegando 5 veces entre dos
pantallas, las llamadas de red pasaron de **4 a 1**.

**Por qué es seguro cachear acá**: los likes y guardados no dependen de
volver a pedir — actualizan la caché directamente con `setQueryData`
(`useLikes`/`useGuardados`), así que el cacheo los mejora en vez de
romperlos. Y todo lo que sí necesita refrescar de verdad usa
`invalidateQueries`, que fuerza el pedido sin importar el `staleTime`.

**Caso borde que hubo que cerrar**: las acciones de HQ Metales (suspender,
reactivar, eliminar a alguien, eliminar una publicación) cambian lo que se
ve en "Buscar en la comunidad" — `comunidad_publicaciones` filtra a los
suspendidos y ya no incluye lo eliminado. Antes esto se auto-corregía sin
querer, porque navegar volvía a pedir todo; con caché había que hacerlo
explícito, así que `refetch()` en `AdminPage` ahora también invalida
`COMUNIDAD_PUBLICACIONES_KEY`. **Si se agrega una acción nueva de admin que
afecte lo que se ve en el feed, hay que acordarse de invalidar esa clave
también.**

**Lo que queda pendiente (medido, no hecho todavía)**: el sitio descarga
621kB y tarda ~5,6s en terminar de cargar del todo. Los dos pesos pesados
son el bundle principal (370kB: React, Router, React Query, y también zod +
react-hook-form, que solo hacen falta para los formularios) y el cliente de
Supabase (211kB, aparece con el nombre `format-*.js` por casualidad de cómo
Vite nombra los chunks). Los modales de login/registro se descargan siempre
en la landing pública aunque el visitante nunca haga click en "Ingresar" —
hacerlos `lazy` sería la siguiente mejora concreta.

## Título y descripción de publicaciones: primera letra en mayúscula

**Pedido explícito del dueño**: igual que ya pasaba con nombre/apellido
(ver CLAUDE.md), el título y la descripción de una publicación se
capitalizan (`capitalizarOracion` en `utils/format.ts`) — a diferencia de
`capitalizarNombre` (que pone cada palabra en mayúscula, para nombres
propios), acá solo se toca la primera letra de todo el texto, dejando el
resto tal cual lo escribió la persona.

Se aplica **en las dos puntas**, mismo criterio que nombre/apellido: al
guardar (`NuevaPublicacionModal.tsx`, para que las publicaciones nuevas ya
queden bien guardadas) y al mostrar (`PublicacionCard.tsx`,
`MisPublicacionCard.tsx`, `AdminPublicacionesTable.tsx`, y en todos los
lugares donde se muestra el título de la publicación asociada a una
conversación: `agruparConversaciones()`, y los 3 lugares donde se abre una
conversación nueva desde una card en Buscar/Guardados/Mini perfil público)
— así las publicaciones viejas, guardadas en minúscula antes de este
cambio, también se ven bien sin necesitar migrar datos.

**No se aplica** al cuerpo de los mensajes privados ni al comentario de
una denuncia — esos son texto textual de la persona (en una denuncia
puntualmente funciona como una especie de "declaración", tiene más sentido
dejarlo tal cual se escribió que prolijizarlo).

## Fotos de publicaciones: formato uniforme

- **Antes**: cada foto se mostraba "sin recortar" (podía quedar con espacios
  en blanco a los costados si la foto no tenía la misma proporción que el
  recuadro de la card) — buscando no perder nunca el encuadre real de la
  foto.
- **Ahora**: para que la comunidad se vea prolija y pareja (estilo
  Instagram), las miniaturas en las cards usan un **formato cuadrado fijo
  (1:1)**, recortando al centro las fotos que no sean cuadradas. Es un
  recorte solo visual (CSS) — el archivo original que subió la persona
  **no se modifica ni se pierde**, sigue intacto en Storage.
- **El lightbox (foto grande a pantalla completa) sigue mostrando la foto
  completa, sin recortar** — así nunca se pierde el detalle real de lo que
  se subió, solo se recorta la miniatura chica de la card para que la
  grilla se vea uniforme.
- No se agregó un editor de recorte interactivo (elegir manualmente qué
  parte de la foto recortar) — sigue siendo, a propósito, la misma decisión
  ya tomada antes de no meterse con la complejidad de un cropper. Si en el
  futuro se necesita que la persona elija qué parte de su foto se recorta,
  es una mejora aparte.
- **Tope de fotos por publicación: 2 (antes 3).** Se bajó para cuidar el
  margen de espacio del plan gratuito de Supabase (500MB entre base de
  datos y Storage, y las fotos son casi todo lo que ocupa ese espacio) — con
  el tope en 3 fotos, la comunidad llegaba al límite mucho antes. Bajarlo a
  2 estira notablemente cuántas publicaciones con fotos entran antes de
  necesitar pasar a un plan pago. Es solo una constante
  (`MAX_FOTOS` en `src/utils/publicaciones.ts`), fácil de subir de nuevo si
  en algún momento se pasa a un plan con más espacio.

## Diseño visual

Se mantiene la paleta e identidad de marca (dorado/negro, tipografía
Montserrat — ver "Identidad visual" en CLAUDE.md), pero se subió el nivel de
pulido general: más aire entre elementos, sombras más suaves, mejor
jerarquía tipográfica, el corazón de "me gusta" más grande y con mejor
respuesta visual al tocarlo, y todo pensado primero para el celular — la
mayoría de la gente va a encontrarse con la comunidad scrolleando desde el
teléfono, no desde una computadora.

## Términos y Condiciones

**Aceptarlos es obligatorio para poder publicar o mandar mensajes** — sin
tildar la casilla en "Mi perfil", `perfilSchema` rechaza el formulario y no
se puede guardar. El texto se muestra en un modal (`TerminosModal` /
`TerminosContenido`, en `src/components/perfil/`), accesible con un link al
lado de la casilla — se puede leer sin tildarla.

La idea central del texto (pedida explícitamente por el dueño, es la base
de todo lo demás que diga): **la plataforma solo conecta gente, no
interviene ni se beneficia de ninguna compra/venta/trabajo pactado entre
miembros** — todo acuerdo, pago, calidad y cumplimiento es responsabilidad
exclusiva de las partes involucradas, sin responsabilidad de Metales Julio.

**El texto actual es un punto de partida genérico**, escrito para poder
completar el perfil ya mismo — está pensado para revisarse/reemplazarse más
adelante (por ejemplo, con ayuda de un abogado) antes de que la plataforma
tenga uso real más allá de amigos probando.

**También se puede leer sin estar registrado**: el footer de la vista
pública (`PublicLandingPage.tsx`) tiene un link "Términos y Condiciones"
que abre el mismo `TerminosModal` — reutilizado tal cual, sin duplicar el
texto en ningún lado. Ese mismo footer tiene el aviso de copyright ("©
{año} Comunidad Metales Julio — Todos los derechos reservados").

### Una vez aceptados, quedan bloqueados (no se puede "desaceptar")

**Pedido explícito del dueño, regla importante**: apenas alguien acepta la
versión actual de los Términos, la casilla en "Mi perfil" pasa a mostrarse
**tildada, gris y bloqueada** (no se puede interactuar con ella), junto con
la fecha y hora exacta en que se aceptó (`terminos_aceptados_at`,
formateada con `formatFecha`). No hay forma de "desmarcarla" y dejar de
haber aceptado — ni por accidente ni a propósito.

Esto se resuelve en `PerfilPage.tsx` mostrando dos variantes visuales según
si `profile.terminos_version_aceptada === TERMINOS_VERSION_ACTUAL`: si ya
aceptó, se muestra un checkbox puramente decorativo (`checked disabled`,
no registrado en el formulario); si no, el checkbox interactivo de
siempre. Al guardar, el valor sigue mandándose igual (`react-hook-form`
conserva el valor de un campo aunque deje de estar registrado en pantalla,
ver test `PerfilPage.test.tsx` que confirma esto puntualmente) — verificado
con un test dedicado porque es una regla que no se puede permitir que se
rompa silenciosamente.

Si en el futuro se sube `TERMINOS_VERSION_ACTUAL` (ver más abajo), el
bloqueo se levanta solo para la persona que había aceptado la versión
vieja — vuelve a ver el checkbox interactivo, tiene que aceptar la versión
nueva, y una vez que lo hace se vuelve a bloquear con la fecha nueva.

### Versionado — clave si el texto cambia más adelante

**Pedido explícito del dueño, importante**: si en el futuro se actualiza el
texto de los Términos, **a todas las personas les tiene que volver a
aparecer la casilla destildada, y no van a poder publicar ni mandar
mensajes hasta que vuelvan a aceptar** — no alcanza con que ya la hayan
tildado una vez en el pasado.

Por eso no se guarda un simple `true`/`false`, se guarda un **número de
versión**:
- `TERMINOS_VERSION_ACTUAL` vive en `web/src/constants/terminos.ts`.
- `profiles.terminos_version_aceptada` (entero, arranca en `0` = "nunca
  aceptó nada") guarda qué versión aceptó cada persona, más
  `terminos_aceptados_at` (timestamp de esa aceptación).
- "¿Puede publicar/mandar mensajes?" siempre se resuelve comparando
  `terminos_version_aceptada === TERMINOS_VERSION_ACTUAL` — si no coinciden
  (porque nunca aceptó, o porque aceptó una versión vieja), queda bloqueado
  en los dos lados: cliente (checkbox destildada, botón "+ Nueva
  publicación" deshabilitado, el compose de mensajes reemplazado por un
  aviso) y servidor (las policies `insert_own_publicaciones` e
  `insert_mensajes` exigen `terminos_version_aceptada >= 1`, el número de
  la versión 1).

**Para actualizar el texto en el futuro, son 2 pasos, no 1** (mismo patrón
que ya existe con `CATEGORIES`/`CATEGORY_COLORS`, documentado en
CLAUDE.md):
1. Editar `TerminosContenido.tsx` con el texto nuevo.
2. Subir `TERMINOS_VERSION_ACTUAL` en `terminos.ts`, **y** actualizar el
   número correspondiente (`>= N`) en las dos policies de
   `supabase-schema.sql` (`insert_own_publicaciones` e `insert_mensajes`).

Si se hace solo el paso 1 y no el 2, nadie se entera de que cambió nada —
por eso el número vive hardcodeado en dos lugares en vez de en un solo
`.env`: es la forma más simple de que el cambio sea imposible de olvidar a
medias (si solo se toca el código de React pero no la base, la policy
vieja igual sigue dejando publicar con la versión anterior).

**Bug encontrado y arreglado durante el desarrollo**: el primer chequeo de
"perfil completo" en "Mis publicaciones" solo miraba si la fila de
`profiles` existía, no si los Términos estaban aceptados — alguien con un
perfil de antes de esta funcionalidad podía seguir publicando sin haber
aceptado nunca nada. Se corrigió agregando el chequeo real (de versión) en
las dos capas descriptas arriba.

### Versión 2 — cláusula de uso de datos

Pedido explícito del dueño: sumar al texto algo dejando en claro que los
datos de los usuarios **solo los usa Comunidad Metales Julio**, y
únicamente para el funcionamiento de la plataforma (administrar la cuenta,
que otros miembros puedan contactar por mensajería interna, y comunicarse
con la persona cuando haga falta — avisos, moderación, soporte), sin
venderlos ni compartirlos con terceros ajenos a la comunidad salvo
obligación legal — texto agregado dentro de la sección "4. Tus datos" de
`TerminosContenido.tsx`, redactado con el lenguaje habitual de una
cláusula de uso/privacidad de datos (mismo tono que el resto del texto,
sin ser un documento legal formal).

Al ser un cambio de contenido real (no un typo), subió
`TERMINOS_VERSION_ACTUAL` a `2` — eso hace que a **todas** las personas que
ya habían aceptado la versión 1 les vuelva a aparecer la casilla
destildada y no puedan publicar ni mandar mensajes hasta volver a aceptar
(comportamiento esperado, ver "Versionado" arriba). Se actualizó el número
en todos los lugares que lo exigen (`terminos.ts` + las policies de
`supabase-schema.sql`: `insert_own_publicaciones`, `insert_mensajes`,
`insert_denuncia_tras_intercambio`) — **hay que volver a correr
`supabase-schema.sql` en el SQL Editor de Supabase para que este cambio
tenga efecto real**, no alcanza con el deploy de `web/`.

### HQ Metales: cuántos aceptaron la versión vigente

**Pedido explícito del dueño**, a raíz de notar que le volvió a pedir aceptar
los Términos tras la versión 2: sumar una tarjeta de estadística más,
**"Aceptaron los Términos vigentes"**, junto a las otras 6 (En línea ahora,
Miembros totales, Nuevos, Suspendidos, Mensajes totales, Contactos). Se
calcula en el cliente comparando `terminos_version_aceptada` de cada fila
(devuelta ahora por `admin_listar_miembros()`, agregada al final de sus
columnas) contra `TERMINOS_VERSION_ACTUAL` — mismo patrón que ya usan
`PerfilPage`/`MisPublicacionesPage`/`ConversationModal` para saber si una
persona puede publicar o mandar mensajes. Como con cualquier cambio al
`returns table` de esta función, hace falta volver a correr
`supabase-schema.sql` en el SQL Editor para que la columna nueva llegue de
verdad (ver el comentario de "drop function" ya documentado más arriba).

De paso, pedido de seguimiento del dueño: la misma información también
como **columna "Términos" en la tabla de miembros** (no solo el total de
arriba), para ver de un vistazo quién falta que acepte — badge verde
"✓ Aceptó" o amarillo "Pendiente" por fila (`MembersTable.tsx`), ordenable
como el resto de las columnas. No se agregó a la exportación a Excel de
miembros (no pedido explícitamente, se puede sumar después si hace
falta).

### Avisar por mail cuando cambian los Términos (pendiente, ya no depende del dominio)

**Pedido explícito del dueño**: que a todos los miembros les llegue un mail
avisando cuando el texto de los Términos cambia de versión, para que sepan
que tienen que volver a aceptarlo. Todavía no implementado, pero el
bloqueo que tenía (Resend en modo sandbox, solo podía mandarle mail a una
única casilla de prueba) ya se resolvió: se verificó el dominio propio
`comunidadmetalesjulio.com.ar` en Resend (DNS delegado a Cloudflare —
NIC.ar no tiene editor de DNS completo, así que primero hubo que migrar la
delegación del dominio a Cloudflare, y de paso ese mismo cambio se usó para
conectar el dominio a Vercel, ver "Infra: dominio propio
(comunidadmetalesjulio.com.ar) vía Cloudflare"). La idea acordada es
que esto **no sea un trigger automático** (subir la versión es un cambio
de código manual y poco frecuente, no vale la pena construir
infraestructura aparte para detectarlo solo) — en cambio, va a ser un paso
más a mano que se hace la próxima vez que se suba
`TERMINOS_VERSION_ACTUAL`: juntar los emails de `profiles`/`auth.users` y
mandar el aviso vía la API de Resend en ese mismo momento.

## Moderación de publicaciones desde HQ Metales

**Pedido explícito del dueño**: HQ Metales puede eliminar cualquier
publicación de la comunidad, con un buscador para encontrarla por usuario
(nombre, apellido o email del autor) o por texto de la publicación (título,
descripción o rubro) — `admin_listar_publicaciones()` /
`admin_eliminar_publicacion(target_id)` en `supabase-schema.sql`, tabla
`AdminPublicacionesTable` en la interfaz.

Eliminar una publicación borra en cascada sus likes y los mensajes
asociados (mismas foreign keys `on delete cascade` que ya existían). **No
borra las fotos del bucket de Storage** — quedan huérfanas ahí (mismo
límite que ya tenía `admin_eliminar_perfil` con las publicaciones de un
perfil borrado). Si el espacio de Storage se vuelve un problema real (ver
la sección de fotos/margen de espacio), hay que sumar una limpieza aparte.

## Filtro de lenguaje ofensivo

**Pedido explícito del dueño**: que la plataforma no permita insultos, ni
en publicaciones públicas ni en mensajes internos.

**Importante — límite real de este filtro**: no es un detector real de
"cualquier idioma", eso requeriría un servicio de moderación con IA (pago,
con costo por request, y otra dependencia externa más). Lo que se
implementó es una **lista de palabras mantenible a mano**
(`web/src/constants/palabrasProhibidas.ts` del lado del cliente,
`contiene_insulto()` en `supabase-schema.sql` del lado del servidor — las
dos listas tienen que tener las mismas palabras, es el mismo patrón de "dos
lugares" que `CATEGORIES` y `TERMINOS_VERSION_ACTUAL`) que cubre insultos
comunes en español (Argentina) e inglés. Se puede esquivar con acentos
raros, espacios entre letras, o insultos en otros idiomas — es un filtro
razonable, no una solución perfecta.

- **Cliente**: al crear una publicación (`NuevaPublicacionModal`) o mandar
  un mensaje (`ConversationModal`), se chequea el texto antes de mandarlo —
  si matchea, se avisa con un toast y no se llega a mandar la request.
- **Servidor (el que de verdad importa)**: las policies
  `insert_own_publicaciones` e `insert_mensajes` llaman a
  `contiene_insulto()` — no se puede esquivar llamando a la API directo.
- El chequeo normaliza acentos/mayúsculas y usa límites de palabra (`\b` /
  `\y`) para no marcar falsos positivos dentro de otras palabras (por
  ejemplo, que "gil" no dispare adentro de "ágil" o "agilidad").
- Alcance actual: título y descripción de publicaciones, cuerpo de
  mensajes. La descripción del perfil ("Contanos sobre vos") no está
  cubierta todavía.

## En línea ahora (HQ Metales)

**Pedido explícito del dueño**: poder ver cuánta gente está usando la
plataforma en este momento, no solo estadísticas históricas.

- `profiles.ultima_actividad` se pisa cada 60 segundos mientras haya una
  sesión activa (`useHeartbeat`, montado en `AppShell` — corre para toda la
  app logueada). Es distinto de `ultima_conexion` (que es
  `auth.users.last_sign_in_at`, solo se actualiza al loguearse): alguien
  puede estar 20 minutos activo sin volver a loguearse, y acá sí se
  reflejaría.
- **Sin Realtime, mismo criterio que el resto de la plataforma** (ver
  "Notificaciones de mensajes nuevos") — no hay un contador que se actualice
  solo en vivo, es un latido + un cálculo en cada carga del panel de admin.
- "En línea ahora" en el primer tile de HQ Metales cuenta a quienes tuvieron
  actividad en los últimos 3 minutos (`MINUTOS_EN_LINEA` en
  `src/utils/adminStats.ts` — un poco más que los 60s del latido, para no
  perder a nadie por una demora de red puntual).
- Si la persona todavía no completó su perfil, el latido no tiene efecto
  (no existe la fila para actualizar) — no cuenta como "en línea" hasta que
  complete el perfil, mismo criterio que el resto de las estadísticas de
  HQ Metales.

## Infra: rutas directas (F5) daban 404 en Vercel

**Bug encontrado y arreglado**: entrar directo a una URL como
`metalesjulio.vercel.app/buscar` (escribiéndola a mano, recargando la
página, o abriendo un link compartido) daba **404: NOT_FOUND** de Vercel,
aunque esa misma ruta funcionaba perfecto navegando desde adentro del
sitio.

Causa: React Router maneja esas rutas **solo del lado del cliente** (en el
navegador, con JavaScript ya cargado) — pero cuando el navegador pide
`/buscar` directo al servidor, Vercel busca un archivo real con ese nombre
en la build, no lo encuentra (no existe, es una ruta "virtual" que React
Router inventa) y devuelve un 404 real, antes de que la app llegue siquiera
a cargar.

Arreglado con `web/vercel.json`, que le dice a Vercel: para cualquier ruta
que no sea un archivo real, servir `index.html` igual (`rewrites`) — recién
ahí carga el JavaScript y React Router toma el control y muestra la
pantalla correcta. **No se pudo agregar un test automático para esto**: los
tests de Playwright corren contra el servidor de desarrollo de Vite
(`npm run dev`), que ya resuelve este caso solo por su cuenta -- el bug es
específico de cómo Vercel sirve los archivos estáticos en producción, así
que solo se puede confirmar entrando de verdad al sitio desplegado.

## Infra: puerto fijo para dev/preview/e2e (5999)

**Bug encontrado y arreglado**: los tests e2e empezaron a fallar mostrando
contenido de **otro proyecto del dueño** (`CarnesdeMontoya`) en vez del
sitio de la comunidad, sin ningún error visible.

Causa: en esta máquina suelen correr **varios proyectos de Vite en
paralelo** (este, `CarnesdeMontoya`, `Biddit`). Ninguno tenía un puerto fijo,
así que cada `npm run dev` iba tomando el siguiente puerto libre a partir
del 5173 por default de Vite -- con el tiempo se acumulan decenas de
servidores de desarrollo abiertos en puertos consecutivos (5173, 5174,
5175...). Playwright, configurado con `reuseExistingServer: true`, al
buscar un servidor en el puerto que le tocaba, encontraba **el de otro
proyecto** ya escuchando ahí y lo reusaba sin quejarse -- los tests corrían
contra la app equivocada.

Arreglado fijando el puerto de este proyecto bien lejos de esa zona de
choque (`5999`, en `vite.config.ts` y `playwright.config.ts`) y agregando
`strictPort: true`, para que si alguna vez el puerto está ocupado de
verdad, el arranque falle fuerte y visible en vez de saltar de puerto en
silencio (que es lo que permitió este bug en primer lugar). También se
ajustó `reuseExistingServer` a `!process.env.CI` -- en CI siempre arranca
de cero, en la máquina local reusa (más rápido para iterar) pero ahora
sobre un puerto que ningún otro proyecto va a pisar.

## Notificaciones del navegador

Además del aviso por mail y el badge adentro de la app, quien tiene el
sitio abierto en otra pestaña recibe un aviso nativo del navegador cuando
le llega un mensaje nuevo (el chequeo de no-leídos ya corría cada 30s, ver
sección de arriba — esto solo agrega la notificación cuando ese número
sube respecto al valor anterior, `deberiaAvisarPorAumento()` en
`src/utils/notifications.ts`).

**No es push real** (no llega con el navegador cerrado) — eso necesitaría
un Service Worker + claves VAPID + un mecanismo del lado del servidor para
mandar el aviso sin que el sitio esté abierto. Decisión explícita de no
hacerlo así por ahora: mucho más simple esto, y cubre el caso pedido
("avisame si tengo otra pestaña abierta").

Hay un botón "🔔 Activar avisos" en la topbar, visible solo mientras el
permiso del navegador todavía no se pidió (`Notification.permission ===
"default"`) — una vez concedido o rechazado, desaparece (el navegador ya
decidió, no hay nada más que pedir desde acá).

## Publicaciones guardadas/favoritas

Botón 🔖 en cada card de "Buscar en la comunidad" (al lado del corazón de
like) para guardar una publicación sin tener que acordarse de buscarla de
nuevo. Nueva sección **"Favoritos"** en el sidebar (nombre visible para la
persona; internamente la tabla/rutas siguen llamándose "guardados" —
`publicaciones_guardadas`, `/guardados` — no hacía falta renombrar nada
técnico solo por el cambio de etiqueta), entre "Buscar en la comunidad" y
"Mis publicaciones".

A diferencia de los likes (públicos, cualquiera puede ver quién le dio
like a qué), **lo guardado es privado** — la tabla `publicaciones_guardadas`
solo deja leer la propia fila, no `using (true)` como `publicacion_likes`.

**Bug encontrado y arreglado**: el botón de guardar (🔖) no se veía cambiar
al tocarlo. Causa: 🔖 es un **emoji a todo color**, y los emoji a color
ignoran la propiedad `color` de CSS en todos los navegadores (a diferencia
del ♡/♥ del like, que son símbolos de texto planos, no emoji, y sí
responden a `color`). Un primer intento marcó el estado con el **fondo**
del botón en vez del color del emoji, pero seguía sin notarse lo
suficiente ("parece lo mismo", feedback del dueño). Se reemplazó el emoji
por un **ícono propio en SVG** (`BookmarkIcon`, sin librerías, `fill`/
`stroke` en `currentColor`) que sí responde a `color` y además cambia de
forma (contorno vacío → relleno sólido), mismo patrón que el ♡/♥ del like
pero para un ícono sin equivalente de texto plano en Unicode. Si se agrega
otro botón con emoji a color que necesite dos estados visuales, conviene
este patrón de ícono SVG propio en vez de depender de un emoji.

## Mini perfil público

Clickeando el nombre de alguien en cualquier card de una publicación, se
abre `/perfil/:userId` con sus datos públicos (nombre, provincia,
descripción — nunca dni/cuit/email de cuenta ni la dirección exacta,
mismo criterio que el buscador) y todas sus publicaciones juntas.

Entrar a tu propio mini perfil no tiene mucho sentido (ya tenés "Mis
publicaciones" y "Mi perfil" para eso) — se redirige directo a "Mi
perfil" si `userId` coincide con la propia sesión.

## Reseñas y calificaciones: eliminadas de raíz

**Decisión de raíz de Bruno (dueño del proyecto)**: la plataforma **no
tiene reseñas ni calificaciones de ningún tipo**, y no debe quedar ningún
rastro de ese concepto (ni código muerto, ni tabla, ni pantalla, ni
mención en la interfaz). Se eliminaron por completo: la tabla `resenas` y
sus policies, `admin_listar_resenas()`, la columna `resenas_promedio` de
`admin_listar_miembros()`, la tabla "Reseñas" y la columna "Promedio" de
HQ Metales, y los componentes `ReviewSection`/`useResena`/`AdminResenasTable`.

**Ojo si aparece la idea de nuevo**: esta función ya fue y volvió dos
veces (se pidió sacarla, después se pidió mantenerla en versión privada
con 3 criterios, y finalmente se eliminó de raíz). Si se vuelve a pedir,
conviene confirmar bien el alcance antes de construirla, y saber que el
historial de git tiene la implementación completa anterior si hiciera
falta recuperarla.

**Lo que NO cambió**: el orden del feed sigue igual — publicaciones de las
últimas 24hs primero por fecha, y el resto en orden aleatorio ponderado
por cantidad de "me gusta" (ver "Orden del feed"). Las calificaciones
nunca influyeron en ese orden, así que sacarlas no lo afecta.

## Denuncias

**Pedido explícito de Bruno**: un botón para denunciar a la otra persona
de una conversación, dentro del propio modal de conversación
(`ReportSection`, dentro de `ConversationModal`):
- Solo se puede denunciar tras un intercambio real de mensajes sobre esa
  publicación puntual (`insert_denuncia_tras_intercambio`).
- Una denuncia por persona y por publicación
  (`unique(denunciante_id, publicacion_id)`).
- **Nadie puede leer denuncias por API directa, ni siquiera la propia
  persona que la hizo** (`select_denuncias` usa `using (false)`, mismo
  criterio que `contactos`/`super_admins`) — el frontend recuerda "ya
  denuncié" solo del lado del cliente para esa sesión (`useDenuncia`), no
  hay forma de confirmarlo contra el servidor después. Si alguien intenta
  denunciar dos veces a la misma persona por la misma publicación, el
  `unique` de la base lo rechaza igual (con un error menos prolijo, pero
  rechaza).
- El motivo es de una lista cerrada, no texto libre (`MOTIVOS_DENUNCIA` en
  `web/src/constants/denuncias.ts`: estafa, producto no coincide, lenguaje
  inapropiado, acoso, spam, otro) — tiene que coincidir con el check
  constraint de `public.denuncias` y con las etiquetas de la Edge
  Function `notificar-denuncia`, los 3 lugares se actualizan juntos si se
  agrega un motivo.
- HQ Metales ve todas las denuncias en su propia tabla
  (`admin_listar_denuncias()`, security definer gateada por
  `es_super_admin()`).
- **Avisa por mail a TODOS los súper admins** apenas se manda una
  denuncia — Edge Function `notificar-denuncia` (mismo patrón que
  `notificar-mensaje`: Database Webhook de `insert` sobre `denuncias`,
  usa el mismo secret `RESEND_API_KEY` ya cargado). Ni la persona
  denunciada ni el denunciante reciben ningún aviso, solo los admins.
  El asunto del mail lleva a propósito el emoji 🚨 y "DENUNCIA" en
  mayúsculas (pedido explícito del dueño) para que se note entre el
  resto de la bandeja de entrada y no se confunda con un aviso de
  mensaje común.
- **El trigger se armó a mano en el SQL Editor**, no desde el editor visual
  de "Database → Triggers" en Supabase (esa pantalla no deja completar la
  URL/headers del pedido HTTP para el tipo `http_request`). Se copió la
  definición exacta del trigger de `notificar-mensaje` (con
  `pg_get_triggerdef`) y se adaptó el nombre/tabla/URL — si hay que crear
  otro trigger de este tipo en el futuro, conviene repetir ese mismo
  método (copiar un `CREATE TRIGGER` que ya funciona) en vez de pelear con
  el formulario visual.
- **DNI junto al nombre en las tablas de HQ Metales**: pedido explícito del
  dueño, para tener un identificador único al lado de cada nombre (evita
  confusión si dos personas comparten nombre parecido) — se agregó
  directamente en el texto de la celda ("Nombre Apellido (DNI)"), no como
  columna aparte, en Publicaciones y Denuncias. También se suma al buscador
  de texto libre de esas tablas.
- **Bug real encontrado y arreglado — el mail no llegaba a ningún admin
  cuando había más de uno**: la primera versión de `notificar-denuncia`
  mandaba un solo pedido a Resend con los mails de todos los súper admins
  juntos en `to: [...]`. En modo sandbox (sin dominio propio verificado en
  Resend), Resend rechaza el pedido **completo** con error 500 si aunque
  sea uno de los destinatarios no es la casilla verificada de la cuenta —
  con 3 admins y solo 1 casilla válida para pruebas, el resultado era que
  el mail no le llegaba a nadie, ni siquiera al admin que sí era válido.
  Se arregló mandando un pedido a Resend **por cada admin por separado**
  (`Promise.all` de envíos individuales) en vez de uno solo con todos
  juntos, así uno que falla no bloquea a los demás. Mismo cuidado aplica
  si en el futuro se toca `notificar-mensaje` para mandarle a más de un
  destinatario a la vez.

## Code splitting por ruta

Cada página detrás del login se descarga en su propio archivo, bajo
demanda (`React.lazy` + `Suspense` en `App.tsx`), en vez de ir todo junto
en el bundle inicial. El caso más importante: alguien que no es súper
admin **nunca descarga el código de HQ Metales ni de Seguridad** — antes
se mandaba igual a cualquiera que entrara al sitio, aunque nunca fuera a
visitar esas pantallas.

`PublicLandingPage` (la vista sin login) se mantiene fuera de este
esquema, cargada de entrada — es lo primero que ve cualquiera, no tendría
sentido agregarle una espera de red extra a la primera pantalla que ve un
visitante nuevo.

## Compresión de fotos

Las fotos de publicaciones se redimensionan (máximo 1600px de lado más
largo) y se recomprimen a JPEG calidad 82% **en el navegador, antes de
subirlas** — `src/utils/imageCompression.ts`, con Canvas nativo, sin
ninguna librería externa. Se comprime al elegir la foto (no recién al
enviar el formulario), para que la vista previa ya refleje lo que
realmente se va a subir.

Si la versión comprimida termina pesando más que la original (pasa con
fotos ya chicas o ya muy comprimidas), o si el navegador no soporta
`createImageBitmap`, se sube la original tal cual — nunca bloquea la
publicación por esto. Los GIF se excluyen a propósito (pasarlos por
canvas les rompe la animación).

## Input de archivo con texto en inglés ("Choose Files")

**Bug encontrado y arreglado**: el input nativo `<input type="file">` en
"Nueva publicación" mostraba "Choose Files" / "No file chosen" en inglés
— ese texto lo pone el navegador según su propio idioma, no el `lang` de
la página ni nada del HTML/CSS del sitio, así que no había forma de
traducirlo directamente. Se ocultó el input nativo (`.visually-hidden` en
`global.css`, no `display:none` para que siga siendo un input real y
accesible) y se reemplazó por un botón propio ("Elegir fotos") con un
`<label htmlFor="pubFoto">` — clickear ese label abre el selector de
archivos igual que el input nativo, sin necesitar JS para eso — más un
texto de estado propio ("Ninguna foto elegida" / "N fotos elegidas") que
si está bajo control del sitio. El input de "Mis publicaciones" (agregar
foto a una publicación ya creada) no tenía este problema porque ya estaba
oculto con `hidden` y disparado por un botón "+" propio.

## Apellido: solo la inicial en las vistas públicas

**Decisión explícita del dueño, de privacidad**: en cualquier lugar donde
un miembro ve el nombre de OTRA persona (cards de "Buscar en la
comunidad"/"Favoritos", mini perfil público, lista de "Mensajes", el
modal de conversación), el apellido se muestra recortado a
la inicial — "Sofia Rosemberg" se ve como "Sofia R." — vía
`formatNombrePublico()` en `src/utils/format.ts`.

**Esto NO aplica** en dos lugares, a propósito:
- **"Mi perfil"**: ahí cada quien ve y edita su propio apellido completo,
  es su dato, no el de un tercero.
- **HQ Metales** (tabla de miembros, export a Excel, buscador de súper
  admins): el panel de administración sigue viendo el apellido completo
  de todos — necesita la identidad real para moderar, no tiene sentido
  recortarla ahí.

Si se agrega una pantalla nueva que muestre el nombre de otra persona,
hay que usar `formatNombrePublico(nombre, apellido)` en vez de concatenar
`capitalizarNombre` a mano, para no reintroducir el apellido completo por
descuido.

## Infra: scroll horizontal en el celular + menú hamburguesa faltante

**Bug encontrado y arreglado**: en el celular, la página pública se podía
scrollear para los costados (no solo para arriba/abajo) — el header
(logo + Ingresar/Registro) no entraba en una sola fila en pantallas
angostas y no tenía forma de acomodarse, así que desbordaba y arrastraba
a toda la página con él.

De paso se notó que el botón de menú hamburguesa (☰) tenía el CSS listo
(`.menu-toggle`, ya pensado para aparecer en celular y desplegar
"Cómo funciona"/"Tienda oficial") pero **nunca se había agregado el botón
en sí** al portar el sitio a React — o sea, esos links eran inalcanzables
en el celular. Se agregó el botón (`PublicLandingPage.tsx`) reproduciendo
el mismo comportamiento simple de la versión vanilla (togglear la clase
`open` en el menú, sin cerrarlo automáticamente al clickear un link).

Arreglado el header para que se achique en dos escalones (`@media
max-width:700px` y `max-width:380px` en `global.css`) en vez de
desbordar, más una red de seguridad general (`html{overflow-x:hidden}`)
para que ningún elemento futuro que se pase de ancho por error rompa la
página entera en el celular. **Verificado con Playwright a 320px y 375px
de ancho** (comparando `scrollWidth` contra `clientWidth`, más una
captura de pantalla) antes de darlo por resuelto — no alcanzaba con mirar
el CSS y suponer que iba a entrar.

## Infra: barra superior de la app logueada desbordaba en celulares angostos

**Bug encontrado y arreglado**, distinto del de arriba (ese era de la
página pública sin login; este es de `.app-topbar-row`, la barra negra de
arriba una vez logueado — logo, campana de "Activar avisos", saludo "Hola,
Nombre" y botón "Salir"). El grupo de la derecha no tenía ningún manejo
responsive: en pantallas de 320 a 414px de ancho se corría fuera de la
pantalla, en algunos casos dejando el botón "Salir" literalmente invisible
e imposible de tocar (protegido de que se vea como scroll lateral gracias
al `html{overflow-x:hidden}` ya existente, pero el contenido igual quedaba
cortado). Confirmado con Playwright usando el CSS real, en Chromium y
WebKit (proxies de Chrome/Android y Safari/iOS) — el problema era idéntico
en los dos motores, o sea CSS, no algo específico de un navegador.

Arreglado con el mismo patrón que la página pública: `.app-topbar-row`
ahora tiene `flex-wrap:wrap` (si no entra todo en una línea, el grupo de
la derecha pasa a una segunda línea dentro de la barra negra, en vez de
salirse de la pantalla) más un escalón `@media max-width:480px` que achica
el logo, el saludo y los botones, y `@media max-width:360px` que oculta el
texto "Activar avisos" dejando solo el ícono 🔔 (con `aria-label` para que
siga siendo accesible). El texto del botón se envolvió en un
`<span className="btn-label-mobile-hide">` en `AppShell.tsx` para poder
ocultarlo por CSS sin tocar el ícono. **Verificado con Playwright en los
dos motores, en 320/360/375/390/412/414px, con y sin el botón de la
campana presente** (desaparece solo una vez que el usuario ya
aceptó/rechazó el permiso de notificaciones) — cero overflow y el botón
"Salir" siempre dentro de la pantalla visible en todos los casos.

El sidebar (los ítems de navegación con emoji) no tenía este problema — su
scroll horizontal en celular es intencional (`.app-sidebar{overflow-x:auto}`),
no un bug.

## "Buscar en la comunidad": sin título repetido, panel más compacto en celular

Se sacó el título "Buscar en la comunidad" + bajada ("Encontrá el trabajo o
la artesanía que necesitás.") de arriba del buscador — ya está el mismo
texto en el botón activo del sidebar, quedaba redundante. El panel de
búsqueda (input + rubro + botón) además se achica un poco en celular
(`.search-panel-compact`, `@media max-width:820px` en `global.css`):
menos padding, labels e inputs más chicos, botón más bajo — en desktop
queda exactamente igual que antes.

## HQ Metales: títulos sobre cada tabla

Se agregaron los títulos "Mensajes de la comunidad" y "Publicaciones de la
comunidad" arriba de sus respectivos buscadores en `AdminPage.tsx` — antes
cada tabla arrancaba directo con el buscador, sin ninguna indicación de
qué tabla era (a diferencia de los 4 gráficos de barra, que sí tienen
título). La tabla de miembros no necesitó título propio porque ya está
justo debajo del encabezado "HQ Metales" de toda la sección.

## HQ Metales: ver el texto completo de una celda cortada

Las tablas de HQ Metales (Denuncias, Mensajes de la comunidad,
Publicaciones) cortan con "..." las columnas de texto largo (comentario,
mensaje, descripción) para que la tabla no se desborde — ya tenían el
atributo `title` como respaldo (tooltip nativo al pasar el mouse), pero eso
no es notorio para quien no sabe que existe y no funciona tocando en
celular. Pedido explícito del dueño: que se pueda ver el texto completo.

Se agregó `VerTextoModal` (`src/components/admin/VerTextoModal.tsx`), un
modal genérico reutilizado en las 3 tablas — cada una guarda su propio
estado local de "qué celda se está viendo" y le pasa el texto completo al
modal al clickear la celda (clase `.admin-table-cell-expandible`, que
agrega `cursor:pointer` y un resaltado al pasar el mouse para que se note
que es clickeable). El `title` nativo se mantiene igual, como respaldo.

## Infra: el proyecto de Vercel se movió de cuenta

**Pedido explícito del dueño**: separar el consumo de tráfico de esta
comunidad del de sus otros proyectos personales en Vercel (todos vivían
bajo la misma cuenta `alanzeta@gmail.com`, compartiendo el mismo cupo del
plan gratuito). Como Vercel no deja transferir un proyecto directo entre
dos cuentas personales sin pagar un plan Pro (solo transfiere a un "Team",
que ahora requiere plan pago), se armó el proyecto **desde cero en una
cuenta nueva** (`a32386103@gmail.com`, plan Hobby gratis) en vez de
transferirlo:

1. Se creó un proyecto nuevo en la cuenta nueva, importando el mismo
   repositorio de GitHub (`alanzetaa/MetalesJulio`, rama `master`), con
   **Root Directory `web`** y las mismas variables de entorno
   (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
2. Se probó a fondo con una URL provisoria (`metales-julio.vercel.app`)
   antes de tocar nada del dominio real.
3. Recién verificado que andaba bien, se hizo el cambio de nombres: el
   proyecto viejo (cuenta `alanzeta@gmail.com`) se renombró a
   `metalesjulio-legado` (liberando el nombre `metalesjulio`), y en el
   mismo momento el proyecto nuevo se renombró de `metales-julio` a
   `metalesjulio` para reclamarlo — como el nombre del proyecto en Vercel
   determina la dirección `algo.vercel.app`, la URL pública final quedó
   **exactamente igual que antes** (`metalesjulio.vercel.app`).

Gracias a que la URL no cambió, **no hizo falta tocar nada de Supabase ni
de Google Cloud Console** (Site URL, Redirect URLs, OAuth) — todo eso
sigue apuntando a la misma dirección de siempre y sigue funcionando sin
cambios. El único costo real fue un corte breve del sitio durante el
cambio de nombres (segundos/minutos), hecho a propósito fuera de un
momento de uso activo de la comunidad.

**Pendiente de limpieza (no urgente)**: el proyecto viejo
(`metalesjulio-legado`, en `alanzeta@gmail.com`) sigue conectado al mismo
repositorio de GitHub, así que va a seguir haciendo su propio deploy en
cada `git push` a `master` aunque ya no lo use nadie — no rompe nada, solo
gasta minutos de build de esa cuenta de más. Se puede desconectar el Git
de ese proyecto (Settings → Git → Disconnect) o borrarlo directamente una
vez que se tenga confianza total en que la migración quedó estable.

## Cabeceras de seguridad HTTP (Content-Security-Policy, etc.)

**Motivo**: un escaneo de vulnerabilidades externo (PentestTools, contra
`metalesjulio.vercel.app`) dio riesgo general "Low" (0 críticos/altos/
medios) — nada explotable, solo faltaban 3 cabeceras HTTP de "defensa en
profundidad" recomendadas por OWASP. Se agregaron en `web/vercel.json`
(sección `headers`, aplicada a todas las rutas vía Vercel, no es código de
la app):

- `X-Content-Type-Options: nosniff` y `Referrer-Policy:
  strict-origin-when-cross-origin` — sin riesgo, no restringen nada del
  sitio, solo agregan protección.
- `Content-Security-Policy` — esta sí hay que armarla a medida, mirando qué
  recursos externos usa el sitio de verdad, para no bloquear algo real por
  accidente:
  - `style-src` necesita `'unsafe-inline'` porque el código usa mucho
    `style={{...}}` de React en JSX (22 archivos) — sin este permiso, todo
    ese estilado en línea dejaría de aplicarse (layout roto, sin ningún
    error visible más que en la consola).
  - `style-src`/`font-src` permiten `fonts.googleapis.com`/
    `fonts.gstatic.com` (la fuente Montserrat, cargada en `index.html`).
  - `img-src` permite `data:`, `blob:` (las vistas previas de fotos antes
    de subirlas usan `URL.createObjectURL`, que genera URLs `blob:`) y el
    dominio del proyecto de Supabase (fotos ya subidas, servidas desde
    Storage).
  - `connect-src` permite el dominio de Supabase (API + posible websocket)
    y `nominatim.openstreetmap.org` (autocompletar de ubicación).
  - `script-src` se dejó en `'self'` a secas (sin `unsafe-inline` ni
    `unsafe-eval`) porque el código no usa `dangerouslySetInnerHTML`, ni
    `eval`, ni scripts inline en ningún lado — confirmado con una búsqueda
    en todo `src/` antes de armar la política.

**Importante para el futuro**: si se agrega algún recurso externo nuevo
(otra fuente, otro servicio de mapas, otro backend), hay que sumarlo a la
lista correspondiente de `Content-Security-Policy` en `vercel.json`, o el
navegador lo va a bloquear en silencio (sin romper la build, solo se ve en
la consola del navegador como "Refused to ... because it violates the
following Content Security Policy directive"). Como esto solo se aplica
en el sitio real servido por Vercel (no en `npm run dev` ni en los tests
locales), cualquier cambio a esta política se verificó pegándole
directamente a la URL de producción después del deploy, no alcanza con
correr los tests.

## Infra: dominio propio (comunidadmetalesjulio.com.ar) vía Cloudflare

El dominio `comunidadmetalesjulio.com.ar` se compró en **NIC.ar**, pero
NIC.ar no tiene un editor de DNS completo (no deja cargar los registros TXT
que pide Resend para verificar un dominio, por ejemplo) — por eso se
delegó la administración de DNS a **Cloudflare** (plan Free, alcanza y
sobra: DNS, SSL y CDN gratis; no hace falta Pro para esto). El proceso,
para repetirlo si hace falta con otro dominio:

1. Crear cuenta en Cloudflare, "Add a Site" con el dominio raíz (sin
   `www`), plan Free.
2. Cloudflare da 2 nameservers propios (ej. `fonzie.ns.cloudflare.com`,
   `priscilla.ns.cloudflare.com`).
3. En NIC.ar → "Mis dominios" → **"Delegar"** (no "Editar DNS", ese botón no
   existe ahí) → "Agregar una nueva delegación" por cada nameserver, sin
   completar IPv4/IPv6 (esos campos solo son necesarios si el nameserver
   fuera un subdominio del propio dominio que se está delegando) →
   "Ejecutar cambios". La propagación puede tardar de minutos a 24hs; en la
   práctica salió en menos de una hora.
4. Una vez que Cloudflare muestra "Your domain is now protected by
   Cloudflare", ya se pueden cargar registros DNS ahí (pestaña **DNS →
   Records → Add record**).

**Conectar el dominio a Vercel**: en el proyecto de Vercel → pestaña
**Domains** (ojo, es una pestaña propia del proyecto, no está dentro de
"Settings" ni dentro de "Networking" — "Networking" en Vercel es para IPs
estáticas pagas y Secure Compute, no tiene nada que ver) → "Add Existing"
→ se cargó `www.comunidadmetalesjulio.com.ar` con la opción **"Redirect
apex domains to www"** tildada, así el dominio sin `www` también entra
(con un 308 redirect a la versión con `www`). Vercel pidió un registro
**CNAME** con `Name: @` y otro con `Name: www`, ambos apuntando al mismo
`....vercel-dns-XXX.com` — los dos se cargaron en Cloudflare con **Proxy
status en "DNS only" (nube gris), no proxiado** (Vercel lo pide así
explícitamente, para poder verificar el dominio y emitir su propio
certificado SSL sin que Cloudflare se meta en el medio). El certificado
HTTPS tardó unos minutos en emitirse después de verificado el DNS — hasta
entonces el dominio respondía por HTTP pero no por HTTPS, comportamiento
normal, no un error.

**Verificar el dominio en Resend** (para poder mandar mail a cualquier
miembro, no solo a la casilla de sandbox — ver sección de Mensajería):
en Resend → Domains → Add Domain → `comunidadmetalesjulio.com.ar`, pidió 3
registros obligatorios + 1 opcional, todos cargados en Cloudflare como
"DNS only" (TXT y MX ni siquiera tienen opción de proxy):
- **DKIM** (TXT, `resend._domainkey`): clave pública larga, hay que
  copiarla completa sin cortes — se verificó letra por letra contra el DNS
  público ya propagado (`dns.resolveTxt` de Node, no hace falta esperar a
  que Resend lo detecte para confirmar que está bien cargado).
- **SPF** (MX + TXT, ambos en el subdominio `send`): `feedback-smtp.<región>.amazonses.com`
  con prioridad 10, y `v=spf1 include:amazonses.com ~all`.
- **DMARC** (TXT, `_dmarc`, opcional pero cargado igual): `v=DMARC1; p=none;`
  — mejora la entregabilidad (menos chance de caer en spam) aunque Resend
  no lo exige para verificar el dominio.

Una vez verificado, se actualizó `FROM_EMAIL` en las dos Edge Functions
(`notificar-mensaje`, `notificar-denuncia`) de
`onboarding@resend.dev` a `notificaciones@comunidadmetalesjulio.com.ar` —
como siempre, esto requiere volver a pegar el código actualizado a mano en
el editor de Supabase Edge Functions, el `git push` no las redespliega
solo.

## Chequeo semanal de salud: rutina de Claude + GitHub Action

Hay **dos mecanismos separados**, cada uno cubre lo que el otro no puede:

- **Rutina de Claude Code** ("Chequeo semanal Metales Julio", corre los
  domingos, mismo horario) — revisa que las pruebas automáticas (CI) hayan
  pasado y si hubo actividad rara en los últimos commits. Su resultado
  **se ve solo en la web de Claude Code** (Rutinas), nunca llega por mail
  — es un malentendido fácil de tener (pasó una vez) pensar que esta
  rutina manda un aviso a la casilla de correo; no lo hace ni lo hizo
  nunca.
- **GitHub Action** (`.github/workflows/chequeo-semanal.yml`, mismo
  horario, domingos 23:00 UTC) — chequea que el sitio en vivo
  (`metalesjulio.vercel.app`) responda 200 y le hace un ping a Supabase
  (para que no se pause por inactividad), y **manda un mail de verdad**
  con el resultado vía la API de Resend a `a32386103@gmail.com`.

**Por qué están separados**: se probó primero hacer los 5 chequeos todos
juntos dentro de la rutina de Claude, pero el entorno en la nube donde
corre esa rutina tiene **la salida a internet restringida solo a GitHub**
(por seguridad) — nunca pudo llegar a `metalesjulio.vercel.app` ni a
`supabase.co`, así que esos 2 chequeos puntuales se movieron a un GitHub
Action (que sí tiene salida libre de verdad a cualquier lado) en vez de
insistir con algo estructuralmente imposible en ese entorno.

**Requiere un secret en GitHub**: `RESEND_API_KEY` (Settings del repo →
Secrets and variables → Actions → New repository secret), con la misma
clave que ya usan las Edge Functions de Supabase. Sin ese secret cargado,
el paso de mandar el mail va a fallar (el chequeo del sitio/Supabase igual
corre bien, solo no se puede avisar por mail).

**No hace falta revisar manualmente cuánto tráfico/uso llevan Vercel,
Supabase o Resend**: los 3 servicios ya mandan su propio mail de aviso
automático al acercarse a un límite del plan gratis (Supabase al 80% de
cualquier límite; Vercel al acercarse/pasar el límite de su plan Hobby;
Resend al 80% y 100% de la cuota de 3.000 mails/mes) — armar algo aparte
para esto en HQ Metales sería duplicar algo que ya funciona solo, y
ninguno de los 3 deja sacar por API el detalle de uso por proyecto de
forma simple igual.

## Próximas ideas (no implementadas, para charlar)

- Paginado real contra el servidor para el feed, si la comunidad crece
  mucho (hoy se trae todo de una sola consulta — ver "Feed infinito").
- Moderación de denuncias desde HQ Metales (hoy solo se listan; no hay un
  flujo para marcarlas como revisadas/resueltas ni para actuar sobre ellas
  desde el panel más allá de suspender o eliminar a la persona a mano).
