import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useLightbox } from "../hooks/useLightbox";
import { CATEGORIES } from "../constants/categories";
import { matchesFilters } from "../utils/search";
import { ordenarFeed } from "../utils/feedOrder";
import { PublicacionCard } from "../components/comunidad/PublicacionCard";
import { ConversationModal } from "../components/mensajes/ConversationModal";
import { Lightbox } from "../components/publicaciones/Lightbox";
import type { ConversationTarget } from "../hooks/useConversationThread";
import { capitalizarNombre } from "../utils/format";
import type { ComunidadPublicacionRow } from "../lib/database.types";

export function BuscarPage() {
  const { session } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const lightbox = useLightbox();
  const userId = session?.user.id;

  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [conversationTarget, setConversationTarget] = useState<ConversationTarget | null>(null);

  const publicacionesKey = ["comunidadPublicaciones"];
  const likesKey = ["misLikes", userId];

  const { data: publicaciones = [], isLoading } = useQuery({
    queryKey: publicacionesKey,
    enabled: Boolean(userId),
    queryFn: async (): Promise<ComunidadPublicacionRow[]> => {
      const { data, error } = await supabase
        .from("comunidad_publicaciones")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        showToast(`No se pudo cargar la comunidad: ${error.message}`);
        return [];
      }
      return data ?? [];
    },
  });

  const { data: misLikedIds = new Set<string>() } = useQuery({
    queryKey: likesKey,
    enabled: Boolean(userId),
    queryFn: async (): Promise<Set<string>> => {
      const { data } = await supabase.from("publicacion_likes").select("publicacion_id").eq("user_id", userId as string);
      return new Set((data ?? []).map((l) => l.publicacion_id));
    },
  });

  // Recientes (últimas 24hs) primero, después orden aleatorio ponderado por
  // likes — ver reglas.md ("Orden del feed"). Se recalcula solo cuando
  // cambia la lista de publicaciones, no en cada tecla del buscador.
  const ordenado = useMemo(() => ordenarFeed(publicaciones), [publicaciones]);

  const filtered = useMemo(
    () => ordenado.filter((item) => matchesFilters(item, searchTerm, activeCategory)),
    [ordenado, searchTerm, activeCategory]
  );

  async function toggleLike(id: string) {
    if (!userId) return;
    const yaLiked = misLikedIds.has(id);
    if (yaLiked) {
      const { error } = await supabase.from("publicacion_likes").delete().eq("publicacion_id", id).eq("user_id", userId);
      if (error) {
        showToast(`Error: ${error.message}`);
        return;
      }
      queryClient.setQueryData<Set<string>>(likesKey, (prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      queryClient.setQueryData<ComunidadPublicacionRow[]>(publicacionesKey, (prev) =>
        (prev ?? []).map((p) => (p.id === id ? { ...p, likes_count: Math.max(0, (Number(p.likes_count) || 0) - 1) } : p))
      );
    } else {
      const { error } = await supabase.from("publicacion_likes").insert({ publicacion_id: id, user_id: userId });
      if (error) {
        showToast(`Error: ${error.message}`);
        return;
      }
      queryClient.setQueryData<Set<string>>(likesKey, (prev) => new Set(prev).add(id));
      queryClient.setQueryData<ComunidadPublicacionRow[]>(publicacionesKey, (prev) =>
        (prev ?? []).map((p) => (p.id === id ? { ...p, likes_count: (Number(p.likes_count) || 0) + 1 } : p))
      );
    }
  }

  function handleMessage(item: ComunidadPublicacionRow) {
    setConversationTarget({
      publicacionId: item.id,
      otraId: item.autor_id,
      publicacionTitulo: item.titulo,
      otraNombre: `${capitalizarNombre(item.nombre)} ${capitalizarNombre(item.apellido)}`,
    });
  }

  function handleSearch() {
    setSearchTerm(searchInput);
  }

  return (
    <div className="app-content-inner">
      <section className="app-section">
        <div className="app-section-head">
          <h2>Buscar en la comunidad</h2>
          <p>Encontrá el trabajo o la artesanía que necesitás.</p>
          <div className="section-head-action">
            <span>
              {filtered.length} {filtered.length === 1 ? "resultado" : "resultados"}
            </span>
          </div>
        </div>
        <div className="search-panel" style={{ marginBottom: 16 }}>
          <div className="field">
            <label htmlFor="searchInput">¿Qué estás buscando?</label>
            <input
              id="searchInput"
              type="text"
              placeholder="Ej: soldadura, rejas, joyería, torno..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setSearchTerm(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearch();
                }
              }}
            />
          </div>
          <div className="field">
            <label htmlFor="categoryFilter">Rubro</label>
            <select id="categoryFilter" value={activeCategory} onChange={(e) => setActiveCategory(e.target.value)}>
              <option value="">Todos los rubros</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <button type="button" className="btn btn-dark" onClick={handleSearch}>
            Buscar
          </button>
        </div>
        <div className="chips" style={{ marginBottom: 20 }}>
          <button
            type="button"
            className={"chip" + (activeCategory === "" ? " active" : "")}
            onClick={() => setActiveCategory("")}
          >
            Todos
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className={"chip" + (activeCategory === c ? " active" : "")}
              onClick={() => setActiveCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="grid">
          {isLoading ? (
            <div className="empty-state">Cargando comunidad…</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              No encontramos publicaciones para esa búsqueda todavía.
              <br />
              ¡Publicá la tuya desde "Mis publicaciones"!
            </div>
          ) : (
            filtered.map((item) => (
              <PublicacionCard
                key={item.id}
                item={item}
                liked={misLikedIds.has(item.id)}
                isOwn={item.autor_id === userId}
                onToggleLike={(id) => void toggleLike(id)}
                onMessage={handleMessage}
                onOpenFoto={(fotos) => lightbox.open(fotos, 0)}
              />
            ))
          )}
        </div>
      </section>
      <ConversationModal target={conversationTarget} onClose={() => setConversationTarget(null)} />
      <Lightbox
        fotoPaths={lightbox.fotos}
        index={lightbox.index}
        onClose={lightbox.close}
        onIndexChange={lightbox.setIndex}
      />
    </div>
  );
}
