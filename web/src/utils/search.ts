import type { ComunidadPublicacionRow, TipoPublicacion } from "../lib/database.types";

type BuscablePublicacion = Pick<
  ComunidadPublicacionRow,
  "titulo" | "descripcion" | "categoria" | "nombre" | "apellido" | "provincia" | "ciudad" | "tipo"
>;

/**
 * Separa el término de búsqueda en palabras y exige que TODAS aparezcan en
 * el texto de la publicación, sin importar el orden — así "pulsera grabada"
 * encuentra "pulsera plata grabada". No es una búsqueda exacta de substring.
 *
 * `tiposActivos` son los botones Ofrezco/Busco del buscador: un conjunto
 * vacío significa "sin filtrar" (se ven todas), igual que tener los dos
 * botones prendidos -- por eso no hace falta un tercer estado "Todas".
 */
export function matchesFilters(
  item: BuscablePublicacion,
  searchTerm: string,
  activeCategory: string,
  tiposActivos: ReadonlySet<TipoPublicacion> = new Set()
): boolean {
  if (tiposActivos.size > 0 && !tiposActivos.has(item.tipo)) return false;

  const term = searchTerm.trim().toLowerCase();
  const haystack = [
    item.titulo,
    item.descripcion,
    item.categoria,
    item.nombre,
    item.apellido,
    item.provincia,
    item.ciudad,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  let matchesTerm = true;
  if (term) {
    const palabras = term.split(/\s+/).filter(Boolean);
    matchesTerm = palabras.every((p) => haystack.indexOf(p) !== -1);
  }

  const matchesCat = !activeCategory || item.categoria === activeCategory;
  return matchesTerm && matchesCat;
}
