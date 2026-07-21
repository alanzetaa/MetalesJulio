import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useUnreadCount } from "../../hooks/useUnreadCount";
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
  const { session, loadingSession, profile, loadingProfile } = useAuth();
  const { unreadCount } = useUnreadCount();

  if (loadingSession || loadingProfile) return null;
  if (!session) return <Navigate to="/" replace />;
  if (isSuspended(profile)) return <Navigate to="/suspendido" replace />;

  return (
    <div>
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
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
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
        <Sidebar unreadCount={unreadCount} />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
