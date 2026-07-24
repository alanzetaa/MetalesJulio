/**
 * Versión actual de los Términos y Condiciones. Si el texto cambia de forma
 * relevante, subir este número (no alcanza con editar el texto solo) --
 * eso hace que a TODAS las personas les vuelva a aparecer la casilla
 * destildada, y no van a poder publicar ni mandar mensajes hasta que
 * vuelvan a aceptar. Ver reglas.md ("Términos y Condiciones").
 *
 * IMPORTANTE: este número también está hardcodeado en supabase-schema.sql,
 * en las policies insert_own_publicaciones e insert_mensajes -- hay que
 * actualizar los dos lugares a la vez (mismo patrón que CATEGORIES /
 * CATEGORY_COLORS, documentado en CLAUDE.md).
 */
export const TERMINOS_VERSION_ACTUAL = 1;
