import { useState } from "react";
import { Modal } from "../ui/Modal";

interface ResponderDenunciaModalProps {
  open: boolean;
  denuncianteNombre: string;
  enviando: boolean;
  onClose: () => void;
  onEnviar: (mensaje: string) => void;
}

export function ResponderDenunciaModal({
  open,
  denuncianteNombre,
  enviando,
  onClose,
  onEnviar,
}: ResponderDenunciaModalProps) {
  const [mensaje, setMensaje] = useState("");

  function handleClose() {
    setMensaje("");
    onClose();
  }

  function handleEnviar() {
    if (!mensaje.trim()) return;
    onEnviar(mensaje);
  }

  return (
    <Modal open={open} onClose={handleClose} title={`Escribirle a ${denuncianteNombre}`} maxWidth={480}>
      <p className="hint" style={{ marginTop: 0 }}>
        Se manda por mail desde soporte@comunidadmetalesjulio.com.ar, sobre la denuncia que hizo.
      </p>
      <div className="form-row">
        <div className="field">
          <label htmlFor="respuestaDenuncia">Mensaje</label>
          <textarea
            id="respuestaDenuncia"
            rows={5}
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            placeholder="Escribí acá tu respuesta sobre la denuncia..."
          />
        </div>
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-outline-dark" onClick={handleClose} disabled={enviando}>
          Cancelar
        </button>
        <button type="button" className="btn btn-dark" onClick={handleEnviar} disabled={enviando || !mensaje.trim()}>
          {enviando ? "Enviando…" : "Enviar"}
        </button>
      </div>
    </Modal>
  );
}
