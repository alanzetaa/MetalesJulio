import { describe, expect, it } from "vitest";
import { nombreApellidoDesdeGoogle } from "../../src/utils/googleProfile";
import type { Session } from "@supabase/supabase-js";

function sessionConMeta(meta: Record<string, unknown>): Session {
  return { user: { user_metadata: meta } } as unknown as Session;
}

describe("nombreApellidoDesdeGoogle", () => {
  it("usa given_name/family_name si estan disponibles", () => {
    expect(nombreApellidoDesdeGoogle(sessionConMeta({ given_name: "Rafa", family_name: "Levin" }))).toEqual({
      nombre: "Rafa",
      apellido: "Levin",
    });
  });

  it("si no hay given_name/family_name, parte full_name en nombre + apellido", () => {
    expect(nombreApellidoDesdeGoogle(sessionConMeta({ full_name: "Rafa Ezequiel Levin" }))).toEqual({
      nombre: "Rafa",
      apellido: "Ezequiel Levin",
    });
  });

  it("usa name si no hay full_name", () => {
    expect(nombreApellidoDesdeGoogle(sessionConMeta({ name: "Sofia Rosemberg" }))).toEqual({
      nombre: "Sofia",
      apellido: "Rosemberg",
    });
  });

  it("devuelve vacio si no hay ningun dato de nombre", () => {
    expect(nombreApellidoDesdeGoogle(sessionConMeta({}))).toEqual({ nombre: "", apellido: "" });
  });

  it("devuelve vacio si la sesion es null", () => {
    expect(nombreApellidoDesdeGoogle(null)).toEqual({ nombre: "", apellido: "" });
  });

  it("si el nombre es una sola palabra, deja el apellido vacio", () => {
    expect(nombreApellidoDesdeGoogle(sessionConMeta({ name: "Martin" }))).toEqual({
      nombre: "Martin",
      apellido: "",
    });
  });
});
