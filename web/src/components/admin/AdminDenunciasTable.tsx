import { useState } from "react";
import type { AdminDenunciaRow } from "../../lib/database.types";
import { etiquetaMotivo } from "../../constants/denuncias";
import { formatFechaCorta, formatNombreConDni } from "../../utils/format";
import { VerTextoModal } from "./VerTextoModal";

export function AdminDenunciasTable({ denuncias }: { denuncias: AdminDenunciaRow[] }) {
  const [verTexto, setVerTexto] = useState<{ titulo: string; texto: string } | null>(null);

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <colgroup>
          <col style={{ width: "10%" }} />
          <col style={{ width: "17%" }} />
          <col style={{ width: "17%" }} />
          <col style={{ width: "14%" }} />
          <col style={{ width: "18%" }} />
          <col style={{ width: "24%" }} />
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
              const denunciante = formatNombreConDni(d.denunciante_nombre, d.denunciante_apellido, d.denunciante_dni);
              const denunciado = formatNombreConDni(d.denunciado_nombre, d.denunciado_apellido, d.denunciado_dni);
              return (
                <tr key={d.id}>
                  <td>{formatFechaCorta(d.created_at)}</td>
                  <td title={denunciante}>{denunciante}</td>
                  <td title={denunciado}>{denunciado}</td>
                  <td title={d.publicacion_titulo}>{d.publicacion_titulo}</td>
                  <td>{etiquetaMotivo(d.motivo)}</td>
                  <td
                    title={d.comentario ?? ""}
                    className={d.comentario ? "admin-table-cell-expandible" : ""}
                    onClick={() => d.comentario && setVerTexto({ titulo: "Comentario de la denuncia", texto: d.comentario })}
                  >
                    {d.comentario ?? "—"}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      <VerTextoModal info={verTexto} onClose={() => setVerTexto(null)} />
    </div>
  );
}
