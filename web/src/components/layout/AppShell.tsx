import { useEffect, useRef } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { useUnreadCount } from "../../hooks/useUnreadCount";
import { useHeartbeat } from "../../hooks/useHeartbeat";
import { usePullToRefresh } from "../../hooks/usePullToRefresh";
import { useToast } from "../../context/ToastContext";
import { capitalizarNombre } from "../../utils/format";
import { isSuspended } from "../../utils/suspension";
import { supabase } from "../../lib/supabaseClient";
import { Sidebar } from "./Sidebar";

/**
 * Layout de la app logueada: topbar + sidebar + <Outlet/>. Cada página
 * decide su propio ancho (la mayoría usa .app-content-inner, acotado a
 * 960px; HQ Metales y Seguridad usan su propio wrapper más ancho) — por eso
 * acá no se envuelve el Outlet en .app-content-inner globalmente.
 */
export function AppShell() {
  const { session, loadingSession, profile, loadingProfile, impersonatingLabel, salirDeVerComo } = useAuth();
  const { unreadCount, notificationsPermission, requestNotificationsPermission, notificationsSupported } =
    useUnreadCount();
  useHeartbeat();
  const queryClient = useQueryClient();
  const { refreshing, pullDistance, threshold } = usePullToRefresh(() => queryClient.invalidateQueries());
  const { showToast } = useToast();
  const navigate = useNavigate();

  async function handleSalirDeVerComo() {
    await salirDeVerComo();
    navigate("/admin");
  }
  // Avisa una sola vez por sesión (no en cada poll de 30s) si hay mensajes
  // sin leer al entrar -- ver reglas.md ("Notificaciones de mensajes nuevos").
  const yaAvisadoRef = useRef(false);

  useEffect(() => {
    if (yaAvisadoRef.current || unreadCount <= 0) return;
    yaAvisadoRef.current = true;
    showToast(`Tenés ${unreadCount} mensaje${unreadCount === 1 ? "" : "s"} nuevo${unreadCount === 1 ? "" : "s"}.`);
  }, [unreadCount, showToast]);

  if (loadingSession || loadingProfile) return null;
  if (!session) return <Navigate to="/" replace />;
  if (isSuspended(profile)) return <Navigate to="/suspendido" replace />;

  return (
    <div>
      {impersonatingLabel && (
        <div className="impersonating-banner">
          Estás viendo como <strong>{impersonatingLabel}</strong>
          <button type="button" className="btn btn-dark" onClick={() => void handleSalirDeVerComo()}>
            Volver a mi cuenta
          </button>
        </div>
      )}
      {(refreshing || pullDistance > 0) && (
        <div
          className={`pull-refresh-indicator${refreshing ? " pull-refresh-indicator-active" : ""}`}
          style={{ opacity: refreshing ? 1 : Math.min(pullDistance / threshold, 1) }}
        >
          {refreshing ? "Actualizando…" : pullDistance > threshold ? "Soltá para actualizar" : "Tirá para actualizar"}
        </div>
      )}
      <header className="app-topbar">
        <div className="app-topbar-row">
          <span className="logo">
            <span className="logo-badge">MJ</span>
            <span className="logo-text">
              <strong>METALES JULIO</strong>
              <span>Comunidad de oficios</span>
            </span>
          </span>
          <span className="app-slogan">Un lugar para crecer entre todos</span>
          <div className="app-topbar-actions">
            {notificationsSupported && notificationsPermission === "default" && (
              <button
                type="button"
                className="btn btn-outline-dark"
                onClick={() => void requestNotificationsPermission()}
                title="Recibir un aviso del navegador cuando te llega un mensaje nuevo"
                aria-label="Activar avisos"
              >
                🔔 <span className="btn-label-mobile-hide">Activar avisos</span>
              </button>
            )}
            <span className="auth-greeting">
              Hola{profile ? `, ${capitalizarNombre(profile.nombre)}` : ""}
            </span>
            <button type="button" className="btn btn-dark" id="logoutBtn" onClick={() => void supabase.auth.signOut()}>
              Salir
            </button>
          </div>
        </div>
      </header>
      <div className="app-shell">
        <Sidebar unreadCount={unreadCount} onSalir={() => void supabase.auth.signOut()} />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
