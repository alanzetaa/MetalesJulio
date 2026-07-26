import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5999",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5999",
    // Reusar localmente (más rápido al iterar), pero siempre arrancar de
    // cero en CI -- reusar un server viejo/de otro proyecto en el mismo
    // puerto ya causó tests corriendo contra la app equivocada.
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
