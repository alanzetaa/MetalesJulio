import { describe, expect, it } from "vitest";
import { avatarColor } from "../../src/utils/avatarColor";

describe("avatarColor", () => {
  it("devuelve siempre el mismo color para el mismo nombre", () => {
    expect(avatarColor("Fede R.")).toBe(avatarColor("Fede R."));
  });

  it("devuelve un color hexadecimal válido", () => {
    expect(avatarColor("Martin Y.")).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("suele diferenciar nombres distintos", () => {
    expect(avatarColor("Fede R.")).not.toBe(avatarColor("Gustavo R."));
  });
});
