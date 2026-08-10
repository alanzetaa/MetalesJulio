import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import {
  compareAdminRows,
  comparePublicacionRows,
  matchesAdminDenunciasSearch,
  matchesAdminMensajesSearch,
  matchesAdminPublicacionesSearch,
  matchesAdminSearch,
  type AdminPublicacionSortColumn,
  type AdminSortColumn,
} from "../utils/adminMembers";
import { buildMensajesCsv, buildMiembrosCsv } from "../utils/adminCsv";
import { buildStatsTiles, contarEnLineaAhora, estaEnLinea } from "../utils/adminStats";
import { TERMINOS_VERSION_ACTUAL } from "../constants/terminos";
import { descargarCsv } from "../utils/csv";
import { isSuspended } from "../utils/suspension";
import { COMUNIDAD_PUBLICACIONES_KEY } from "../hooks/useLikes";
import { MembersTable } from "../components/admin/MembersTable";
import { AdminMensajesTable } from "../components/admin/AdminMensajesTable";
import { AdminPublicacionesTable } from "../components/admin/AdminPublicacionesTable";
import { AdminDenunciasTable } from "../components/admin/AdminDenunciasTable";
import { AdminStatsRow } from "../components/admin/AdminStatsRow";
import { SuspendModal } from "../components/admin/SuspendModal";
import { ResponderDenunciaModal } from "../components/admin/ResponderDenunciaModal";
import { EnLineaModal } from "../components/admin/EnLineaModal";
import type {
  AdminDenunciaRow,
  AdminMensajeRow,
  AdminMiembroRow,
  AdminPublicacionRow,
} from "../lib/database.types";

interface AdminDashboardData {
  members: AdminMiembroRow[];
  mensajes: AdminMensajeRow[];
  publicaciones: AdminPublicacionRow[];
  denuncias: AdminDenunciaRow[];
}

const QUERY_KEY = ["adminDashboard"];

export function AdminPage() {
  const { showToast } = useToast();
  const { session, verComo } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [memberSearch, setMemberSearch] = useState("");
  const [mensajesSearch, setMensajesSearch] = useState("");
  const [publicacionesSearch, setPublicacionesSearch] = useState("");
  const [denunciasSearch, setDenunciasSearch] = useState("");
  const [sort, setSort] = useState<{ column: AdminSortColumn; direction: "asc" | "desc" }>({
    column: "created_at",
    direction: "desc",
  });
  const [publicacionesSort, setPublicacionesSort] = useState<{
    column: AdminPublicacionSortColumn;
    direction: "asc" | "desc";
  }>({
    column: "created_at",
    direction: "desc",
  });
  const [suspendTarget, setSuspendTarget] = useState<{ id: string; nombre: string } | null>(null);
  const [responderDenunciaTarget, setResponderDenunciaTarget] = useState<AdminDenunciaRow | null>(null);
  const [enviandoRespuestaDenuncia, setEnviandoRespuestaDenuncia] = useState(false);
  const [enLineaModalOpen, setEnLineaModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<AdminDashboardData> => {
      const [membersRes, mensajesRes, publicacionesRes, denunciasRes] = await Promise.all([
        supabase.rpc("admin_listar_miembros"),
        supabase.rpc("admin_listar_mensajes"),
        supabase.rpc("admin_listar_publicaciones"),
        supabase.rpc("admin_listar_denuncias"),
      ]);
      return {
        members: membersRes.data ?? [],
        mensajes: mensajesRes.data ?? [],
        publicaciones: publicacionesRes.data ?? [],
        denuncias: denunciasRes.data ?? [],
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

  const filteredSortedPublicaciones = useMemo(() => {
    const filtered = publicaciones.filter((p) => matchesAdminPublicacionesSearch(p, publicacionesSearch));
    return [...filtered].sort((a, b) =>
      comparePublicacionRows(a, b, publicacionesSort.column, publicacionesSort.direction)
    );
  }, [publicaciones, publicacionesSearch, publicacionesSort]);

  const denuncias = useMemo(() => data?.denuncias ?? [], [data]);

  const filteredDenuncias = useMemo(
    () => denuncias.filter((d) => matchesAdminDenunciasSearch(d, denunciasSearch)),
    [denuncias, denunciasSearch]
  );

  const miembrosEnLinea = useMemo(() => members.filter((m) => estaEnLinea(m)), [members]);

  const statsTiles = useMemo(() => {
    const sieteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const tiles = buildStatsTiles({
      enLineaAhora: contarEnLineaAhora(members),
      totalMiembros: members.length,
      aceptaronTerminos: members.filter((m) => m.terminos_version_aceptada === TERMINOS_VERSION_ACTUAL).length,
      nuevosSemana: members.filter((m) => new Date(m.created_at) >= sieteDiasAtras).length,
      suspendidos: members.filter((m) => isSuspended(m)).length,
      totalMensajes: mensajes.length,
    });
    return tiles.map((t) =>
      t.etiqueta === "En línea ahora" ? { ...t, onClick: () => setEnLineaModalOpen(true) } : t
    );
  }, [members, mensajes]);

  function refetch() {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    // Las acciones de HQ Metales (suspender, reactivar, eliminar a alguien o
    // eliminar una publicación) cambian lo que se ve en "Buscar en la
    // comunidad": la vista comunidad_publicaciones filtra a los suspendidos
    // y, obviamente, ya no incluye lo eliminado. Sin esto, el feed cacheado
    // seguiría mostrando esas publicaciones hasta que venza el staleTime.
    void queryClient.invalidateQueries({ queryKey: COMUNIDAD_PUBLICACIONES_KEY });
  }

  function handleSortChange(column: AdminSortColumn) {
    setSort((prev) =>
      prev.column === column ? { column, direction: prev.direction === "asc" ? "desc" : "asc" } : { column, direction: "asc" }
    );
  }

  function handlePublicacionesSortChange(column: AdminPublicacionSortColumn) {
    setPublicacionesSort((prev) =>
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

  async function handleVerComo(id: string, nombre: string) {
    if (!window.confirm(`¿Entrar a la cuenta de ${nombre} para verificar un problema? Vas a ver la plataforma como esa persona.`))
      return;
    const error = await verComo(id, nombre);
    if (error) {
      showToast(`Error: ${error}`);
      return;
    }
    navigate("/buscar");
  }

  async function handleEnviarRespuestaDenuncia(mensaje: string) {
    if (!responderDenunciaTarget) return;
    setEnviandoRespuestaDenuncia(true);
    const { error } = await supabase.functions.invoke("responder-denuncia", {
      body: { denunciaId: responderDenunciaTarget.id, mensaje },
    });
    setEnviandoRespuestaDenuncia(false);
    if (error) {
      showToast(`Error al mandar el mail: ${error.message}`);
      return;
    }
    setResponderDenunciaTarget(null);
    showToast("Mensaje enviado.");
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
        onVerComo={(id, nombre) => void handleVerComo(id, nombre)}
        currentUserId={session?.user.id}
      />

      <AdminStatsRow tiles={statsTiles} />

      <div className="section-head" style={{ marginTop: 32, gap: 12, justifyContent: "flex-start", alignItems: "center" }}>
        <h3 style={{ margin: 0, whiteSpace: "nowrap" }}>Mensajes de la comunidad</h3>
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

      <AdminMensajesTable mensajes={filteredMensajes} todosLosMensajes={mensajes} />

      <div className="section-head" style={{ marginTop: 32, gap: 12, justifyContent: "flex-start", alignItems: "center" }}>
        <h3 style={{ margin: 0, whiteSpace: "nowrap" }}>Publicaciones de la comunidad</h3>
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
        publicaciones={filteredSortedPublicaciones}
        sort={publicacionesSort}
        onSortChange={handlePublicacionesSortChange}
        onEliminar={(id, titulo) => void handleEliminarPublicacion(id, titulo)}
      />

      <div className="section-head" style={{ marginTop: 32, gap: 12, justifyContent: "flex-start", alignItems: "center" }}>
        <h3 style={{ margin: 0, whiteSpace: "nowrap" }}>Denuncias</h3>
        <div className="field" style={{ width: "100%", maxWidth: 420 }}>
          <input
            type="text"
            placeholder="Buscar por usuario, motivo o comentario..."
            value={denunciasSearch}
            onChange={(e) => setDenunciasSearch(e.target.value)}
          />
        </div>
      </div>

      <AdminDenunciasTable denuncias={filteredDenuncias} onEnviarMensaje={setResponderDenunciaTarget} />

      <EnLineaModal open={enLineaModalOpen} miembros={miembrosEnLinea} onClose={() => setEnLineaModalOpen(false)} />
      <SuspendModal
        open={Boolean(suspendTarget)}
        targetName={suspendTarget?.nombre ?? ""}
        onClose={() => setSuspendTarget(null)}
        onConfirm={(hasta) => void handleSuspenderConfirm(hasta)}
      />
      <ResponderDenunciaModal
        open={Boolean(responderDenunciaTarget)}
        denuncianteNombre={
          responderDenunciaTarget
            ? `${responderDenunciaTarget.denunciante_nombre} ${responderDenunciaTarget.denunciante_apellido}`
            : ""
        }
        enviando={enviandoRespuestaDenuncia}
        onClose={() => setResponderDenunciaTarget(null)}
        onEnviar={(mensaje) => void handleEnviarRespuestaDenuncia(mensaje)}
      />
    </section>
  );
}
