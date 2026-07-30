import type { AdminDenunciaRow } from "../../lib/database.types";
import { etiquetaMotivo } from "../../constants/denuncias";
import { capitalizarNombre, formatFechaCorta } from "../../utils/format";

export function AdminDenunciasTable({ denuncias }: { denuncias: AdminDenunciaRow[] }) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <colgroup>
          <col style={{ width: "10%" }} />
          <col style={{ width: "15%" }} />
          <col style={{ width: "15%" }} />
          <col style={{ width: "16%" }} />
          <col style={{ width: "18%" }} />
          <col style={{ width: "26%" }} />
        </colgroup>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Denunciante</th>
            <th>Denunciado</th>
            <th>Publicación</th>
            <th>Motivo</th>
            <th>Comentario</th>
          </tr>
        </thead>
        <tbody>
          {denuncias.length === 0 ? (
            <tr>
              <td colSpan={6} className="hint" style={{ padding: 20 }}>
                No hay denuncias registradas.
              </td>
            </tr>
          ) : (
            denuncias.map((d) => {
              const denunciante = `${capitalizarNombre(d.denunciante_nombre)} ${capitalizarNombre(d.denunciante_apellido)}`;
              const denunciado = `${capitalizarNombre(d.denunciado_nombre)} ${capitalizarNombre(d.denunciado_apellido)}`;
              return (
                <tr key={d.id}>
                  <td>{formatFechaCorta(d.created_at)}</td>
                  <td title={denunciante}>{denunciante}</td>
                  <td title={denunciado}>{denunciado}</td>
                  <td title={d.publicacion_titulo}>{d.publicacion_titulo}</td>
                  <td>{etiquetaMotivo(d.motivo)}</td>
                  <td title={d.comentario ?? ""}>{d.comentario ?? "—"}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
