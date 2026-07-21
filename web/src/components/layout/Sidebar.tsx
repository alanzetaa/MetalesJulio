import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function navItemClass({ isActive }: { isActive: boolean }): string {
  return "app-nav-item" + (isActive ? " active" : "");
}

function adminNavItemClass({ isActive }: { isActive: boolean }): string {
  return "app-nav-item app-nav-item-admin" + (isActive ? " active" : "");
}

export function Sidebar({ unreadCount }: { unreadCount: number }) {
  const { isSuperAdmin } = useAuth();

  return (
    <nav className="app-sidebar" id="appSidebar">
      <NavLink to="/buscar" className={navItemClass}>
        <span className="app-nav-icon" />
        Buscar en la comunidad
      </NavLink>
      <NavLink to="/publicaciones" className={navItemClass}>
        <span className="app-nav-icon" />
        Mis publicaciones
      </NavLink>
      <NavLink to="/mensajes" className={navItemClass}>
        <span className="app-nav-icon" />
        Mensajes
        {unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}
      </NavLink>
      <NavLink to="/perfil" className={navItemClass}>
        <span className="app-nav-icon" />
        Mi perfil
      </NavLink>
      {isSuperAdmin && (
        <NavLink to="/admin" className={adminNavItemClass}>
          <span className="app-nav-icon">⚙</span>
          HQ Metales
        </NavLink>
      )}
      {isSuperAdmin && (
        <NavLink to="/admin/seguridad" className={adminNavItemClass}>
          <span className="app-nav-icon">🔒</span>
          Seguridad
        </NavLink>
      )}
    </nav>
  );
}
