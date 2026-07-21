import { useState } from "react";
import { Modal } from "../ui/Modal";

interface SuspendModalProps {
  open: boolean;
  targetName: string;
  onClose: () => void;
  onConfirm: (hastaIso: string) => void;
}

export function SuspendModal({ open, targetName, onClose, onConfirm }: SuspendModalProps) {
  const [duration, setDuration] = useState("1");

  function handleConfirm() {
    const hasta =
      duration === "permanente"
        ? new Date("2999-12-31").toISOString()
        : new Date(Date.now() + Number(duration) * 24 * 60 * 60 * 1000).toISOString();
    onConfirm(hasta);
  }

  return (
    <Modal open={open} onClose={onClose} title="Suspender miembro" maxWidth={420}>
      <p className="hint" style={{ marginTop: 0 }}>
        Vas a suspender a {targetName}.
      </p>
      <div className="form-row">
        <div className="field">
          <label htmlFor="suspendDuration">Duración</label>
          <select id="suspendDuration" value={duration} onChange={(e) => setDuration(e.target.value)}>
            <option value="1">1 día</option>
            <option value="7">7 días</option>
            <option value="30">30 días</option>
            <option value="permanente">Indefinida</option>
          </select>
        </div>
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-outline-dark" onClick={onClose}>
          Cancelar
        </button>
        <button type="button" className="btn btn-dark" onClick={handleConfirm}>
          Suspender
        </button>
      </div>
    </Modal>
  );
}
