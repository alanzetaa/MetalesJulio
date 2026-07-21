import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Modal } from "../../src/components/ui/Modal";

describe("Modal", () => {
  it("no renderiza nada cuando open es false", () => {
    render(
      <Modal open={false} title="Título">
        contenido
      </Modal>
    );
    expect(screen.queryByText("contenido")).not.toBeInTheDocument();
  });

  it("renderiza el título y el contenido cuando open es true", () => {
    render(
      <Modal open title="Título">
        contenido
      </Modal>
    );
    expect(screen.getByText("Título")).toBeInTheDocument();
    expect(screen.getByText("contenido")).toBeInTheDocument();
  });

  it("llama a onClose al clickear la 'x'", () => {
    const onClose = vi.fn();
    render(
      <Modal open title="Título" onClose={onClose}>
        contenido
      </Modal>
    );
    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("llama a onClose al clickear el overlay, pero no al clickear adentro del modal", () => {
    const onClose = vi.fn();
    render(
      <Modal open title="Título" onClose={onClose}>
        contenido
      </Modal>
    );
    fireEvent.mouseDown(screen.getByText("contenido"));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.mouseDown(screen.getByText("contenido").closest(".modal-overlay")!);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("cuando blocking es true no muestra la 'x' ni cierra clickeando afuera", () => {
    const onClose = vi.fn();
    render(
      <Modal open title="Título" onClose={onClose} blocking>
        contenido
      </Modal>
    );
    expect(screen.queryByRole("button", { name: "Cerrar" })).not.toBeInTheDocument();
    fireEvent.mouseDown(screen.getByText("contenido").closest(".modal-overlay")!);
    expect(onClose).not.toHaveBeenCalled();
  });
});
