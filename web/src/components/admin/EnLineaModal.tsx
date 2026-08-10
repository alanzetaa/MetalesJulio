import type { AdminMiembroRow } from "../../lib/database.types";
import { capitalizarNombre } from "../../utils/format";
import { Modal } from "../ui/Modal";

interface EnLineaModalProps {
  open: boolean;
  miembros: AdminMiembroRow[];
  onClose: () => void;
}

export function EnLineaModal({ open, miembros, onClose }: EnLineaModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="En línea ahora" maxWidth={420}>
      {miembros.length === 0 ? (
        <p className="hint" style={{ margin: 0 }}>
          Nadie está en línea en este momento.
        </p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
          {miembros.map((m) => (
            <li key={m.id}>
              <strong style={{ display: "block" }}>
                {capitalizarNombre(m.nombre)} {capitalizarNombre(m.apellido)}
              </strong>
              <span className="hint" style={{ margin: 0 }}>
                {m.email}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
