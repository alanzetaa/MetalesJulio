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

/**
 * Selector de estrellas. Arranca VACÍO (valor 0) y la persona las completa --
 * pedido explícito del dueño: antes venía con 5 estrellas puestas de fábrica,
 * lo que empujaba a dejar siempre la nota máxima sin pensarlo y no se
 * entendía que había que elegir. Ver reglas.md ("Reseñas y calificaciones").
 *
 * La estrella vacía es ☆ (contorno) y la llena ★ (sólida): cambia de FORMA,
 * no sólo de color -- mismo criterio que el ícono de favoritos, para que se
 * note el estado aunque el color pase desapercibido.
 */
function StarPicker({ label, valor, onChange }: StarPickerProps) {
  const [hover, setHover] = useState(0);
  // Al pasar el mouse se previsualiza la nota; si no, se muestra la elegida.
  const marcadas = hover || valor;

  return (
    <div style={{ marginBottom: 10 }}>
      <p className="hint" style={{ margin: "0 0 3px" }}>
        {label}
      </p>
      <div style={{ display: "flex", gap: 2, alignItems: "center" }} onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => {
          const activa = n <= marcadas;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              onMouseEnter={() => setHover(n)}
              aria-label={`${n} ${n === 1 ? "estrella" : "estrellas"} — ${label}`}
              style={{
                background: "none",
                border: 0,
                fontSize: 26,
                lineHeight: 1,
                cursor: "pointer",
                padding: "0 1px",
                color: activa ? "#FFB400" : "#c9c9c9",
                textShadow: activa ? "0 0 6px rgba(255,180,0,.55)" : "none",
                transition: "color .12s ease, transform .12s ease",
                transform: hover === n ? "scale(1.18)" : "none",
              }}
            >
              {activa ? "★" : "☆"}
            </button>
          );
        })}
        <span className="hint" style={{ marginLeft: 6 }}>
          {valor > 0 ? `${valor}/5` : "Sin calificar"}
        </span>
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
  // Arrancan en 0 = sin calificar (ver StarPicker). La base exige 1 a 5, así
  // que hay que completar los 3 antes de poder enviar.
  const [puntajeProducto, setPuntajeProducto] = useState(0);
  const [puntajeComunicacion, setPuntajeComunicacion] = useState(0);
  const [puntajeTiempoForma, setPuntajeTiempoForma] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const completa = puntajeProducto > 0 && puntajeComunicacion > 0 && puntajeTiempoForma > 0;

  if (isLoading) return null;

  if (miResena) {
    return (
      <p className="hint" style={{ margin: "10px 0 0", borderTop: "1px solid var(--color-border)", paddingTop: 10 }}>
        Ya calificaste a esta persona. Gracias por el feedback — HQ Metales lo tiene en cuenta.
      </p>
    );
  }

  async function handleSubmit() {
    if (!completa) {
      showToast("Calificá los 3 puntos antes de enviar la reseña.");
      return;
    }
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
            <button
              type="button"
              className="btn btn-dark"
              disabled={enviando || !completa}
              title={completa ? undefined : "Calificá los 3 puntos para poder enviar"}
              onClick={() => void handleSubmit()}
            >
              Enviar reseña
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
