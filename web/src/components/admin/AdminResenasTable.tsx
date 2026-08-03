import { useState } from "react";
import type { AdminResenaRow } from "../../lib/database.types";
import { capitalizarOracion, formatFechaCorta, formatNombreConDni } from "../../utils/format";
import { VerTextoModal } from "./VerTextoModal";

function promedio(r: AdminResenaRow): string {
  return (
    (r.puntaje_producto + r.puntaje_comunicacion + r.puntaje_tiempo_forma) /
    3
  ).toFixed(1);
}

export function AdminResenasTable({ resenas }: { resenas: AdminResenaRow[] }) {
  const [verTexto, setVerTexto] = useState<{ titulo: string; texto: string } | null>(null);

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <colgroup>
          <col style={{ width: "8%" }} />
          <col style={{ width: "15%" }} />
          <col style={{ width: "15%" }} />
          <col style={{ width: "14%" }} />
          <col style={{ width: "9%" }} />
          <col style={{ width: "9%" }} />
          <col style={{ width: "9%" }} />
          <col style={{ width: "8%" }} />
          <col style={{ width: "13%" }} />
        </colgroup>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>De</th>
            <th>Sobre</th>
            <th>Publicación</th>
            <th>Producto</th>
            <th>Comunicación</th>
            <th>Tiempo y forma</th>
            <th>Final</th>
            <th>Comentario</th>
          </tr>
        </thead>
        <tbody>
          {resenas.length === 0 ? (
            <tr>
              <td colSpan={9} className="hint" style={{ padding: 20 }}>
                Todavía no hay reseñas en la comunidad.
              </td>
            </tr>
          ) : (
            resenas.map((r) => {
              const de = formatNombreConDni(r.autor_nombre, r.autor_apellido, r.autor_dni);
              const sobre = formatNombreConDni(r.destinatario_nombre, r.destinatario_apellido, r.destinatario_dni);
              return (
                <tr key={r.id}>
                  <td>{formatFechaCorta(r.created_at)}</td>
                  <td title={de}>{de}</td>
                  <td title={sobre}>{sobre}</td>
                  <td title={capitalizarOracion(r.publicacion_titulo)}>{capitalizarOracion(r.publicacion_titulo)}</td>
                  <td>{"⭐".repeat(r.puntaje_producto)}</td>
                  <td>{"⭐".repeat(r.puntaje_comunicacion)}</td>
                  <td>{"⭐".repeat(r.puntaje_tiempo_forma)}</td>
                  <td>{promedio(r)}</td>
                  <td
                    title={r.comentario ?? ""}
                    className={r.comentario ? "admin-table-cell-expandible" : ""}
                    onClick={() => r.comentario && setVerTexto({ titulo: "Comentario de la reseña", texto: r.comentario })}
                  >
                    {r.comentario ?? "—"}
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
