import { useEffect, useRef, useState } from "react";

/**
 * Scroll infinito estilo Instagram (ver reglas.md, "Feed infinito"): en vez
 * de dibujar toda la lista de una, va revelando de a `pageSize` a medida
 * que el usuario se acerca al final (IntersectionObserver sobre un
 * elemento "centinela" al final de la lista).
 *
 * Importante: esto NO pagina contra el servidor -- la lista completa ya se
 * trajo de una sola consulta (la comunidad todavía no es tan grande como
 * para que eso sea un problema de rendimiento). Esto solo controla cuánto
 * se dibuja en pantalla, para que la experiencia de scrollear se sienta
 * igual que Instagram sin tener que coordinar paginado real del lado del
 * servidor con el orden aleatorio ponderado del feed.
 *
 * `resetKey` reinicia el conteo a `pageSize` cuando cambia (por ejemplo, al
 * cambiar el término de búsqueda o el rubro) -- así una búsqueda nueva
 * siempre arranca mostrando solo la primera tanda, en vez de arrastrar la
 * cantidad revelada de la búsqueda anterior.
 */
export function useInfiniteReveal(totalCount: number, resetKey: unknown, pageSize = 10) {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setVisibleCount(pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, pageSize]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + pageSize, totalCount));
        }
      },
      { rootMargin: "600px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [totalCount, pageSize, visibleCount]);

  return { visibleCount, sentinelRef };
}
