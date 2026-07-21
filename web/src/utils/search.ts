import type { ComunidadPublicacionRow } from "../lib/database.types";

type BuscablePublicacion = Pick<
  ComunidadPublicacionRow,
  "titulo" | "descripcion" | "categoria" | "nombre" | "apellido" | "provincia"
>;

/**
 * Separa el término de búsqueda en palabras y exige que TODAS aparezcan en
 * el texto de la publicación, sin importar el orden — así "pulsera grabada"
 * encuentra "pulsera plata grabada". No es una búsqueda exacta de substring.
 */
export function matchesFilters(
  item: BuscablePublicacion,
  searchTerm: string,
  activeCategory: string
): boolean {
  const term = searchTerm.trim().toLowerCase();
  const haystack = [item.titulo, item.descripcion, item.categoria, item.nombre, item.apellido, item.provincia]
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
