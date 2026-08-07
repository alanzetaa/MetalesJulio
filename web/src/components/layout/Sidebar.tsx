import { useState } from "react";
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
}

export function Sidebar({ unreadCount, onSalir }: SidebarProps) {
  const { isSuperAdmin } = useAuth();
  // Solo importa en celular (ver @media en global.css) -- en desktop el
  // menú siempre está visible y este botón/estado ni se muestra.
  const [mobileOpen, setMobileOpen] = useState(false);

  function cerrarMenuMobile() {
    setMobileOpen(false);
  }

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
      <button
        type="button"
        className="app-sidebar-toggle"
        aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
        onClick={() => setMobileOpen((v) => !v)}
      >
        ☰ Menú
      </button>
      <div className={"app-sidebar-sticky" + (mobileOpen ? " open" : "")}>
        <NavLink to="/buscar" className={navItemClass} onClick={cerrarMenuMobile}>
          <span className="app-nav-icon">🔍</span>
          Buscar en la comunidad
        </NavLink>
        <NavLink to="/guardados" className={navItemClass} onClick={cerrarMenuMobile}>
          <span className="app-nav-icon">🔖</span>
          Favoritos
        </NavLink>
        <NavLink to="/publicaciones" className={navItemClass} onClick={cerrarMenuMobile}>
          <span className="app-nav-icon">📋</span>
          Mis publicaciones
        </NavLink>
        <NavLink to="/mensajes" className={navItemClass} onClick={cerrarMenuMobile}>
          <span className="app-nav-icon">✉️</span>
          Mensajes
          {unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}
        </NavLink>
        <NavLink to="/perfil" end className={navItemClass} onClick={cerrarMenuMobile}>
          <span className="app-nav-icon">👤</span>
          Mi perfil
        </NavLink>
        {isSuperAdmin && (
          <NavLink to="/admin" end className={adminNavItemClass} onClick={cerrarMenuMobile}>
            <span className="app-nav-icon">⚙</span>
            HQ Metales
          </NavLink>
        )}
        {isSuperAdmin && (
          <NavLink to="/admin/seguridad" className={adminNavItemClass} onClick={cerrarMenuMobile}>
            <span className="app-nav-icon">🔒</span>
            Seguridad
          </NavLink>
        )}
        {/* Solo visible en celular (ver @media) -- en desktop "Salir" sigue
            viviendo en el header, como siempre. */}
        <button type="button" className="app-nav-item app-nav-item-salir" onClick={onSalir}>
          <span className="app-nav-icon">🚪</span>
          Salir
        </button>
      </div>
    </nav>
  );
}
