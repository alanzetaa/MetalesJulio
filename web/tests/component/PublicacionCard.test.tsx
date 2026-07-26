import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactElement } from "react";
import { PublicacionCard } from "../../src/components/comunidad/PublicacionCard";
import type { ComunidadPublicacionRow } from "../../src/lib/database.types";

vi.mock("../../src/lib/supabaseClient", () => ({
  fotoUrl: (path: string) => `https://cdn.test/${path}`,
}));

function makeItem(overrides: Partial<ComunidadPublicacionRow>): ComunidadPublicacionRow {
  return {
    id: "1",
    titulo: "Rejas de hierro",
    categoria: "Rejas y portones",
    descripcion: "A medida",
    tipo: "ofrezco",
    created_at: "2026-01-01T00:00:00Z",
    autor_id: "autor-1",
    nombre: "ana",
    apellido: "gómez",
    provincia: "CABA",
    whatsapp: null,
    instagram: null,
    contacto_email: null,
    foto_paths: [],
    likes_count: 2,
    ...overrides,
  };
}

function renderWithRouter(ui: ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("PublicacionCard", () => {
  it("muestra el botón de mensaje", () => {
    renderWithRouter(
      <PublicacionCard item={makeItem({})} liked={false} onToggleLike={vi.fn()} onMessage={vi.fn()} onOpenFoto={vi.fn()} />
    );
    expect(screen.getByText("Enviar mensaje")).toBeInTheDocument();
  });

  it("llama a onMessage con la publicación al clickear el botón de mensaje", () => {
    const onMessage = vi.fn();
    const item = makeItem({});
    renderWithRouter(
      <PublicacionCard item={item} liked={false} onToggleLike={vi.fn()} onMessage={onMessage} onOpenFoto={vi.fn()} />
    );
    fireEvent.click(screen.getByText("Enviar mensaje"));
    expect(onMessage).toHaveBeenCalledWith(item);
  });

  it("llama a onToggleLike con el id de la publicación al clickear el corazón", () => {
    const onToggleLike = vi.fn();
    renderWithRouter(
      <PublicacionCard
        item={makeItem({ id: "42" })}
        liked={false}
        onToggleLike={onToggleLike}
        onMessage={vi.fn()}
        onOpenFoto={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText("2").closest("button")!);
    expect(onToggleLike).toHaveBeenCalledWith("42");
  });

  it("muestra el corazón lleno cuando liked es true", () => {
    renderWithRouter(
      <PublicacionCard item={makeItem({})} liked onToggleLike={vi.fn()} onMessage={vi.fn()} onOpenFoto={vi.fn()} />
    );
    expect(screen.getByText("♥")).toBeInTheDocument();
  });

  it("no muestra el botón de guardar si no se pasa onToggleGuardado", () => {
    renderWithRouter(
      <PublicacionCard item={makeItem({})} liked={false} onToggleLike={vi.fn()} onMessage={vi.fn()} onOpenFoto={vi.fn()} />
    );
    expect(screen.queryByTitle("Guardar publicación")).not.toBeInTheDocument();
  });

  it("llama a onToggleGuardado con el id de la publicación al clickear guardar", () => {
    const onToggleGuardado = vi.fn();
    renderWithRouter(
      <PublicacionCard
        item={makeItem({ id: "42" })}
        liked={false}
        guardado={false}
        onToggleLike={vi.fn()}
        onToggleGuardado={onToggleGuardado}
        onMessage={vi.fn()}
        onOpenFoto={vi.fn()}
      />
    );
    fireEvent.click(screen.getByTitle("Guardar publicación"));
    expect(onToggleGuardado).toHaveBeenCalledWith("42");
  });

  it("muestra 'Quitar de guardados' cuando guardado es true", () => {
    renderWithRouter(
      <PublicacionCard
        item={makeItem({})}
        liked={false}
        guardado
        onToggleLike={vi.fn()}
        onToggleGuardado={vi.fn()}
        onMessage={vi.fn()}
        onOpenFoto={vi.fn()}
      />
    );
    expect(screen.getByTitle("Quitar de guardados")).toBeInTheDocument();
  });

  it("el nombre del autor linkea a su mini perfil público", () => {
    renderWithRouter(
      <PublicacionCard
        item={makeItem({ autor_id: "autor-99" })}
        liked={false}
        onToggleLike={vi.fn()}
        onMessage={vi.fn()}
        onOpenFoto={vi.fn()}
      />
    );
    expect(screen.getByText("Ana Gómez").closest("a")).toHaveAttribute("href", "/perfil/autor-99");
  });
});
