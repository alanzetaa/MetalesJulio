# Comunidad Metales Julio

## Qué es esto

Un sitio comunitario para que artesanos y oficios del metal (soldadores, herreros,
joyeros, torneros, escultores, etc.) publiquen su trabajo y cualquiera pueda
buscarlos y contactarlos directamente. Es un proyecto derivado de Metales Julio,
la casa de venta de metales e insumos (Av. Warnes 702, CABA —
https://www.tiendametalesjulio.com.ar/), pero es un espacio de comunidad, no la
tienda en sí.

Idea central pedida por el dueño del proyecto: "que todos los artesanos puedan
publicitar en esta comunidad, sean trabajos o artesanías", con un buscador para
encontrar artesanías o gente que hace trabajos (ej. soldadura), y que la gente
pueda interactuar entre sí para ayudarse.

## Estado actual

- [index.html](index.html) es un prototipo estático de una sola página (HTML +
  CSS + JS vanilla embebidos, sin build ni dependencias externas más allá de la
  fuente Montserrat de Google Fonts).
- No hay backend ni base de datos. Los perfiles que se publican desde el
  formulario "Publicar mi trabajo" se guardan en `localStorage` del navegador
  del usuario. Esto significa que cada persona ve solo lo que publicó ella
  misma en su propio dispositivo/navegador — los perfiles NO se comparten
  todavía entre distintos usuarios o dispositivos.
- Hay datos de ejemplo (`SEED_DATA` en el script) marcados con la etiqueta
  "Ejemplo" en la tarjeta, para que el directorio no se vea vacío en una
  primera visita.
- La interacción entre usuarios se resuelve con enlaces directos a WhatsApp
  (`wa.me`), Instagram y email que cada artesano carga en su perfil — no hay
  chat ni mensajería propia dentro del sitio.
- El repo se despliega en GitHub en `alanzetaa/MetalesJulio`. `index.html` está
  en la raíz para poder habilitar GitHub Pages directamente sobre `main`/`master`
  sin carpeta `docs/`.

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

Si en el futuro se pide "que los perfiles se vean entre todos los usuarios" o
"que se pueda mandar mensajes adentro del sitio", eso requiere un backend real
(base de datos + API), porque `localStorage` es local a cada navegador. Opciones
razonables: Firebase, Supabase, o un backend simple propio. No asumir que ya
existe — hoy no existe.

## Convenciones

- Todo el contenido de cara al usuario va en español (Argentina).
- Mantener el sitio como un único `index.html` autocontenido mientras siga
  siendo un prototipo sin backend; no introducir un build step (webpack/vite)
  a menos que el proyecto crezca lo suficiente como para justificarlo.
