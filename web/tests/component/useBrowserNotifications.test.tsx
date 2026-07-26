import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act, render } from "@testing-library/react";
import { useBrowserNotifications } from "../../src/hooks/useBrowserNotifications";

const notificationConstructorSpy = vi.fn();

class FakeNotification {
  static permission: NotificationPermission = "default";
  static requestPermission = vi.fn(async () => FakeNotification.permission);

  constructor(title: string, options?: NotificationOptions) {
    notificationConstructorSpy(title, options);
  }
}

let latest: ReturnType<typeof useBrowserNotifications> | null = null;

function TestComponent() {
  latest = useBrowserNotifications();
  return null;
}

describe("useBrowserNotifications", () => {
  beforeEach(() => {
    notificationConstructorSpy.mockClear();
    FakeNotification.permission = "default";
    FakeNotification.requestPermission.mockClear();
    // @ts-expect-error -- stub global para el test
    global.Notification = FakeNotification;
  });

  afterEach(() => {
    // @ts-expect-error -- limpiar el stub
    delete global.Notification;
    latest = null;
  });

  it("arranca con el permiso actual del navegador", () => {
    FakeNotification.permission = "granted";
    render(<TestComponent />);
    expect(latest?.permission).toBe("granted");
    expect(latest?.supported).toBe(true);
  });

  it("notify() no hace nada si el permiso no está concedido", () => {
    FakeNotification.permission = "default";
    render(<TestComponent />);
    latest?.notify("Título", "Cuerpo");
    expect(notificationConstructorSpy).not.toHaveBeenCalled();
  });

  it("notify() crea una notificación cuando el permiso está concedido", () => {
    FakeNotification.permission = "granted";
    render(<TestComponent />);
    latest?.notify("Tenés un mensaje nuevo", "Entrá a ver");
    expect(notificationConstructorSpy).toHaveBeenCalledWith(
      "Tenés un mensaje nuevo",
      expect.objectContaining({ body: "Entrá a ver" })
    );
  });

  it("requestPermission actualiza el estado con el resultado", async () => {
    FakeNotification.permission = "default";
    FakeNotification.requestPermission.mockResolvedValue("granted");
    render(<TestComponent />);
    await act(async () => {
      await latest?.requestPermission();
    });
    expect(latest?.permission).toBe("granted");
  });
});
