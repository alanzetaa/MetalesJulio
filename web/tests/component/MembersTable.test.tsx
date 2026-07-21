import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MembersTable } from "../../src/components/admin/MembersTable";
import type { AdminMiembroRow } from "../../src/lib/database.types";

function makeMiembro(overrides: Partial<AdminMiembroRow>): AdminMiembroRow {
  return {
    id: "1",
    nombre: "ana",
    apellido: "gómez",
    dni: "30123456",
    email: "ana@test.com",
    ubicacion: "CABA",
    created_at: "2026-01-01T00:00:00Z",
    ultima_conexion: null,
    suspendido_hasta: null,
    mensajes_recibidos: 0,
    contactos_recibidos: 0,
    whatsapp: null,
    instagram: null,
    contacto_email: null,
    ...overrides,
  };
}

describe("MembersTable", () => {
  it("muestra 'No se encontraron miembros' cuando la lista está vacía", () => {
    render(
      <MembersTable
        members={[]}
        sort={{ column: "created_at", direction: "desc" }}
        onSortChange={vi.fn()}
        onSuspender={vi.fn()}
        onReactivar={vi.fn()}
        onEliminar={vi.fn()}
      />
    );
    expect(screen.getByText("No se encontraron miembros.")).toBeInTheDocument();
  });

  it("llama a onSortChange con la columna clickeada", () => {
    const onSortChange = vi.fn();
    render(
      <MembersTable
        members={[makeMiembro({})]}
        sort={{ column: "created_at", direction: "desc" }}
        onSortChange={onSortChange}
        onSuspender={vi.fn()}
        onReactivar={vi.fn()}
        onEliminar={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText("Email"));
    expect(onSortChange).toHaveBeenCalledWith("email");
  });

  it("deshabilita 'Reactivar' cuando el miembro no está suspendido", () => {
    render(
      <MembersTable
        members={[makeMiembro({ suspendido_hasta: null })]}
        sort={{ column: "created_at", direction: "desc" }}
        onSortChange={vi.fn()}
        onSuspender={vi.fn()}
        onReactivar={vi.fn()}
        onEliminar={vi.fn()}
      />
    );
    expect(screen.getByText("Reactivar")).toBeDisabled();
  });

  it("habilita 'Reactivar' cuando el miembro está suspendido", () => {
    render(
      <MembersTable
        members={[makeMiembro({ suspendido_hasta: "2999-01-01T00:00:00Z" })]}
        sort={{ column: "created_at", direction: "desc" }}
        onSortChange={vi.fn()}
        onSuspender={vi.fn()}
        onReactivar={vi.fn()}
        onEliminar={vi.fn()}
      />
    );
    expect(screen.getByText("Reactivar")).not.toBeDisabled();
  });

  it("llama a onSuspender y onEliminar con id y nombre completo capitalizado", () => {
    const onSuspender = vi.fn();
    const onEliminar = vi.fn();
    render(
      <MembersTable
        members={[makeMiembro({ id: "7", nombre: "juan", apellido: "pérez" })]}
        sort={{ column: "created_at", direction: "desc" }}
        onSortChange={vi.fn()}
        onSuspender={onSuspender}
        onReactivar={vi.fn()}
        onEliminar={onEliminar}
      />
    );
    fireEvent.click(screen.getByText("Suspender"));
    expect(onSuspender).toHaveBeenCalledWith("7", "Juan Pérez");
    fireEvent.click(screen.getByText("Eliminar"));
    expect(onEliminar).toHaveBeenCalledWith("7", "Juan Pérez");
  });
});
