import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import { useToast } from "../context/ToastContext";
import { filtrarCandidatosSuperAdmin } from "../utils/adminSuperAdmins";
import { capitalizarNombre } from "../utils/format";
import type { AdminMiembroRow, AdminSuperAdminRow } from "../lib/database.types";

const MEMBERS_KEY = ["seguridadMiembros"];
const SUPER_ADMINS_KEY = ["superAdmins"];

export function SeguridadPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [suggOpen, setSuggOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: members = [] } = useQuery({
    queryKey: MEMBERS_KEY,
    queryFn: async (): Promise<AdminMiembroRow[]> => {
      const { data } = await supabase.rpc("admin_listar_miembros");
      return data ?? [];
    },
  });

  const { data: superAdmins = [], isLoading } = useQuery({
    queryKey: SUPER_ADMINS_KEY,
    queryFn: async (): Promise<AdminSuperAdminRow[]> => {
      const { data } = await supabase.rpc("admin_listar_super_admins");
      return data ?? [];
    },
  });

  const candidatos = filtrarCandidatosSuperAdmin(members, searchTerm);
  const soloUno = superAdmins.length <= 1;

  function refetchSuperAdmins() {
    void queryClient.invalidateQueries({ queryKey: SUPER_ADMINS_KEY });
  }

  function elegirCandidato(m: AdminMiembroRow) {
    setSelectedId(m.id);
    setSearchTerm(`${capitalizarNombre(m.nombre)} ${capitalizarNombre(m.apellido)} — ${m.email}`);
    setSuggOpen(false);
  }

  async function handleAgregar() {
    if (!selectedId) {
      showToast("Elegí a alguien de la lista primero.");
      return;
    }
    if (!window.confirm(`¿Agregar a ${searchTerm} como súper admin? Va a poder ver y administrar HQ Metales.`)) return;
    const { error } = await supabase.rpc("admin_agregar_super_admin", { target_id: selectedId });
    if (error) {
      showToast(`Error: ${error.message}`);
      return;
    }
    showToast("Súper admin agregado.");
    setSelectedId(null);
    setSearchTerm("");
    refetchSuperAdmins();
  }

  async function handleQuitar(sa: AdminSuperAdminRow) {
    const nombreCompleto = `${capitalizarNombre(sa.nombre)} ${capitalizarNombre(sa.apellido)}`;
    if (!window.confirm(`¿Quitarle el acceso de súper admin a ${nombreCompleto}?`)) return;
    const { error } = await supabase.rpc("admin_quitar_super_admin", { target_id: sa.user_id });
    if (error) {
      showToast(`Error: ${error.message}`);
      return;
    }
    showToast("Súper admin eliminado.");
    refetchSuperAdmins();
  }

  return (
    <div className="app-content-inner">
      <section className="app-section">
        <div className="app-section-head">
          <h2>Seguridad</h2>
          <p>Quién puede ver y administrar HQ Metales.</p>
        </div>
        <div className="card" style={{ maxWidth: 520, margin: "0 auto 20px", textAlign: "left" }}>
          <div className="form-row form-row-2" style={{ alignItems: "end", marginBottom: 10 }}>
            <div className="field">
              <label htmlFor="addSuperAdminSearch">Agregar súper admin</label>
              <div className="dir-wrap">
                <input
                  id="addSuperAdminSearch"
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  autoComplete="off"
                  value={searchTerm}
                  onFocus={() => setSuggOpen(true)}
                  onChange={(e) => {
                    setSelectedId(null);
                    setSearchTerm(e.target.value);
                    setSuggOpen(true);
                  }}
                  onBlur={() => setTimeout(() => setSuggOpen(false), 180)}
                />
                {suggOpen && (
                  <div className="dir-sugg">
                    {candidatos.length === 0 ? (
                      <div className="dir-sugg-item dir-sugg-empty">Sin resultados</div>
                    ) : (
                      candidatos.map((m) => (
                        <button
                          type="button"
                          key={m.id}
                          className="dir-sugg-item"
                          onMouseDown={() => elegirCandidato(m)}
                        >
                          {capitalizarNombre(m.nombre)} {capitalizarNombre(m.apellido)} — {m.email}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
            <button type="button" className="btn btn-dark" onClick={() => void handleAgregar()}>
              Agregar
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {isLoading ? (
              <p className="hint" style={{ margin: 0 }}>
                Cargando…
              </p>
            ) : superAdmins.length === 0 ? (
              <p className="hint" style={{ margin: 0 }}>
                No hay súper admins cargados.
              </p>
            ) : (
              superAdmins.map((sa) => (
                <div className="super-admin-item" key={sa.user_id}>
                  <span>
                    {capitalizarNombre(sa.nombre)} {capitalizarNombre(sa.apellido)} — {sa.email}
                  </span>
                  <button
                    type="button"
                    className="btn btn-danger"
                    disabled={soloUno}
                    title={soloUno ? "No se puede quitar al único súper admin" : undefined}
                    onClick={() => void handleQuitar(sa)}
                  >
                    Quitar
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
