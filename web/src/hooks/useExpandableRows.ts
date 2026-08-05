import { useState } from "react";

/**
 * Estado de qué filas están desplegadas en las tablas de HQ Metales en
 * celular (ver reglas.md, "Tablas de HQ en celular como acordeón") -- en
 * desktop no se usa (ahí se ve la tabla entera siempre), pero el toggle es
 * inofensivo igual si se llega a clickear.
 */
export function useExpandableRows() {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function isExpanded(id: string): boolean {
    return expandedIds.has(id);
  }

  return { toggle, isExpanded };
}
