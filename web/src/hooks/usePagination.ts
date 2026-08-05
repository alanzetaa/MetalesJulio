import { useEffect, useState } from "react";

const DEFAULT_PAGE_SIZE = 15;

/**
 * Paginado del lado del cliente para las tablas de HQ Metales (pedido
 * explícito del dueño, pensando en el día que la comunidad tenga cientos de
 * miembros: ni el acordeón de celular alcanza si hay que scrollear 500
 * filas para llegar al final). Los datos siguen llegando completos desde
 * Supabase (así el buscador de texto libre de cada tabla sigue filtrando
 * sobre TODO el listado, no solo la página visible) -- acá solo se recorta
 * qué pedazo se dibuja en pantalla.
 */
export function usePagination<T>(items: T[], pageSize: number = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  // Si cambia la búsqueda/orden (o llegan datos nuevos) y la página actual
  // queda fuera de rango, vuelve a la primera -- sin esto, buscar algo con
  // pocos resultados podía dejar a la persona viendo una página vacía.
  useEffect(() => {
    setPage(1);
  }, [items]);

  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  return {
    pageItems,
    page: safePage,
    totalPages,
    nextPage: () => setPage((p) => Math.min(p + 1, totalPages)),
    prevPage: () => setPage((p) => Math.max(p - 1, 1)),
  };
}
