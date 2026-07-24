# Reglas de la plataforma — Comunidad Metales Julio

Este archivo es distinto de [CLAUDE.md](CLAUDE.md): CLAUDE.md documenta **cómo
está armado** el código (arquitectura, componentes, tablas). Acá se
documentan las **reglas de negocio** — el "por qué" y "cómo se comporta" la
comunidad de cara a la gente que la usa — para que se puedan leer y discutir
sin tener que meterse en detalles de implementación. Cuando una regla de acá
tiene un impacto técnico concreto, se linkea a la sección correspondiente de
CLAUDE.md.

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

## Próximas ideas (no implementadas, para charlar)

- Notificación push del navegador (no por mail) cuando llega un mensaje,
  para quienes tengan el sitio abierto en otra pestaña.
- Reseñas/calificación entre usuarios después de un intercambio.
- Publicaciones guardadas/favoritas.
