import type { ComunidadPublicacionRow } from "../../lib/database.types";
import { fotoUrl } from "../../lib/supabaseClient";
import { capitalizarNombre } from "../../utils/format";
import { tipoBadgeClass, tipoCardClass, tipoLabel } from "../../utils/publicaciones";

interface PublicacionCardProps {
  item: ComunidadPublicacionRow;
  liked: boolean;
  isOwn: boolean;
  onToggleLike: (id: string) => void;
  onContact: (item: ComunidadPublicacionRow) => void;
  onMessage: (item: ComunidadPublicacionRow) => void;
  onOpenFoto: (fotoPaths: string[]) => void;
}

export function PublicacionCard({
  item,
  liked,
  isOwn,
  onToggleLike,
  onContact,
  onMessage,
  onOpenFoto,
}: PublicacionCardProps) {
  const fotos = item.foto_paths ?? [];
  const ubicacionSufijo = item.provincia ? ` · ${item.provincia}` : "";

  return (
    <div className={"card " + tipoCardClass(item.tipo)}>
      <div className="card-top-row">
        <div className="badge-row">
          <span className={"badge-tipo " + tipoBadgeClass(item.tipo)}>{tipoLabel(item.tipo)}</span>
          <span className="badge">{item.categoria}</span>
        </div>
        <button
          type="button"
          className={"like-btn" + (liked ? " liked" : "")}
          onClick={() => onToggleLike(item.id)}
        >
          <span className="heart">{liked ? "♥" : "♡"}</span>
          {Number(item.likes_count) || 0}
        </button>
      </div>
      {fotos.length > 0 && (
        <div className="card-foto-wrap" onClick={() => onOpenFoto(fotos)}>
          <img className="card-foto" src={fotoUrl(fotos[0])} alt="" />
          {fotos.length > 1 && <span className="card-foto-count">1/{fotos.length}</span>}
        </div>
      )}
      <p className="card-name">{item.titulo}</p>
      <p className="card-loc">
        {capitalizarNombre(item.nombre)} {capitalizarNombre(item.apellido)}
        {ubicacionSufijo}
      </p>
      <p className="card-desc">{item.descripcion ?? ""}</p>
      <div className="card-actions">
        {isOwn ? (
          <span className="hint" style={{ margin: 0 }}>
            Esta es tu publicación
          </span>
        ) : (
          <>
            <button className="btn btn-dark" onClick={() => onContact(item)}>
              Contactar
            </button>
            <button className="btn btn-outline-dark" onClick={() => onMessage(item)}>
              Mensaje
            </button>
          </>
        )}
      </div>
    </div>
  );
}
