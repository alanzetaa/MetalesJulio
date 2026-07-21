import { describe, expect, it } from "vitest";
import { filtrarCandidatosSuperAdmin } from "../../src/utils/adminSuperAdmins";
import type { AdminMiembroRow } from "../../src/lib/database.types";

function makeMiembro(overrides: Partial<AdminMiembroRow>): AdminMiembroRow {
  return {
    id: "1",
    nombre: "ana",
    apellido: "gómez",
    dni: "1",
    email: "ana@test.com",
    ubicacion: null,
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

describe("filtrarCandidatosSuperAdmin", () => {
  const miembros = [
    makeMiembro({ id: "1", nombre: "ana", apellido: "gómez", email: "ana@test.com" }),
    makeMiembro({ id: "2", nombre: "luis", apellido: "díaz", email: "luis@test.com" }),
  ];

  it("devuelve todos si el término está vacío", () => {
    expect(filtrarCandidatosSuperAdmin(miembros, "  ")).toHaveLength(2);
  });

  it("filtra por nombre completo capitalizado", () => {
    const result = filtrarCandidatosSuperAdmin(miembros, "Ana Gómez");
    expect(result.map((m) => m.id)).toEqual(["1"]);
  });

  it("filtra por email", () => {
    const result = filtrarCandidatosSuperAdmin(miembros, "luis@test");
    expect(result.map((m) => m.id)).toEqual(["2"]);
  });

  it("devuelve vacío si nada matchea", () => {
    expect(filtrarCandidatosSuperAdmin(miembros, "no existe")).toHaveLength(0);
  });
});
