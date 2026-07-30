import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useResena } from "../../hooks/useResena";
import { contieneInsulto } from "../../utils/moderacion";
import type { ConversationTarget } from "../../hooks/useConversationThread";

interface ReviewSectionProps {
  target: ConversationTarget;
}

interface StarPickerProps {
  label: string;
  valor: number;
  onChange: (n: number) => void;
}

function StarPicker({ label, valor, onChange }: StarPickerProps) {
  return (
    <div style={{ marginBottom: 8 }}>
      <p className="hint" style={{ margin: "0 0 2px" }}>
        {label}
      </p>
      <div style={{ display: "flex", gap: 4 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-label={`${n} estrellas — ${label}`}
            style={{
              background: "none",
              border: 0,
              fontSize: 20,
              lineHeight: 1,
              cursor: "pointer",
              padding: 0,
              color: n <= valor ? "var(--color-admin)" : "var(--color-muted)",
            }}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Dejar una reseña sobre la otra persona de la conversación — ver
 * reglas.md ("Reseñas y calificaciones (privado, HQ Metales)"). Solo tiene
 * sentido acá, después de haber intercambiado mensajes, que es justo lo
 * que exige la policy del servidor para poder insertar la fila. Pedido
 * explícito de Bruno: 3 criterios por separado en vez de un puntaje único,
 * y la reseña NUNCA se le muestra a la otra persona ni a nadie más que HQ
 * Metales — acá solo se confirma "ya calificaste", sin mostrar el detalle.
 */
export function ReviewSection({ target }: ReviewSectionProps) {
  const { session } = useAuth();
  const { showToast } = useToast();
  const userId = session?.user.id;
  const { miResena, isLoading, enviarResena } = useResena(userId, target);
  const [abierto, setAbierto] = useState(false);
  const [puntajeProducto, setPuntajeProducto] = useState(5);
  const [puntajeComunicacion, setPuntajeComunicacion] = useState(5);
  const [puntajeTiempoForma, setPuntajeTiempoForma] = useState(5);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);

  if (isLoading) return null;

  if (miResena) {
    return (
      <p className="hint" style={{ margin: "10px 0 0", borderTop: "1px solid var(--color-border)", paddingTop: 10 }}>
        Ya calificaste a esta persona. Gracias por el feedback — HQ Metales lo tiene en cuenta.
      </p>
    );
  }

  async function handleSubmit() {
    if (contieneInsulto(comentario)) {
      showToast("Ese comentario contiene lenguaje que no está permitido.");
      return;
    }
    setEnviando(true);
    const errorMessage = await enviarResena(puntajeProducto, puntajeComunicacion, puntajeTiempoForma, comentario.trim());
    setEnviando(false);
    if (errorMessage) {
      showToast(`Error al calificar: ${errorMessage}`);
      return;
    }
    showToast("¡Gracias por tu reseña!");
    setAbierto(false);
  }

  return (
    <div style={{ marginTop: 10, borderTop: "1px solid var(--color-border)", paddingTop: 10 }}>
      {!abierto ? (
        <button type="button" className="link-btn" onClick={() => setAbierto(true)}>
          ⭐ Calificar a {target.otraNombre}
        </button>
      ) : (
        <div>
          <StarPicker label="Producto/Servicio" valor={puntajeProducto} onChange={setPuntajeProducto} />
          <StarPicker label="Comunicación" valor={puntajeComunicacion} onChange={setPuntajeComunicacion} />
          <StarPicker label="Tiempo y forma" valor={puntajeTiempoForma} onChange={setPuntajeTiempoForma} />
          <textarea
            rows={2}
            placeholder="Comentario (opcional)"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            style={{ width: "100%", margin: "6px 0 8px" }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn btn-outline-dark" onClick={() => setAbierto(false)}>
              Cancelar
            </button>
            <button type="button" className="btn btn-dark" disabled={enviando} onClick={() => void handleSubmit()}>
              Enviar reseña
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
