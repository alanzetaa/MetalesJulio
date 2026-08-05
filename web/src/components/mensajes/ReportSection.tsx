import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useDenuncia } from "../../hooks/useDenuncia";
import { MOTIVOS_DENUNCIA, type MotivoDenuncia } from "../../constants/denuncias";
import { contieneInsulto } from "../../utils/moderacion";
import type { ConversationTarget } from "../../hooks/useConversationThread";

interface ReportSectionProps {
  target: ConversationTarget;
}

/**
 * Denunciar a la otra persona de la conversación — ver reglas.md
 * ("Denuncias"). Solo tiene sentido acá, después de haber intercambiado
 * mensajes (es lo que exige la policy). Avisa por mail a todos los súper admins
 * (Edge Function notificar-denuncia) y solo ellos pueden verla (HQ
 * Metales) -- ni la persona denunciada se entera de que la denunciaron.
 */
export function ReportSection({ target }: ReportSectionProps) {
  const { session } = useAuth();
  const { showToast } = useToast();
  const userId = session?.user.id;
  const { yaDenuncie, enviarDenuncia } = useDenuncia(userId, target);
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState<MotivoDenuncia>(MOTIVOS_DENUNCIA[0].value);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);

  if (yaDenuncie) {
    return (
      <p className="hint" style={{ margin: "10px 0 0" }}>
        Ya denunciaste a esta persona por esta conversación. HQ Metales lo va a revisar.
      </p>
    );
  }

  async function handleSubmit() {
    if (contieneInsulto(comentario)) {
      showToast("Ese comentario contiene lenguaje que no está permitido.");
      return;
    }
    setEnviando(true);
    const errorMessage = await enviarDenuncia(motivo, comentario.trim());
    setEnviando(false);
    if (errorMessage) {
      showToast(`Error al denunciar: ${errorMessage}`);
      return;
    }
    showToast("Denuncia enviada. Gracias por avisarnos.");
    setAbierto(false);
  }

  return (
    <div style={{ marginTop: 10 }}>
      {!abierto ? (
        <button type="button" className="link-btn" style={{ color: "#dc2626" }} onClick={() => setAbierto(true)}>
          🚩 Denunciar a {target.otraNombre}
        </button>
      ) : (
        <div>
          <p className="hint" style={{ margin: "0 0 4px" }}>
            ¿Por qué la denunciás?
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
            {MOTIVOS_DENUNCIA.map((m) => (
              <label key={m.value} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14 }}>
                <input
                  type="radio"
                  name="motivoDenuncia"
                  value={m.value}
                  checked={motivo === m.value}
                  onChange={() => setMotivo(m.value)}
                />
                {m.label}
              </label>
            ))}
          </div>
          <textarea
            rows={2}
            placeholder="Contanos más (opcional)"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            style={{ width: "100%", marginBottom: 8 }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn btn-outline-dark" onClick={() => setAbierto(false)}>
              Cancelar
            </button>
            <button type="button" className="btn btn-danger" disabled={enviando} onClick={() => void handleSubmit()}>
              Enviar denuncia
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
