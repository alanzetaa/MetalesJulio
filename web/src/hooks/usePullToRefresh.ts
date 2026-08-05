import { useEffect, useRef, useState } from "react";

const THRESHOLD_PX = 70;
const MAX_PULL_PX = 100;

/**
 * Pull-to-refresh propio, sin depender del gesto nativo del navegador (ese
 * gesto dispara una recarga real de página, y como la sesión no persiste
 * entre recargas -- persistSession:false, decisión explícita de seguridad --
 * deslogueaba a la persona; el nativo ya está bloqueado con
 * overscroll-behavior-y:contain en global.css). Solo reacciona si el toque
 * arranca con la página scrolleada del todo arriba (scrollY === 0), como el
 * gesto nativo que reemplaza.
 */
export function usePullToRefresh(onRefresh: () => Promise<unknown> | void) {
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startYRef = useRef<number | null>(null);
  const distanceRef = useRef(0);
  const refreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      if (refreshingRef.current || window.scrollY > 0) {
        startYRef.current = null;
        return;
      }
      startYRef.current = e.touches[0].clientY;
    }

    function onTouchMove(e: TouchEvent) {
      if (startYRef.current == null || refreshingRef.current) return;
      const delta = e.touches[0].clientY - startYRef.current;
      if (delta <= 0 || window.scrollY > 0) {
        distanceRef.current = 0;
        setPullDistance(0);
        return;
      }
      distanceRef.current = delta;
      setPullDistance(Math.min(delta, MAX_PULL_PX));
    }

    async function onTouchEnd() {
      const shouldRefresh = distanceRef.current > THRESHOLD_PX;
      startYRef.current = null;
      distanceRef.current = 0;
      setPullDistance(0);
      if (!shouldRefresh || refreshingRef.current) return;
      refreshingRef.current = true;
      setRefreshing(true);
      try {
        await onRefreshRef.current();
      } finally {
        refreshingRef.current = false;
        setRefreshing(false);
      }
    }

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  return { refreshing, pullDistance, threshold: THRESHOLD_PX };
}
