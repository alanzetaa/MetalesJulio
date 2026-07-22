import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
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

describe("PublicacionCard", () => {
  it("muestra el botón de mensaje cuando la publicación no es propia (sin botón de contacto directo)", () => {
    render(
      <PublicacionCard
        item={makeItem({})}
        liked={false}
        isOwn={false}
        onToggleLike={vi.fn()}
        onMessage={vi.fn()}
        onOpenFoto={vi.fn()}
      />
    );
    expect(screen.getByText("Enviar mensaje")).toBeInTheDocument();
    expect(screen.queryByText("Contactar")).not.toBeInTheDocument();
    expect(screen.queryByText("Esta es tu publicación")).not.toBeInTheDocument();
  });

  it("muestra 'Esta es tu publicación' en vez del botón cuando es propia", () => {
    render(
      <PublicacionCard
        item={makeItem({})}
        liked={false}
        isOwn
        onToggleLike={vi.fn()}
        onMessage={vi.fn()}
        onOpenFoto={vi.fn()}
      />
    );
    expect(screen.getByText("Esta es tu publicación")).toBeInTheDocument();
    expect(screen.queryByText("Enviar mensaje")).not.toBeInTheDocument();
  });

  it("llama a onMessage con la publicación al clickear el botón de mensaje", () => {
    const onMessage = vi.fn();
    const item = makeItem({});
    render(
      <PublicacionCard
        item={item}
        liked={false}
        isOwn={false}
        onToggleLike={vi.fn()}
        onMessage={onMessage}
        onOpenFoto={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText("Enviar mensaje"));
    expect(onMessage).toHaveBeenCalledWith(item);
  });

  it("llama a onToggleLike con el id de la publicación al clickear el corazón", () => {
    const onToggleLike = vi.fn();
    render(
      <PublicacionCard
        item={makeItem({ id: "42" })}
        liked={false}
        isOwn={false}
        onToggleLike={onToggleLike}
        onMessage={vi.fn()}
        onOpenFoto={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText("2").closest("button")!);
    expect(onToggleLike).toHaveBeenCalledWith("42");
  });

  it("muestra el corazón lleno cuando liked es true", () => {
    render(
      <PublicacionCard
        item={makeItem({})}
        liked
        isOwn={false}
        onToggleLike={vi.fn()}
        onMessage={vi.fn()}
        onOpenFoto={vi.fn()}
      />
    );
    expect(screen.getByText("♥")).toBeInTheDocument();
  });
});
