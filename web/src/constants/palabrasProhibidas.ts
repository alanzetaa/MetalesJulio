/**
 * Lista de palabras que bloquean una publicación o un mensaje (ver
 * reglas.md, "Filtro de lenguaje ofensivo"). Cubre insultos/vulgaridades
 * comunes en español (Argentina) e inglés -- NO es un detector real de
 * "cualquier idioma", es una lista mantenible a mano. Fácil de esquivar
 * con acentos raros, espacios entre letras o insultos en otros idiomas.
 * Para agregar una palabra, sumarla acá EN MINÚSCULA Y SIN ACENTOS (el
 * matching normaliza el texto de entrada, no hace falta variantes con
 * tilde) -- y también en la función SQL contiene_insulto() de
 * supabase-schema.sql, que es la que de verdad bloquea el insert
 * (esta lista de acá solo da el aviso rápido en el navegador).
 */
export const PALABRAS_PROHIBIDAS: readonly string[] = [
  // Español
  "boludo",
  "boluda",
  "pelotudo",
  "pelotuda",
  "gil",
  "forro",
  "forra",
  "puto",
  "puta",
  "maricon",
  "conchudo",
  "conchuda",
  "pajero",
  "pajera",
  "hijodeputa",
  "hdp",
  "imbecil",
  "idiota",
  "estupido",
  "estupida",
  "mierda",
  "garca",
  "chorro",
  "tarado",
  "tarada",
  "subnormal",
  "cornudo",
  "malparido",
  // Inglés
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "bastard",
  "dumbass",
  "moron",
  "retard",
];
