import type { MensajeDetalleRow } from "../lib/database.types";
import { formatNombrePublico } from "./format";

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
        ? formatNombrePublico(m.destinatario_nombre, m.destinatario_apellido)
        : formatNombrePublico(m.remitente_nombre, m.remitente_apellido);
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

/**
 * Mismo criterio que el buscador de "Buscar en la comunidad" (matchesFilters):
 * separa el término en palabras y exige que TODAS aparezcan, sin importar el
 * orden, sobre el nombre de la otra persona, el título de la publicación y
 * el último mensaje.
 */
export function matchesConversacionSearch(c: Conversacion, searchTerm: string): boolean {
  const term = searchTerm.trim().toLowerCase();
  if (!term) return true;
  const haystack = [c.otraNombre, c.publicacionTitulo, c.ultimoMensaje.cuerpo]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const palabras = term.split(/\s+/).filter(Boolean);
  return palabras.every((p) => haystack.indexOf(p) !== -1);
}
