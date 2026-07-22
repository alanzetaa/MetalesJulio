// Orden del feed de "Buscar en la comunidad" — ver reglas.md ("Orden del
// feed") para la explicación de producto. Resumen: publicaciones de las
// últimas 24hs van primero (por fecha, más nueva arriba); el resto se
// reordena de forma aleatoria pero ponderada por likes, con una semilla que
// solo cambia una vez por día (no en cada visita), para que el orden no
// beneficie siempre a las mismas publicaciones ni sea 100% ciego a la
// calidad/interés que genera cada una.

const VEINTICUATRO_HORAS_MS = 24 * 60 * 60 * 1000;

/** Cuánto pesa cada like extra en el sorteo — ver fórmula en reglas.md. */
export const PESO_POR_LIKE = 0.15;

/**
 * Hash determinístico (variante de xmur3) que convierte un string en un
 * número en [0, 1). Mismo texto siempre da el mismo número — es lo que
 * permite que el orden aleatorio sea estable durante un mismo día.
 */
export function hashDeterministico(texto: string): number {
  let h = 1779033703 ^ texto.length;
  for (let i = 0; i < texto.length; i++) {
    h = Math.imul(h ^ texto.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function diaISO(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

/** ¿La publicación tiene menos de 24hs? (criterio de "recién publicada"). */
export function esReciente(createdAt: string, ahora: Date = new Date()): boolean {
  return ahora.getTime() - new Date(createdAt).getTime() < VEINTICUATRO_HORAS_MS;
}

/**
 * Score para el sorteo ponderado: un número aleatorio (pero estable por
 * día) multiplicado por un factor que crece con la cantidad de likes. Más
 * likes = más probabilidad de aparecer arriba, nunca una garantía.
 */
export function scorePonderado(id: string, likesCount: number, ahora: Date = new Date()): number {
  const azar = hashDeterministico(`${diaISO(ahora)}|${id}`);
  return azar * (1 + (Number(likesCount) || 0) * PESO_POR_LIKE);
}

export interface PublicacionOrdenable {
  id: string;
  created_at: string;
  likes_count: number;
}

/**
 * Ordena el feed: recientes (últimas 24hs) primero por fecha descendente,
 * después el resto por el sorteo ponderado por likes.
 */
export function ordenarFeed<T extends PublicacionOrdenable>(items: T[], ahora: Date = new Date()): T[] {
  const recientes: T[] = [];
  const resto: T[] = [];
  for (const item of items) {
    (esReciente(item.created_at, ahora) ? recientes : resto).push(item);
  }

  recientes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  resto.sort((a, b) => scorePonderado(b.id, b.likes_count, ahora) - scorePonderado(a.id, a.likes_count, ahora));

  return [...recientes, ...resto];
}
