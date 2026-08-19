import { Link } from "react-router-dom";
import type { ComunidadPublicacionRow } from "../../lib/database.types";
import { fotoUrl } from "../../lib/supabaseClient";
import { capitalizarOracion, formatNombrePublico } from "../../utils/format";
import { tipoBadgeClass, tipoCardClass, tipoLabel } from "../../utils/publicaciones";
import { BookmarkIcon } from "../ui/BookmarkIcon";

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
  const ubicacion = item.ciudad || item.provincia;
  const ubicacionSufijo = ubicacion ? ` · ${ubicacion}` : "";

  return (
    <div id={`pub-${item.id}`} className={"card " + tipoCardClass(item.tipo)}>
      <div className="card-top-row">
        <div className="badge-row">
          <span className={"badge-tipo " + tipoBadgeClass(item.tipo)}>{tipoLabel(item.tipo)}</span>
          {/* Clickear el rubro lleva al buscador filtrado por ese rubro. Va
              por la URL (?rubro=) en vez de por un callback para que funcione
              igual desde Favoritos y desde el perfil público, donde no hay
              filtros a mano — BuscarPage lo lee y limpia el parámetro. */}
          <Link to={`/buscar?rubro=${encodeURIComponent(item.categoria)}`} className="badge badge-link">
            {item.categoria}
          </Link>
        </div>
        <div className="card-top-actions">
          {onToggleGuardado && (
            <button
              type="button"
              className={"save-btn" + (guardado ? " saved" : "")}
              title={guardado ? "Quitar de guardados" : "Guardar publicación"}
              onClick={() => onToggleGuardado(item.id)}
            >
              <BookmarkIcon filled={Boolean(guardado)} />
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
      <p className="card-name">{capitalizarOracion(item.titulo)}</p>
      {fotos.length > 0 && (
        <div className="card-foto-wrap" onClick={() => onOpenFoto(fotos)}>
          <img className="card-foto" src={fotoUrl(fotos[0])} alt="" />
          {fotos.length > 1 && <span className="card-foto-count">1/{fotos.length}</span>}
        </div>
      )}
      <p className="card-desc">{capitalizarOracion(item.descripcion)}</p>
      <p className="card-loc">
        <Link to={`/perfil/${item.autor_id}`} className="link-btn">
          {formatNombrePublico(item.nombre, item.apellido)}
        </Link>
        {ubicacionSufijo}
      </p>
      <div className="card-actions">
        <button className="btn btn-dark card-actions-full" onClick={() => onMessage(item)}>
          Enviar mensaje
        </button>
      </div>
    </div>
  );
}
