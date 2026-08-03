import { useState } from "react";
import type { AdminPublicacionRow } from "../../lib/database.types";
import { formatFechaCorta, formatNombreConDni } from "../../utils/format";
import { tipoLabel } from "../../utils/publicaciones";
import { VerTextoModal } from "./VerTextoModal";

interface AdminPublicacionesTableProps {
  publicaciones: AdminPublicacionRow[];
  onEliminar: (id: string, titulo: string) => void;
}

export function AdminPublicacionesTable({ publicaciones, onEliminar }: AdminPublicacionesTableProps) {
  const [verTexto, setVerTexto] = useState<{ titulo: string; texto: string } | null>(null);

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <colgroup>
          <col style={{ width: "10%" }} />
          <col style={{ width: "19%" }} />
          <col style={{ width: "12%" }} />
          <col style={{ width: "8%" }} />
          <col style={{ width: "17%" }} />
          <col style={{ width: "22%" }} />
          <col style={{ width: "12%" }} />
        </colgroup>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Autor</th>
            <th>Rubro</th>
            <th>Tipo</th>
            <th>Título</th>
            <th>Descripción</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {publicaciones.length === 0 ? (
            <tr>
              <td colSpan={7} className="hint" style={{ padding: 20 }}>
                No se encontraron publicaciones.
              </td>
            </tr>
          ) : (
            publicaciones.map((p) => {
              const autor = formatNombreConDni(p.autor_nombre, p.autor_apellido, p.autor_dni);
              return (
                <tr key={p.id}>
                  <td>{formatFechaCorta(p.created_at)}</td>
                  <td title={`${autor} · ${p.autor_email}`}>{autor}</td>
                  <td>{p.categoria}</td>
                  <td>{tipoLabel(p.tipo)}</td>
                  <td title={p.titulo}>{p.titulo}</td>
                  <td
                    title={p.descripcion ?? ""}
                    className={p.descripcion ? "admin-table-cell-expandible" : ""}
                    onClick={() => p.descripcion && setVerTexto({ titulo: `Descripción — ${p.titulo}`, texto: p.descripcion })}
                  >
                    {p.descripcion ?? ""}
                  </td>
                  <td>
                    <button type="button" className="btn btn-danger" onClick={() => onEliminar(p.id, p.titulo)}>
                      Eliminar
                    </button>
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
