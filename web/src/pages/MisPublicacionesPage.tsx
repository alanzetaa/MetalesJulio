import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, FOTOS_BUCKET } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useLightbox } from "../hooks/useLightbox";
import { NuevaPublicacionModal } from "../components/publicaciones/NuevaPublicacionModal";
import { EditarPublicacionModal } from "../components/publicaciones/EditarPublicacionModal";
import { MisPublicacionCard, type MisPublicacionItem } from "../components/publicaciones/MisPublicacionCard";
import { Lightbox } from "../components/publicaciones/Lightbox";
import { MAX_FOTOS, MAX_FOTO_BYTES, buildFotoPath } from "../utils/publicaciones";
import { comprimirImagen } from "../utils/imageCompression";
import { TERMINOS_VERSION_ACTUAL } from "../constants/terminos";

export function MisPublicacionesPage() {
  const { session, profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const lightbox = useLightbox();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MisPublicacionItem | null>(null);
  const fotoInputRef = useRef<HTMLInputElement | null>(null);
  const [fotoTargetId, setFotoTargetId] = useState<string | null>(null);

  // Publicar exige perfil completo Y haber aceptado la versión ACTUAL de
  // los Términos y Condiciones (ver reglas.md, "Términos y Condiciones") --
  // esto es solo la parte de UX; la policy insert_own_publicaciones lo
  // exige igual del lado del servidor, así que no hay forma real de
  // esquivarlo. Si se sube TERMINOS_VERSION_ACTUAL, a quien ya había
  // aceptado una versión vieja se le vuelve a bloquear acá.
  const puedePublicar = profile?.terminos_version_aceptada === TERMINOS_VERSION_ACTUAL;

  const userId = session?.user.id;
  const queryKey = ["misPublicaciones", userId];

  const { data: items = [], isLoading } = useQuery({
    queryKey,
    enabled: Boolean(userId),
    queryFn: async (): Promise<MisPublicacionItem[]> => {
      const { data } = await supabase
        .from("publicaciones")
        .select("*")
        .eq("user_id", userId as string)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      const publicaciones = data ?? [];
      if (!publicaciones.length) return [];
      const ids = publicaciones.map((p) => p.id);
      const { data: likesData } = await supabase
        .from("publicaciones_likes_count")
        .select("*")
        .in("publicacion_id", ids);
      const mapa: Record<string, number> = {};
      (likesData ?? []).forEach((l) => {
        mapa[l.publicacion_id] = Number(l.cantidad) || 0;
      });
      return publicaciones.map((p) => ({ ...p, likes_count: mapa[p.id] ?? 0 }));
    },
  });

  function refetch() {
    void queryClient.invalidateQueries({ queryKey });
  }

  async function handleDelete(id: string) {
    if (!window.confirm("¿Eliminar esta publicación?")) return;
    // No es un delete real (ver reglas.md): HQ Metales conserva el
    // historial completo de publicaciones y mensajes para siempre, así que
    // esto solo la marca como eliminada en vez de borrar la fila.
    const { error } = await supabase
      .from("publicaciones")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      showToast(`Error al eliminar: ${error.message}`);
      return;
    }
    showToast("Publicación eliminada.");
    refetch();
  }

  function handleAgregarFoto(id: string) {
    setFotoTargetId(id);
    fotoInputRef.current?.click();
  }

  async function handleQuitarFoto(id: string, index: number) {
    const item = items.find((p) => p.id === id);
    const path = item?.foto_paths?.[index];
    if (!item || !path) return;
    if (!window.confirm("¿Quitar esta foto?")) return;
    const nuevoArray = item.foto_paths.filter((_, i) => i !== index);
    await supabase.storage.from(FOTOS_BUCKET).remove([path]);
    const { error } = await supabase.from("publicaciones").update({ foto_paths: nuevoArray }).eq("id", id);
    if (error) {
      showToast(`Error al quitar la foto: ${error.message}`);
      return;
    }
    showToast("Foto eliminada.");
    refetch();
  }

  async function handleFotoInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const seleccionado = e.target.files?.[0];
    e.target.value = "";
    if (!seleccionado || !fotoTargetId || !session) return;
    const item = items.find((p) => p.id === fotoTargetId);
    if (!item) return;
    if ((item.foto_paths ?? []).length >= MAX_FOTOS) {
      showToast(`Ya tenés ${MAX_FOTOS} fotos, quitá una para agregar otra.`);
      return;
    }
    // Se comprime antes de chequear el tamaño -- ver reglas.md
    // ("Compresión de fotos"): una foto de más de 5MB muchas veces
    // termina pesando bastante menos comprimida, no hace falta
    // rechazarla de entrada.
    const file = await comprimirImagen(seleccionado);
    if (file.size > MAX_FOTO_BYTES) {
      showToast("La foto no puede pesar más de 5MB.");
      return;
    }
    const path = buildFotoPath(session.user.id, file.name);
    const { error: uploadError } = await supabase.storage.from(FOTOS_BUCKET).upload(path, file);
    if (uploadError) {
      showToast(`Error al subir la foto: ${uploadError.message}`);
      return;
    }
    const nuevoArray = [...(item.foto_paths ?? []), path];
    const { error } = await supabase.from("publicaciones").update({ foto_paths: nuevoArray }).eq("id", fotoTargetId);
    if (error) {
      showToast(`Error al guardar la foto: ${error.message}`);
      return;
    }
    showToast("Foto agregada.");
    refetch();
  }

  return (
    <div className="app-content-inner">
      <section className="app-section">
        <div className="app-section-head">
          <h2>Mis publicaciones</h2>
          <p>Los trabajos y artesanías que publicás para que la comunidad los encuentre.</p>
          <div className="section-head-action">
            <button
              className="btn btn-accent"
              type="button"
              disabled={!puedePublicar}
              title={puedePublicar ? undefined : "Tenés que aceptar los Términos y Condiciones en Mi perfil primero"}
              onClick={() => setModalOpen(true)}
            >
              + Nueva publicación
            </button>
          </div>
        </div>
        {!puedePublicar && (
          <p className="hint" style={{ marginBottom: 16 }}>
            {profile
              ? "Para publicar, primero tenés que aceptar los Términos y Condiciones en "
              : "Completá tu perfil y aceptá los Términos y Condiciones en "}
            <button type="button" className="link-btn" onClick={() => navigate("/perfil")}>
              Mi perfil
            </button>
            .
          </p>
        )}
        <input
          type="file"
          accept="image/*"
          hidden
          ref={fotoInputRef}
          onChange={(e) => void handleFotoInputChange(e)}
        />
        <div className="grid">
          {isLoading ? (
            <div className="empty-state">Cargando…</div>
          ) : items.length === 0 ? null : (
            items.map((item) => (
              <MisPublicacionCard
                key={item.id}
                item={item}
                onDelete={(id) => void handleDelete(id)}
                onEditar={setEditTarget}
                onAgregarFoto={handleAgregarFoto}
                onQuitarFoto={(id, i) => void handleQuitarFoto(id, i)}
                onOpenFoto={(fotos, i) => lightbox.open(fotos, i)}
              />
            ))
          )}
        </div>
      </section>
      <NuevaPublicacionModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={refetch} />
      <EditarPublicacionModal item={editTarget} onClose={() => setEditTarget(null)} onUpdated={refetch} />
      <Lightbox
        fotoPaths={lightbox.fotos}
        index={lightbox.index}
        onClose={lightbox.close}
        onIndexChange={lightbox.setIndex}
      />
    </div>
  );
}
