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

**Aceptarlos es obligatorio para completar el perfil** — sin tildar la
casilla, `perfilSchema` rechaza el formulario y no se puede guardar (por lo
tanto tampoco se puede usar el resto de la plataforma, ya que completar el
perfil es el paso obligatorio de entrada). El texto se muestra en un modal
(`TerminosModal` / `TerminosContenido`, en `src/components/perfil/`),
accesible con un link al lado de la casilla — se puede leer sin tildarla.

La idea central del texto (pedida explícitamente por el dueño, es la base
de todo lo demás que diga): **la plataforma solo conecta gente, no
interviene ni se beneficia de ninguna compra/venta/trabajo pactado entre
miembros** — todo acuerdo, pago, calidad y cumplimiento es responsabilidad
exclusiva de las partes involucradas, sin responsabilidad de Metales Julio.

`profiles.terminos_aceptados` (boolean) + `terminos_aceptados_at`
(timestamp, para tener registro de cuándo se aceptó) guardan la aceptación.
Se re-guarda con la fecha actual cada vez que se guarda el perfil (no solo
la primera vez) — no hay versionado de "qué versión del texto aceptaste",
si en algún momento se necesita eso hay que agregarlo.

**El texto actual es un punto de partida genérico**, escrito para poder
completar el perfil ya mismo — está pensado para revisarse/reemplazarse más
adelante (por ejemplo, con ayuda de un abogado) antes de que la plataforma
tenga uso real más allá de amigos probando.

## Próximas ideas (no implementadas, para charlar)

- Notificación push del navegador (no por mail) cuando llega un mensaje,
  para quienes tengan el sitio abierto en otra pestaña.
- Reseñas/calificación entre usuarios después de un intercambio.
- Publicaciones guardadas/favoritas.
