import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function navItemClass({ isActive }: { isActive: boolean }): string {
  return "app-nav-item" + (isActive ? " active" : "");
}

function adminNavItemClass({ isActive }: { isActive: boolean }): string {
  return "app-nav-item app-nav-item-admin" + (isActive ? " active" : "");
}

interface SidebarProps {
  unreadCount: number;
  onSalir: () => void;
  /** Si el menú desplegable de celular está abierto (el botón que lo abre vive en AppShell, adentro del header, para que quede siempre fijo). */
  mobileOpen: boolean;
  /** Cierra el menú de celular al elegir una opción. */
  onNavigate: () => void;
}

export function Sidebar({ unreadCount, onSalir, mobileOpen, onNavigate }: SidebarProps) {
  const { isSuperAdmin } = useAuth();

  return (
    <nav className="app-sidebar" id="appSidebar">
      {/* El fondo negro va en el <nav> de afuera para que llegue hasta el
          final de la columna (misma altura que el contenido, gracias a
          align-items:stretch en .app-shell); el "sticky" va en este div de
          adentro, más corto que el <nav>, que es lo que necesita para poder
          quedarse fijo mientras se scrollea -- si el sticky se pone en el
          mismo elemento que ya mide el 100% de la columna, no tiene margen
          para "pegarse" y además el fondo se corta apenas terminan los
          botones en vez de seguir hasta abajo. */}
      <div className={"app-sidebar-sticky" + (mobileOpen ? " open" : "")}>
        <NavLink to="/buscar" className={navItemClass} onClick={onNavigate}>
          <span className="app-nav-icon">🔍</span>
          Buscar en la comunidad
        </NavLink>
        <NavLink to="/guardados" className={navItemClass} onClick={onNavigate}>
          <span className="app-nav-icon">🔖</span>
          Favoritos
        </NavLink>
        <NavLink to="/publicaciones" className={navItemClass} onClick={onNavigate}>
          <span className="app-nav-icon">📋</span>
          Mis publicaciones
        </NavLink>
        <NavLink to="/mensajes" className={navItemClass} onClick={onNavigate}>
          <span className="app-nav-icon">✉️</span>
          Mensajes
          {unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}
        </NavLink>
        <NavLink to="/perfil" end className={navItemClass} onClick={onNavigate}>
          <span className="app-nav-icon">👤</span>
          Mi perfil
        </NavLink>
        {isSuperAdmin && (
          <NavLink to="/admin" end className={adminNavItemClass} onClick={onNavigate}>
            <span className="app-nav-icon">⚙</span>
            HQ Metales
          </NavLink>
        )}
        {isSuperAdmin && (
          <NavLink to="/admin/seguridad" className={adminNavItemClass} onClick={onNavigate}>
            <span className="app-nav-icon">🔒</span>
            Seguridad
          </NavLink>
        )}
        {/* Solo visible en celular (ver @media) -- en desktop "Salir" sigue
            viviendo en el header, como siempre. */}
        <button
          type="button"
          className="app-nav-item app-nav-item-salir"
          onClick={() => {
            onNavigate();
            onSalir();
          }}
        >
          <span className="app-nav-icon">🚪</span>
          Salir
        </button>
      </div>
    </nav>
  );
}
