import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Sidebar } from "../../src/components/layout/Sidebar";
import { useAuth } from "../../src/context/AuthContext";

vi.mock("../../src/context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

function renderSidebar(unreadCount: number) {
  return render(
    <MemoryRouter>
      <Sidebar unreadCount={unreadCount} />
    </MemoryRouter>
  );
}

describe("Sidebar", () => {
  it("no muestra los links de HQ Metales ni Seguridad si no es súper admin", () => {
    vi.mocked(useAuth).mockReturnValue({ isSuperAdmin: false } as ReturnType<typeof useAuth>);
    renderSidebar(0);
    expect(screen.queryByText("HQ Metales")).not.toBeInTheDocument();
    expect(screen.queryByText("Seguridad")).not.toBeInTheDocument();
  });

  it("muestra los links de HQ Metales y Seguridad si es súper admin", () => {
    vi.mocked(useAuth).mockReturnValue({ isSuperAdmin: true } as ReturnType<typeof useAuth>);
    renderSidebar(0);
    expect(screen.getByText("HQ Metales")).toBeInTheDocument();
    expect(screen.getByText("Seguridad")).toBeInTheDocument();
  });

  it("muestra el badge de no-leídos solo si hay mensajes sin leer", () => {
    vi.mocked(useAuth).mockReturnValue({ isSuperAdmin: false } as ReturnType<typeof useAuth>);
    const { rerender } = renderSidebar(0);
    expect(screen.queryByText("3")).not.toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <Sidebar unreadCount={3} />
      </MemoryRouter>
    );
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
