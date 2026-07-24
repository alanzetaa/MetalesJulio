import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { PerfilPage } from "../../src/pages/PerfilPage";
import { ToastProvider } from "../../src/context/ToastContext";
import { useAuth } from "../../src/context/AuthContext";
import { supabase } from "../../src/lib/supabaseClient";
import { TERMINOS_VERSION_ACTUAL } from "../../src/constants/terminos";
import type { ProfileRow } from "../../src/lib/database.types";

vi.mock("../../src/context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../src/lib/supabaseClient", () => ({
  supabase: { from: vi.fn() },
}));

const baseProfile: ProfileRow = {
  id: "user-1",
  nombre: "ana",
  apellido: "gomez",
  dni: "30123456",
  cuit: null,
  email: "ana@test.com",
  ubicacion: null,
  provincia: null,
  descripcion: null,
  whatsapp: null,
  instagram: null,
  contacto_email: null,
  suspendido_hasta: null,
  notificar_mensajes: true,
  terminos_version_aceptada: TERMINOS_VERSION_ACTUAL,
  terminos_aceptados_at: "2026-01-01T12:00:00Z",
  ultima_actividad: null,
  created_at: "2026-01-01T00:00:00Z",
};

function mockAuth(profile: ProfileRow | null) {
  vi.mocked(useAuth).mockReturnValue({
    session: { user: { id: "user-1", email: "ana@test.com" } },
    loadingSession: false,
    profile,
    loadingProfile: false,
    isSuperAdmin: false,
    enRecuperacion: false,
    setEnRecuperacion: vi.fn(),
    refetchProfile: vi.fn().mockResolvedValue(undefined),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
}

function renderPage() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <PerfilPage />
      </ToastProvider>
    </MemoryRouter>
  );
}

describe("PerfilPage — Términos y Condiciones", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("una vez aceptada la versión actual, la casilla queda tildada y bloqueada con la fecha", () => {
    mockAuth(baseProfile);
    renderPage();
    const checkbox = screen.getByRole("checkbox", { name: /aceptaste los términos/i });
    expect(checkbox).toBeChecked();
    expect(checkbox).toBeDisabled();
  });

  it("sigue mandando terminos_version_aceptada al guardar, aunque la casilla ya esté bloqueada (no registrada en el form)", async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.from).mockReturnValue({ upsert: upsertMock } as unknown as ReturnType<typeof supabase.from>);
    mockAuth(baseProfile);
    renderPage();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Guardar perfil" }));

    await waitFor(() => {
      expect(upsertMock).toHaveBeenCalledWith(
        expect.objectContaining({ terminos_version_aceptada: TERMINOS_VERSION_ACTUAL })
      );
    });
  });

  it("si todavía no aceptó, la casilla está habilitada y sin tildar", () => {
    mockAuth({ ...baseProfile, terminos_version_aceptada: 0, terminos_aceptados_at: null });
    renderPage();
    const checkbox = screen.getByRole("checkbox", { name: /acepto los términos/i });
    expect(checkbox).not.toBeChecked();
    expect(checkbox).not.toBeDisabled();
  });
});
