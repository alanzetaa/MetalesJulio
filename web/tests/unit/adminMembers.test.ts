import { describe, expect, it } from "vitest";
import {
  compareAdminRows,
  matchesAdminMensajesSearch,
  matchesAdminPublicacionesSearch,
  matchesAdminSearch,
} from "../../src/utils/adminMembers";
import type { AdminMensajeRow, AdminMiembroRow, AdminPublicacionRow } from "../../src/lib/database.types";

function makeMiembro(overrides: Partial<AdminMiembroRow>): AdminMiembroRow {
  return {
    id: "1",
    nombre: "Juan",
    apellido: "Pérez",
    dni: "30123456",
    email: "juan@test.com",
    ubicacion: "CABA",
    created_at: "2026-01-01T00:00:00Z",
    ultima_conexion: null,
    suspendido_hasta: null,
    mensajes_recibidos: 0,
    contactos_recibidos: 0,
    whatsapp: null,
    instagram: null,
    contacto_email: null,
    ...overrides,
  };
}

describe("matchesAdminSearch", () => {
  it("matchea por nombre, dni, email o ubicación sin importar mayúsculas", () => {
    const m = makeMiembro({});
    expect(matchesAdminSearch(m, "juan")).toBe(true);
    expect(matchesAdminSearch(m, "30123456")).toBe(true);
    expect(matchesAdminSearch(m, "TEST.COM")).toBe(true);
    expect(matchesAdminSearch(m, "caba")).toBe(true);
    expect(matchesAdminSearch(m, "no existe")).toBe(false);
  });

  it("un término vacío matchea todo", () => {
    expect(matchesAdminSearch(makeMiembro({}), "  ")).toBe(true);
  });
});

describe("compareAdminRows", () => {
  it("ordena por nombre completo ascendente/descendente", () => {
    const a = makeMiembro({ id: "a", nombre: "ana" });
    const b = makeMiembro({ id: "b", nombre: "beto" });
    expect(compareAdminRows(a, b, "nombre", "asc")).toBeLessThan(0);
    expect(compareAdminRows(a, b, "nombre", "desc")).toBeGreaterThan(0);
  });

  it("ordena columnas de fecha tratando null como el valor más chico", () => {
    const conFecha = makeMiembro({ id: "a", ultima_conexion: "2026-01-05T00:00:00Z" });
    const sinFecha = makeMiembro({ id: "b", ultima_conexion: null });
    expect(compareAdminRows(sinFecha, conFecha, "ultima_conexion", "asc")).toBeLessThan(0);
  });

  it("ordena columnas numéricas", () => {
    const menos = makeMiembro({ id: "a", mensajes_recibidos: 1 });
    const mas = makeMiembro({ id: "b", mensajes_recibidos: 5 });
    expect(compareAdminRows(menos, mas, "mensajes_recibidos", "asc")).toBeLessThan(0);
    expect(compareAdminRows(menos, mas, "mensajes_recibidos", "desc")).toBeGreaterThan(0);
  });
});

describe("matchesAdminMensajesSearch", () => {
  const mensaje: AdminMensajeRow = {
    id: "1",
    created_at: "2026-01-01T00:00:00Z",
    publicacion_titulo: "Rejas de hierro",
    remitente_nombre: "Ana",
    remitente_apellido: "Gómez",
    destinatario_nombre: "Luis",
    destinatario_apellido: "Díaz",
    cuerpo: "Hola, me interesa tu trabajo",
  };

  it("matchea por cualquier campo de texto del mensaje", () => {
    expect(matchesAdminMensajesSearch(mensaje, "rejas")).toBe(true);
    expect(matchesAdminMensajesSearch(mensaje, "ana")).toBe(true);
    expect(matchesAdminMensajesSearch(mensaje, "interesa")).toBe(true);
    expect(matchesAdminMensajesSearch(mensaje, "no existe")).toBe(false);
  });
});

describe("matchesAdminPublicacionesSearch", () => {
  const publicacion: AdminPublicacionRow = {
    id: "1",
    created_at: "2026-01-01T00:00:00Z",
    titulo: "Rejas de hierro a medida",
    categoria: "Rejas y portones",
    tipo: "ofrezco",
    descripcion: "Trabajo con hierro forjado",
    autor_id: "u1",
    autor_nombre: "Ana",
    autor_apellido: "Gómez",
    autor_email: "ana@test.com",
  };

  it("matchea por título, descripción, rubro o datos del autor", () => {
    expect(matchesAdminPublicacionesSearch(publicacion, "rejas")).toBe(true);
    expect(matchesAdminPublicacionesSearch(publicacion, "forjado")).toBe(true);
    expect(matchesAdminPublicacionesSearch(publicacion, "portones")).toBe(true);
    expect(matchesAdminPublicacionesSearch(publicacion, "ana gómez")).toBe(true);
    expect(matchesAdminPublicacionesSearch(publicacion, "ana@test.com")).toBe(true);
    expect(matchesAdminPublicacionesSearch(publicacion, "no existe")).toBe(false);
  });

  it("un término vacío matchea todo", () => {
    expect(matchesAdminPublicacionesSearch(publicacion, "  ")).toBe(true);
  });
});
