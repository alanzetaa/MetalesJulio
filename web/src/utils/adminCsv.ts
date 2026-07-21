import type { AdminMensajeRow, AdminMiembroRow } from "../lib/database.types";
import { capitalizarNombre, formatFecha, formatFechaCorta } from "./format";
import { isSuspended } from "./suspension";

export interface CsvTable {
  headers: string[];
  filas: unknown[][];
}

export function buildMiembrosCsv(members: AdminMiembroRow[]): CsvTable {
  const headers = [
    "Nombre",
    "Apellido",
    "DNI",
    "Email",
    "WhatsApp",
    "Instagram",
    "Email de contacto",
    "Ubicación",
    "Registro",
    "Última conexión",
    "Estado",
    "Mensajes recibidos",
    "Contactos recibidos",
  ];
  const filas = members.map((m) => [
    capitalizarNombre(m.nombre),
    capitalizarNombre(m.apellido),
    m.dni,
    m.email,
    m.whatsapp ?? "",
    m.instagram ?? "",
    m.contacto_email ?? "",
    m.ubicacion ?? "",
    formatFechaCorta(m.created_at),
    formatFechaCorta(m.ultima_conexion),
    isSuspended(m) ? "Suspendido" : "Activo",
    Number(m.mensajes_recibidos) || 0,
    Number(m.contactos_recibidos) || 0,
  ]);
  return { headers, filas };
}

export function buildMensajesCsv(mensajes: AdminMensajeRow[]): CsvTable {
  const headers = ["Fecha", "De", "Para", "Publicación", "Mensaje"];
  const filas = mensajes.map((m) => [
    formatFecha(m.created_at),
    `${capitalizarNombre(m.remitente_nombre)} ${capitalizarNombre(m.remitente_apellido)}`,
    `${capitalizarNombre(m.destinatario_nombre)} ${capitalizarNombre(m.destinatario_apellido)}`,
    m.publicacion_titulo,
    m.cuerpo,
  ]);
  return { headers, filas };
}
