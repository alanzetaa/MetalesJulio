import { useCallback, useState } from "react";

/**
 * Notificaciones del navegador (API nativa `Notification`, no push real) —
 * ver reglas.md ("Notificaciones del navegador"). Solo funcionan mientras
 * la persona tiene el sitio abierto en alguna pestaña; no llegan con el
 * navegador cerrado (eso sería "push" de verdad, que necesita un Service
 * Worker + claves VAPID + un mecanismo del lado del servidor -- decisión
 * explícita de no hacerlo así, mucho más simple esto y cubre el caso real
 * pedido: "avisame si tengo otra pestaña abierta").
 */
export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function useBrowserNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    isNotificationSupported() ? Notification.permission : "denied"
  );

  const requestPermission = useCallback(async () => {
    if (!isNotificationSupported()) return;
    const result = await Notification.requestPermission();
    setPermission(result);
  }, []);

  const notify = useCallback((title: string, body: string) => {
    if (!isNotificationSupported() || Notification.permission !== "granted") return;
    try {
      new Notification(title, { body, icon: "/favicon.png?v=2" });
    } catch {
      // Algunos navegadores (sobre todo en celular) no soportan
      // `new Notification()` directo -- se ignora en silencio, el badge
      // adentro de la app sigue avisando igual.
    }
  }, []);

  return { permission, requestPermission, notify, supported: isNotificationSupported() };
}
