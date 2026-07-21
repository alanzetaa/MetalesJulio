import { describe, expect, it } from "vitest";
import { isSuspended } from "../../src/utils/suspension";

describe("isSuspended", () => {
  it("es false si no hay fecha de suspensión", () => {
    expect(isSuspended({ suspendido_hasta: null })).toBe(false);
  });
  it("es true si la fecha está en el futuro", () => {
    expect(isSuspended({ suspendido_hasta: "2999-01-01T00:00:00Z" })).toBe(true);
  });
  it("es false si la fecha ya pasó", () => {
    expect(isSuspended({ suspendido_hasta: "2020-01-01T00:00:00Z" })).toBe(false);
  });
  it("es false para null/undefined", () => {
    expect(isSuspended(null)).toBe(false);
    expect(isSuspended(undefined)).toBe(false);
  });
});
