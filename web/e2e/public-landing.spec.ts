import { test, expect } from "@playwright/test";

test.describe("Página pública", () => {
  test("no muestra ningún error de consola al cargar", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/");
    await expect(page.getByRole("heading", { name: /artesanos y oficios del metal/i })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("abre el modal de login al clickear Ingresar", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Ingresar" }).click();
    await expect(page.getByRole("heading", { name: "Ingresar" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Contraseña")).toBeVisible();
  });

  test("abre el modal de registro al clickear Registrarme", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Registrarme" }).click();
    await expect(page.getByRole("heading", { name: "Crear mi cuenta" })).toBeVisible();
  });

  test("desde login se puede ir a 'olvidé mi contraseña'", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Ingresar" }).click();
    await page.getByRole("button", { name: "¿Olvidaste tu contraseña?" }).click();
    await expect(page.getByRole("heading", { name: "Recuperar contraseña" })).toBeVisible();
  });

  test("valida el formulario de login antes de enviarlo", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Ingresar" }).click();
    await page.getByRole("button", { name: "Ingresar", exact: true }).last().click();
    await expect(page.getByText("Ingresá un email válido")).toBeVisible();
  });
});
