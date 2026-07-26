import { describe, expect, it } from "vitest";
import { calcularDimensionesRedimensionadas } from "../../src/utils/imageCompression";

describe("calcularDimensionesRedimensionadas", () => {
  it("no agranda una imagen más chica que el máximo", () => {
    expect(calcularDimensionesRedimensionadas(800, 600, 1600, 1600)).toEqual({ ancho: 800, alto: 600 });
  });

  it("achica manteniendo la proporción cuando el ancho excede el máximo", () => {
    expect(calcularDimensionesRedimensionadas(3200, 2400, 1600, 1600)).toEqual({ ancho: 1600, alto: 1200 });
  });

  it("achica según el lado más restrictivo en una foto vertical", () => {
    // 1200x3600 -> el alto manda (3600 > 1200), escala = 1600/3600
    expect(calcularDimensionesRedimensionadas(1200, 3600, 1600, 1600)).toEqual({ ancho: 533, alto: 1600 });
  });

  it("deja igual una imagen exactamente del tamaño máximo", () => {
    expect(calcularDimensionesRedimensionadas(1600, 1600, 1600, 1600)).toEqual({ ancho: 1600, alto: 1600 });
  });
});
