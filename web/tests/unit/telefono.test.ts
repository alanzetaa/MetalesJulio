import { describe, expect, it } from "vitest";
import { armarNumeroCompleto, separarNumeroGuardado } from "../../src/utils/telefono";

describe("armarNumeroCompleto", () => {
  it("Argentina suma el 9 despues del codigo de pais", () => {
    expect(armarNumeroCompleto("AR", "11 2233-4455")).toBe("5491122334455");
  });

  it("otro pais no suma el 9", () => {
    expect(armarNumeroCompleto("UY", "99 123 456")).toBe("59899123456");
  });

  it("devuelve vacio si el numero local no tiene digitos", () => {
    expect(armarNumeroCompleto("AR", "")).toBe("");
  });
});

describe("separarNumeroGuardado", () => {
  it("separa un numero argentino guardado (con el 9)", () => {
    expect(separarNumeroGuardado("5491122334455")).toEqual({ paisCode: "AR", numeroLocal: "1122334455" });
  });

  it("separa un numero de otro pais (Uruguay)", () => {
    expect(separarNumeroGuardado("59899123456")).toEqual({ paisCode: "UY", numeroLocal: "99123456" });
  });

  it("un numero viejo sin codigo reconocible queda como local bajo Argentina", () => {
    expect(separarNumeroGuardado("1122334455")).toEqual({ paisCode: "AR", numeroLocal: "1122334455" });
  });

  it("null o vacio devuelve Argentina con numero vacio", () => {
    expect(separarNumeroGuardado(null)).toEqual({ paisCode: "AR", numeroLocal: "" });
    expect(separarNumeroGuardado("")).toEqual({ paisCode: "AR", numeroLocal: "" });
  });

  it("es el inverso de armarNumeroCompleto", () => {
    const completo = armarNumeroCompleto("CL", "9 1234 5678");
    expect(separarNumeroGuardado(completo)).toEqual({ paisCode: "CL", numeroLocal: "912345678" });
  });
});
