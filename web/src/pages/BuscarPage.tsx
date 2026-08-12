import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useLightbox } from "../hooks/useLightbox";
import { useInfiniteReveal } from "../hooks/useInfiniteReveal";
import { useLikes, COMUNIDAD_PUBLICACIONES_KEY } from "../hooks/useLikes";
import { useGuardados } from "../hooks/useGuardados";
import { CATEGORIES } from "../constants/categories";
import { matchesFilters } from "../utils/search";
import { ordenarFeed } from "../utils/feedOrder";
import { PublicacionCard } from "../components/comunidad/PublicacionCard";
import { ConversationModal } from "../components/mensajes/ConversationModal";
import { Lightbox } from "../components/publicaciones/Lightbox";
import type { ConversationTarget } from "../hooks/useConversationThread";
import { capitalizarOracion, formatNombrePublico } from "../utils/format";
import type { ComunidadPublicacionRow, TipoPublicacion } from "../lib/database.types";

const TIPO_FILTROS: { tipo: TipoPublicacion; label: string }[] = [
  { tipo: "ofrezco", label: "Ofrezco" },
  { tipo: "busco", label: "Busco" },
];

export function BuscarPage() {
  const { session } = useAuth();
  const { showToast } = useToast();
  const lightbox = useLightbox();
  const userId = session?.user.id;

  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  // Vacío = sin filtrar (se ven las dos clases de publicación), que es el
  // estado inicial. Prender los dos botones da el mismo resultado que
  // apagarlos, así que no hace falta un botón "Todas" aparte.
  const [tiposActivos, setTiposActivos] = useState<ReadonlySet<TipoPublicacion>>(new Set());
  const [conversationTarget, setConversationTarget] = useState<ConversationTarget | null>(null);

  const { data: publicaciones = [], isLoading } = useQuery({
    queryKey: COMUNIDAD_PUBLICACIONES_KEY,
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

  const { misLikedIds, toggleLike } = useLikes(userId);
  const { guardadoIds, toggleGuardado } = useGuardados(userId);

  // Recientes (últimas 24hs) primero, después orden aleatorio ponderado por
  // likes — ver reglas.md ("Orden del feed"). Se recalcula solo cuando
  // cambia la lista de publicaciones, no en cada tecla del buscador.
  const ordenado = useMemo(() => ordenarFeed(publicaciones), [publicaciones]);

  // Las publicaciones propias no aparecen en el buscador de la comunidad —
  // ver reglas.md ("Buscar en la comunidad no muestra publicaciones
  // propias"). Se manejan aparte, desde "Mis publicaciones".
  const sinPropias = useMemo(() => ordenado.filter((item) => item.autor_id !== userId), [ordenado, userId]);

  const filtered = useMemo(
    () => sinPropias.filter((item) => matchesFilters(item, searchTerm, activeCategory, tiposActivos)),
    [sinPropias, searchTerm, activeCategory, tiposActivos]
  );

  // Scroll infinito estilo Instagram — ver reglas.md ("Feed infinito"). Los
  // tipos activos van en la clave de reinicio junto con el término y el
  // rubro: si no, cambiar el filtro dejaba la cantidad ya revelada de la
  // búsqueda anterior.
  const tiposKey = [...tiposActivos].sort().join(",");
  const { visibleCount, sentinelRef } = useInfiniteReveal(
    filtered.length,
    `${searchTerm}|${activeCategory}|${tiposKey}`,
    10
  );
  const visibleItems = filtered.slice(0, visibleCount);

  function toggleTipo(tipo: TipoPublicacion) {
    setTiposActivos((prev) => {
      const next = new Set(prev);
      if (next.has(tipo)) next.delete(tipo);
      else next.add(tipo);
      return next;
    });
  }

  async function handleToggleLike(id: string) {
    const errorMessage = await toggleLike(id);
    if (errorMessage) showToast(`Error: ${errorMessage}`);
  }

  async function handleToggleGuardado(id: string) {
    const errorMessage = await toggleGuardado(id);
    if (errorMessage) showToast(`Error: ${errorMessage}`);
  }

  function handleMessage(item: ComunidadPublicacionRow) {
    setConversationTarget({
      publicacionId: item.id,
      otraId: item.autor_id,
      publicacionTitulo: capitalizarOracion(item.titulo),
      otraNombre: formatNombrePublico(item.nombre, item.apellido),
    });
  }

  function handleSearch() {
    setSearchTerm(searchInput);
  }

  return (
    <div className="app-content-inner">
      <section className="app-section">
        <div className="search-panel search-panel-compact" style={{ marginBottom: 16 }}>
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
          <div className="tipo-filters" role="group" aria-label="Filtrar por tipo de publicación">
            {TIPO_FILTROS.map(({ tipo, label }) => {
              const activo = tiposActivos.has(tipo);
              return (
                <button
                  key={tipo}
                  type="button"
                  className={`tipo-filter tipo-filter-${tipo}`}
                  aria-pressed={activo}
                  onClick={() => toggleTipo(tipo)}
                >
                  <span className="tipo-filter-check" aria-hidden="true">
                    ✓
                  </span>
                  {label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid">
          {isLoading ? (
            <div className="empty-state">Cargando comunidad…</div>
          ) : sinPropias.length === 0 ? (
            <div className="empty-state">
              Todavía no hay publicaciones en la comunidad.
              <br />
              ¡Sé el primero en publicar desde "Mis publicaciones"!
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              No encontramos publicaciones para esa búsqueda todavía.
              <br />
              ¡Publicá la tuya desde "Mis publicaciones"!
            </div>
          ) : (
            visibleItems.map((item) => (
              <PublicacionCard
                key={item.id}
                item={item}
                liked={misLikedIds.has(item.id)}
                guardado={guardadoIds.has(item.id)}
                onToggleLike={(id) => void handleToggleLike(id)}
                onToggleGuardado={(id) => void handleToggleGuardado(id)}
                onMessage={handleMessage}
                onOpenFoto={(fotos) => lightbox.open(fotos, 0)}
              />
            ))
          )}
        </div>
        {visibleCount < filtered.length && <div ref={sentinelRef} style={{ height: 1 }} />}
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
