import type { MensajeDetalleRow } from "../lib/database.types";
import { capitalizarNombre } from "./format";

export interface Conversacion {
  publicacionId: string;
  publicacionTitulo: string;
  otraId: string;
  otraNombre: string;
  ultimoMensaje: MensajeDetalleRow;
  noLeidos: number;
}

/**
 * No existe una tabla de "conversaciones": un hilo es simplemente el
 * conjunto de filas de mensajes con el mismo publicacion_id y las mismas
 * dos personas — se agrupa acá, en el cliente.
 */
export function agruparConversaciones(rows: MensajeDetalleRow[], miUserId: string): Conversacion[] {
  const grupos: Record<string, Conversacion> = {};

  rows.forEach((m) => {
    const otraId = m.remitente_id === miUserId ? m.destinatario_id : m.remitente_id;
    const otraNombre =
      m.remitente_id === miUserId
        ? `${capitalizarNombre(m.destinatario_nombre)} ${capitalizarNombre(m.destinatario_apellido)}`
        : `${capitalizarNombre(m.remitente_nombre)} ${capitalizarNombre(m.remitente_apellido)}`;
    const key = `${m.publicacion_id}|${otraId}`;

    if (!grupos[key]) {
      grupos[key] = {
        publicacionId: m.publicacion_id,
        publicacionTitulo: m.publicacion_titulo,
        otraId,
        otraNombre,
        ultimoMensaje: m,
        noLeidos: 0,
      };
    }

    const grupo = grupos[key];
    if (new Date(m.created_at) > new Date(grupo.ultimoMensaje.created_at)) {
      grupo.ultimoMensaje = m;
    }

    if (m.destinatario_id === miUserId && !m.leido_at) {
      grupo.noLeidos += 1;
    }
  });

  return Object.values(grupos).sort(
    (a, b) => new Date(b.ultimoMensaje.created_at).getTime() - new Date(a.ultimoMensaje.created_at).getTime()
  );
}
