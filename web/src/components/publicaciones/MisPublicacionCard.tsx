import type { PublicacionRow } from "../../lib/database.types";
import { fotoUrl } from "../../lib/supabaseClient";
import { MAX_FOTOS, tipoBadgeClass, tipoCardClass, tipoLabel } from "../../utils/publicaciones";

export type MisPublicacionItem = PublicacionRow & { likes_count: number };

interface MisPublicacionCardProps {
  item: MisPublicacionItem;
  onDelete: (id: string) => void;
  onAgregarFoto: (id: string) => void;
  onQuitarFoto: (id: string, index: number) => void;
  onOpenFoto: (fotoPaths: string[], index: number) => void;
}

export function MisPublicacionCard({
  item,
  onDelete,
  onAgregarFoto,
  onQuitarFoto,
  onOpenFoto,
}: MisPublicacionCardProps) {
  const fotos = item.foto_paths ?? [];

  return (
    <div className={"card " + tipoCardClass(item.tipo)}>
      <div className="card-top-row">
        <div className="badge-row">
          <span className={"badge-tipo " + tipoBadgeClass(item.tipo)}>{tipoLabel(item.tipo)}</span>
          <span className="badge">{item.categoria}</span>
        </div>
        <span className="like-btn">
          <span className="heart">♥</span>
          {item.likes_count}
        </span>
      </div>
      <p className="card-name">{item.titulo}</p>
      <p className="card-desc">{item.descripcion ?? ""}</p>
      <div className="mis-pub-fotos-row">
        {fotos.map((path, i) => (
          <div className="mis-pub-foto-thumb" key={path}>
            <img src={fotoUrl(path)} alt="" onClick={() => onOpenFoto(fotos, i)} />
            <button
              type="button"
              className="mis-pub-foto-quitar"
              title="Quitar esta foto"
              onClick={() => onQuitarFoto(item.id, i)}
            >
              ×
            </button>
          </div>
        ))}
        {fotos.length < MAX_FOTOS && (
          <button
            type="button"
            className="mis-pub-foto-add"
            title="Agregar foto"
            onClick={() => onAgregarFoto(item.id)}
          >
            +
          </button>
        )}
      </div>
      <div className="card-actions">
        <button className="btn btn-outline-dark" onClick={() => onDelete(item.id)}>
          Eliminar
        </button>
      </div>
    </div>
  );
}
