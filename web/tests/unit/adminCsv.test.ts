import { describe, expect, it } from "vitest";
import { buildMensajesCsv, buildMiembrosCsv } from "../../src/utils/adminCsv";
import type { AdminMensajeRow, AdminMiembroRow } from "../../src/lib/database.types";

describe("buildMiembrosCsv", () => {
  it("arma headers y filas capitalizando nombre/apellido y resolviendo el estado", () => {
    const miembro: AdminMiembroRow = {
      id: "1",
      nombre: "juan",
      apellido: "pérez",
      dni: "30123456",
      email: "juan@test.com",
      ubicacion: "CABA",
      created_at: "2026-01-01T00:00:00Z",
      ultima_conexion: null,
      suspendido_hasta: null,
      mensajes_recibidos: 3,
      contactos_recibidos: 2,
      whatsapp: "5491122334455",
      instagram: null,
      contacto_email: null,
    };
    const { headers, filas } = buildMiembrosCsv([miembro]);
    expect(headers).toContain("Contactos recibidos");
    expect(filas[0][0]).toBe("Juan");
    expect(filas[0][1]).toBe("Pérez");
    expect(filas[0][10]).toBe("Activo");
  });

  it("marca Suspendido cuando la fecha de suspensión está en el futuro", () => {
    const miembro: AdminMiembroRow = {
      id: "1",
      nombre: "juan",
      apellido: "pérez",
      dni: "30123456",
      email: "juan@test.com",
      ubicacion: null,
      created_at: "2026-01-01T00:00:00Z",
      ultima_conexion: null,
      suspendido_hasta: "2999-01-01T00:00:00Z",
      mensajes_recibidos: 0,
      contactos_recibidos: 0,
      whatsapp: null,
      instagram: null,
      contacto_email: null,
    };
    const { filas } = buildMiembrosCsv([miembro]);
    expect(filas[0][10]).toBe("Suspendido");
  });
});

describe("buildMensajesCsv", () => {
  it("arma headers y filas con nombre completo de remitente/destinatario", () => {
    const mensaje: AdminMensajeRow = {
      id: "1",
      created_at: "2026-01-01T00:00:00Z",
      publicacion_titulo: "Rejas de hierro",
      remitente_nombre: "ana",
      remitente_apellido: "gómez",
      destinatario_nombre: "luis",
      destinatario_apellido: "díaz",
      cuerpo: "Hola",
    };
    const { headers, filas } = buildMensajesCsv([mensaje]);
    expect(headers).toEqual(["Fecha", "De", "Para", "Publicación", "Mensaje"]);
    expect(filas[0][1]).toBe("Ana Gómez");
    expect(filas[0][2]).toBe("Luis Díaz");
  });
});
