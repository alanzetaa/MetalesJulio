import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import { useToast } from "../context/ToastContext";
import {
  compareAdminRows,
  matchesAdminMensajesSearch,
  matchesAdminPublicacionesSearch,
  matchesAdminSearch,
  type AdminSortColumn,
} from "../utils/adminMembers";
import { buildMensajesCsv, buildMiembrosCsv } from "../utils/adminCsv";
import { categoriaChartItems, porDiaChartItems, totalCantidad } from "../utils/adminCharts";
import { buildStatsTiles, contarEnLineaAhora } from "../utils/adminStats";
import { construirRangoDias } from "../utils/dateRange";
import { descargarCsv } from "../utils/csv";
import { isSuspended } from "../utils/suspension";
import { MembersTable } from "../components/admin/MembersTable";
import { AdminMensajesTable } from "../components/admin/AdminMensajesTable";
import { AdminPublicacionesTable } from "../components/admin/AdminPublicacionesTable";
import { AdminStatsRow } from "../components/admin/AdminStatsRow";
import { BarChart } from "../components/admin/BarChart";
import { SuspendModal } from "../components/admin/SuspendModal";
import type {
  AdminMensajeRow,
  AdminMiembroRow,
  AdminPublicacionRow,
  StatsCategoriaRow,
  StatsPorDiaRow,
} from "../lib/database.types";

interface AdminDashboardData {
  members: AdminMiembroRow[];
  categorias: StatsCategoriaRow[];
  altas: StatsPorDiaRow[];
  mensajesPorDia: StatsPorDiaRow[];
  contactosPorDia: StatsPorDiaRow[];
  mensajes: AdminMensajeRow[];
  publicaciones: AdminPublicacionRow[];
}

const QUERY_KEY = ["adminDashboard"];

export function AdminPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [memberSearch, setMemberSearch] = useState("");
  const [mensajesSearch, setMensajesSearch] = useState("");
  const [publicacionesSearch, setPublicacionesSearch] = useState("");
  const [sort, setSort] = useState<{ column: AdminSortColumn; direction: "asc" | "desc" }>({
    column: "created_at",
    direction: "desc",
  });
  const [suspendTarget, setSuspendTarget] = useState<{ id: string; nombre: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<AdminDashboardData> => {
      const [membersRes, categoriasRes, altasRes, mensajesPorDiaRes, contactosPorDiaRes, mensajesRes, publicacionesRes] =
        await Promise.all([
          supabase.rpc("admin_listar_miembros"),
          supabase.rpc("admin_stats_categorias"),
          supabase.rpc("admin_stats_altas_por_dia"),
          supabase.rpc("admin_stats_mensajes_por_dia"),
          supabase.rpc("admin_stats_contactos_por_dia"),
          supabase.rpc("admin_listar_mensajes"),
          supabase.rpc("admin_listar_publicaciones"),
        ]);
      return {
        members: membersRes.data ?? [],
        categorias: categoriasRes.data ?? [],
        altas: altasRes.data ?? [],
        mensajesPorDia: mensajesPorDiaRes.data ?? [],
        contactosPorDia: contactosPorDiaRes.data ?? [],
        mensajes: mensajesRes.data ?? [],
        publicaciones: publicacionesRes.data ?? [],
      };
    },
  });

  const members = useMemo(() => data?.members ?? [], [data]);
  const mensajes = useMemo(() => data?.mensajes ?? [], [data]);
  const publicaciones = useMemo(() => data?.publicaciones ?? [], [data]);

  const filteredSortedMembers = useMemo(() => {
    const filtered = members.filter((m) => matchesAdminSearch(m, memberSearch));
    return [...filtered].sort((a, b) => compareAdminRows(a, b, sort.column, sort.direction));
  }, [members, memberSearch, sort]);

  const filteredMensajes = useMemo(
    () => mensajes.filter((m) => matchesAdminMensajesSearch(m, mensajesSearch)),
    [mensajes, mensajesSearch]
  );

  const filteredPublicaciones = useMemo(
    () => publicaciones.filter((p) => matchesAdminPublicacionesSearch(p, publicacionesSearch)),
    [publicaciones, publicacionesSearch]
  );

  const statsTiles = useMemo(() => {
    const sieteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const contactosSemana = totalCantidad(construirRangoDias(data?.contactosPorDia ?? [], 7));
    return buildStatsTiles({
      enLineaAhora: contarEnLineaAhora(members),
      totalMiembros: members.length,
      nuevosSemana: members.filter((m) => new Date(m.created_at) >= sieteDiasAtras).length,
      suspendidos: members.filter((m) => isSuspended(m)).length,
      totalMensajes: mensajes.length,
      contactosSemana,
    });
  }, [members, mensajes, data?.contactosPorDia]);

  const categoriaItems = useMemo(() => categoriaChartItems(data?.categorias ?? []), [data?.categorias]);
  const totalCategorias = useMemo(() => totalCantidad(data?.categorias ?? []), [data?.categorias]);

  const altasItems = useMemo(() => porDiaChartItems(data?.altas ?? [], "#4895ef"), [data?.altas]);
  const mensajesPorDiaItems = useMemo(() => porDiaChartItems(data?.mensajesPorDia ?? [], "#9d4edd"), [data?.mensajesPorDia]);
  const contactosPorDiaItems = useMemo(() => porDiaChartItems(data?.contactosPorDia ?? [], "#e07a5f"), [data?.contactosPorDia]);
  const totalAltas = useMemo(() => totalCantidad(construirRangoDias(data?.altas ?? [], 30)), [data?.altas]);
  const totalMensajesPorDia = useMemo(
    () => totalCantidad(construirRangoDias(data?.mensajesPorDia ?? [], 30)),
    [data?.mensajesPorDia]
  );
  const totalContactosPorDia = useMemo(
    () => totalCantidad(construirRangoDias(data?.contactosPorDia ?? [], 30)),
    [data?.contactosPorDia]
  );

  function refetch() {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  }

  function handleSortChange(column: AdminSortColumn) {
    setSort((prev) =>
      prev.column === column ? { column, direction: prev.direction === "asc" ? "desc" : "asc" } : { column, direction: "asc" }
    );
  }

  async function handleReactivar(id: string) {
    const { error } = await supabase.rpc("admin_suspender_usuario", { target_id: id, hasta: null });
    if (error) {
      showToast(`Error: ${error.message}`);
      return;
    }
    showToast("Miembro reactivado.");
    refetch();
  }

  async function handleEliminar(id: string, nombre: string) {
    if (
      !window.confirm(
        `¿Eliminar el perfil de ${nombre}? Esto borra sus datos y publicaciones de la comunidad (la cuenta para iniciar sesión no se elimina).`
      )
    )
      return;
    const { error } = await supabase.rpc("admin_eliminar_perfil", { target_id: id });
    if (error) {
      showToast(`Error: ${error.message}`);
      return;
    }
    showToast("Perfil eliminado.");
    refetch();
  }

  async function handleSuspenderConfirm(hastaIso: string) {
    if (!suspendTarget) return;
    const { error } = await supabase.rpc("admin_suspender_usuario", { target_id: suspendTarget.id, hasta: hastaIso });
    if (error) {
      showToast(`Error: ${error.message}`);
      return;
    }
    setSuspendTarget(null);
    showToast("Miembro suspendido.");
    refetch();
  }

  async function handleEliminarPublicacion(id: string, titulo: string) {
    if (!window.confirm(`¿Eliminar la publicación "${titulo}"? Esto también borra sus likes y mensajes asociados.`))
      return;
    const { error } = await supabase.rpc("admin_eliminar_publicacion", { target_id: id });
    if (error) {
      showToast(`Error: ${error.message}`);
      return;
    }
    showToast("Publicación eliminada.");
    refetch();
  }

  function handleExportMiembros() {
    const { headers, filas } = buildMiembrosCsv(members);
    descargarCsv(`miembros-metales-julio-${new Date().toISOString().slice(0, 10)}.csv`, headers, filas);
  }

  function handleExportMensajes() {
    const { headers, filas } = buildMensajesCsv(mensajes);
    descargarCsv(`mensajes-metales-julio-${new Date().toISOString().slice(0, 10)}.csv`, headers, filas);
  }

  return (
    <section className="app-section" id="section-admin">
      <div className="app-section-head">
        <h2>HQ Metales</h2>
        <p>Todo lo que pasa en la comunidad, en un solo lugar.</p>
      </div>

      <div className="section-head" style={{ marginTop: 8, justifyContent: "center", gap: 12 }}>
        <div className="field" style={{ width: "100%", maxWidth: 420 }}>
          <input
            type="text"
            placeholder="Buscar por nombre, DNI o email..."
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
          />
        </div>
        <button type="button" className="btn btn-outline-dark" style={{ alignSelf: "flex-end" }} onClick={handleExportMiembros}>
          Exportar a Excel
        </button>
      </div>

      <MembersTable
        members={filteredSortedMembers}
        isLoading={isLoading}
        sort={sort}
        onSortChange={handleSortChange}
        onSuspender={(id, nombre) => setSuspendTarget({ id, nombre })}
        onReactivar={(id) => void handleReactivar(id)}
        onEliminar={(id, nombre) => void handleEliminar(id, nombre)}
      />

      <AdminStatsRow tiles={statsTiles} />

      <div className="admin-charts-row">
        <div className="card admin-chart-card">
          <h3>
            Publicaciones por rubro <span className="admin-chart-subtitle">({totalCategorias} publicaciones en total)</span>
          </h3>
          <div className="admin-chart">
            <BarChart items={categoriaItems} />
          </div>
        </div>
        <div className="card admin-chart-card">
          <h3>
            Altas de miembros por día <span className="admin-chart-subtitle">({totalAltas} en los últimos 30 días)</span>
          </h3>
          <div className="admin-chart">
            <BarChart items={altasItems} />
          </div>
        </div>
        <div className="card admin-chart-card">
          <h3>
            Mensajes por día <span className="admin-chart-subtitle">({totalMensajesPorDia} en los últimos 30 días)</span>
          </h3>
          <div className="admin-chart">
            <BarChart items={mensajesPorDiaItems} />
          </div>
        </div>
        <div className="card admin-chart-card">
          <h3>
            Contactos por día <span className="admin-chart-subtitle">({totalContactosPorDia} en los últimos 30 días)</span>
          </h3>
          <div className="admin-chart">
            <BarChart items={contactosPorDiaItems} />
          </div>
        </div>
      </div>

      <div className="section-head" style={{ marginTop: 8, justifyContent: "center", gap: 12 }}>
        <div className="field" style={{ width: "100%", maxWidth: 420 }}>
          <input
            type="text"
            placeholder="Buscar en los mensajes..."
            value={mensajesSearch}
            onChange={(e) => setMensajesSearch(e.target.value)}
          />
        </div>
        <button type="button" className="btn btn-outline-dark" style={{ alignSelf: "flex-end" }} onClick={handleExportMensajes}>
          Exportar a Excel
        </button>
      </div>

      <AdminMensajesTable mensajes={filteredMensajes} />

      <div className="section-head" style={{ marginTop: 32, justifyContent: "center", gap: 12 }}>
        <div className="field" style={{ width: "100%", maxWidth: 420 }}>
          <input
            type="text"
            placeholder="Buscar por usuario o texto de la publicación..."
            value={publicacionesSearch}
            onChange={(e) => setPublicacionesSearch(e.target.value)}
          />
        </div>
      </div>

      <AdminPublicacionesTable
        publicaciones={filteredPublicaciones}
        onEliminar={(id, titulo) => void handleEliminarPublicacion(id, titulo)}
      />

      <SuspendModal
        open={Boolean(suspendTarget)}
        targetName={suspendTarget?.nombre ?? ""}
        onClose={() => setSuspendTarget(null)}
        onConfirm={(hasta) => void handleSuspenderConfirm(hasta)}
      />
    </section>
  );
}
