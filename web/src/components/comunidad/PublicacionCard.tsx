import { Link } from "react-router-dom";
import type { ComunidadPublicacionRow } from "../../lib/database.types";
import { fotoUrl } from "../../lib/supabaseClient";
import { capitalizarNombre } from "../../utils/format";
import { tipoBadgeClass, tipoCardClass, tipoLabel } from "../../utils/publicaciones";

interface PublicacionCardProps {
  item: ComunidadPublicacionRow;
  liked: boolean;
  guardado?: boolean;
  onToggleLike: (id: string) => void;
  onToggleGuardado?: (id: string) => void;
  onMessage: (item: ComunidadPublicacionRow) => void;
  onOpenFoto: (fotoPaths: string[]) => void;
}

export function PublicacionCard({
  item,
  liked,
  guardado,
  onToggleLike,
  onToggleGuardado,
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
        <div className="card-top-actions">
          {onToggleGuardado && (
            <button
              type="button"
              className={"save-btn" + (guardado ? " saved" : "")}
              title={guardado ? "Quitar de guardados" : "Guardar publicación"}
              onClick={() => onToggleGuardado(item.id)}
            >
              🔖
            </button>
          )}
          <button
            type="button"
            className={"like-btn" + (liked ? " liked" : "")}
            onClick={() => onToggleLike(item.id)}
          >
            <span className="heart">{liked ? "♥" : "♡"}</span>
            {Number(item.likes_count) || 0}
          </button>
        </div>
      </div>
      {fotos.length > 0 && (
        <div className="card-foto-wrap" onClick={() => onOpenFoto(fotos)}>
          <img className="card-foto" src={fotoUrl(fotos[0])} alt="" />
          {fotos.length > 1 && <span className="card-foto-count">1/{fotos.length}</span>}
        </div>
      )}
      <p className="card-name">{item.titulo}</p>
      <p className="card-loc">
        <Link to={`/perfil/${item.autor_id}`} className="link-btn">
          {capitalizarNombre(item.nombre)} {capitalizarNombre(item.apellido)}
        </Link>
        {ubicacionSufijo}
      </p>
      <p className="card-desc">{item.descripcion ?? ""}</p>
      <div className="card-actions">
        <button className="btn btn-dark card-actions-full" onClick={() => onMessage(item)}>
          Enviar mensaje
        </button>
      </div>
    </div>
  );
}
