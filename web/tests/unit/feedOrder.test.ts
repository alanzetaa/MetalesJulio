import { describe, expect, it } from "vitest";
import { esReciente, hashDeterministico, ordenarFeed, scorePonderado } from "../../src/utils/feedOrder";

describe("esReciente", () => {
  const ahora = new Date("2026-07-22T12:00:00Z");

  it("es true para algo publicado hace 1 hora", () => {
    expect(esReciente("2026-07-22T11:00:00Z", ahora)).toBe(true);
  });

  it("es false para algo publicado hace 25 horas", () => {
    expect(esReciente("2026-07-21T11:00:00Z", ahora)).toBe(false);
  });

  it("es true justo en el límite de 24hs menos un segundo", () => {
    expect(esReciente("2026-07-21T12:00:01Z", ahora)).toBe(true);
  });
});

describe("hashDeterministico", () => {
  it("da el mismo número para el mismo texto siempre", () => {
    const a = hashDeterministico("2026-07-22|abc");
    const b = hashDeterministico("2026-07-22|abc");
    expect(a).toBe(b);
  });

  it("da un número distinto para textos distintos (en general)", () => {
    const a = hashDeterministico("2026-07-22|abc");
    const b = hashDeterministico("2026-07-22|xyz");
    expect(a).not.toBe(b);
  });

  it("siempre devuelve un valor en [0, 1)", () => {
    for (const texto of ["a", "b", "2026-07-22|foo", ""]) {
      const v = hashDeterministico(texto);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("cambia de un día a otro para el mismo id", () => {
    const dia1 = hashDeterministico("2026-07-22|mismo-id");
    const dia2 = hashDeterministico("2026-07-23|mismo-id");
    expect(dia1).not.toBe(dia2);
  });
});

describe("scorePonderado", () => {
  const ahora = new Date("2026-07-22T12:00:00Z");

  it("es estable para el mismo id, likes y día", () => {
    const a = scorePonderado("pub-1", 5, ahora);
    const b = scorePonderado("pub-1", 5, ahora);
    expect(a).toBe(b);
  });

  it("con más likes el score nunca puede ser menor (mismo id, mismo día)", () => {
    const conPocosLikes = scorePonderado("pub-1", 0, ahora);
    const conMuchosLikes = scorePonderado("pub-1", 20, ahora);
    expect(conMuchosLikes).toBeGreaterThan(conPocosLikes);
  });
});

describe("ordenarFeed", () => {
  const ahora = new Date("2026-07-22T12:00:00Z");

  it("pone las publicaciones de las últimas 24hs primero, ordenadas por fecha descendente", () => {
    const items = [
      { id: "vieja-1", created_at: "2026-07-10T00:00:00Z", likes_count: 100 },
      { id: "reciente-vieja", created_at: "2026-07-22T01:00:00Z", likes_count: 0 },
      { id: "reciente-nueva", created_at: "2026-07-22T11:00:00Z", likes_count: 0 },
    ];
    const resultado = ordenarFeed(items, ahora);
    expect(resultado.map((i) => i.id)).toEqual(["reciente-nueva", "reciente-vieja", "vieja-1"]);
  });

  it("el orden de las no-recientes es estable si se llama de nuevo con la misma fecha", () => {
    const items = [
      { id: "a", created_at: "2026-07-01T00:00:00Z", likes_count: 3 },
      { id: "b", created_at: "2026-07-02T00:00:00Z", likes_count: 1 },
      { id: "c", created_at: "2026-07-03T00:00:00Z", likes_count: 8 },
    ];
    const primeraVez = ordenarFeed(items, ahora).map((i) => i.id);
    const segundaVez = ordenarFeed(items, ahora).map((i) => i.id);
    expect(segundaVez).toEqual(primeraVez);
  });

  it("no pierde ni duplica publicaciones", () => {
    const items = [
      { id: "a", created_at: "2026-07-01T00:00:00Z", likes_count: 3 },
      { id: "b", created_at: "2026-07-22T11:00:00Z", likes_count: 1 },
      { id: "c", created_at: "2026-06-01T00:00:00Z", likes_count: 8 },
    ];
    const resultado = ordenarFeed(items, ahora);
    expect(resultado).toHaveLength(3);
    expect(new Set(resultado.map((i) => i.id))).toEqual(new Set(["a", "b", "c"]));
  });
});
