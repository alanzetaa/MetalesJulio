/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Puerto fijo y bien alejado del 5173 por default de Vite -- esta máquina
  // suele tener otros proyectos corriendo en paralelo (cada uno sin
  // strictPort, así que van saltando de a uno: 5173, 5174, 5175...) y si
  // Playwright encuentra algo ya escuchando en el puerto que le pedimos, lo
  // REUSA en vez de levantar el nuestro (reuseExistingServer en
  // playwright.config.ts) -- eso hizo que los tests e2e corrieran contra la
  // app de otro proyecto sin ningún error visible. 5999 está bien lejos de
  // ese rango para no chocar. `strictPort` hace que, si igual llegara a
  // chocar, falle fuerte en vez de saltar de puerto en silencio.
  server: { port: 5999, strictPort: true },
  preview: { port: 5999, strictPort: true },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/unit/**/*.test.ts", "tests/component/**/*.test.tsx"],
    coverage: {
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
    },
  },
});
