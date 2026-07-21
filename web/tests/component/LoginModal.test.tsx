import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginModal } from "../../src/components/auth/LoginModal";
import { ToastProvider } from "../../src/context/ToastContext";
import { supabase } from "../../src/lib/supabaseClient";

vi.mock("../../src/lib/supabaseClient", () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
      signInWithOAuth: vi.fn(),
    },
  },
}));

function renderLogin() {
  return render(
    <ToastProvider>
      <LoginModal open onClose={vi.fn()} onForgotPassword={vi.fn()} />
    </ToastProvider>
  );
}

describe("LoginModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra errores de validación si se envía vacío, sin llamar a Supabase", async () => {
    renderLogin();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Ingresar" }));

    expect(await screen.findByText("Ingresá un email válido")).toBeInTheDocument();
    expect(await screen.findByText("Ingresá tu contraseña")).toBeInTheDocument();
    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it("llama a signInWithPassword con los valores del formulario cuando es válido", async () => {
    renderLogin();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Email"), "ana@test.com");
    await user.type(screen.getByLabelText("Contraseña"), "secret123");
    await user.click(screen.getByRole("button", { name: "Ingresar" }));

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "ana@test.com",
        password: "secret123",
      });
    });
  });

  it("no renderiza nada cuando open es false", () => {
    render(
      <ToastProvider>
        <LoginModal open={false} onClose={vi.fn()} onForgotPassword={vi.fn()} />
      </ToastProvider>
    );
    expect(screen.queryByRole("button", { name: "Ingresar" })).not.toBeInTheDocument();
  });
});
