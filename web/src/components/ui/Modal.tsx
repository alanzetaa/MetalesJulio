import type { MouseEvent, ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose?: () => void;
  title: string;
  /** Si es true, no se muestra la "x" de cerrar ni se cierra clickeando afuera. */
  blocking?: boolean;
  maxWidth?: number;
  children: ReactNode;
}

export function Modal({ open, onClose, title, blocking, maxWidth = 420, children }: ModalProps) {
  if (!open) return null;

  function handleOverlayClick(e: MouseEvent<HTMLDivElement>) {
    if (!blocking && onClose && e.target === e.currentTarget) onClose();
  }

  return (
    <div className="modal-overlay open" onMouseDown={handleOverlayClick}>
      <div className="modal" style={{ maxWidth }}>
        <div className="modal-header">
          <h3>{title}</h3>
          {!blocking && onClose && (
            <button type="button" className="modal-close" aria-label="Cerrar" onClick={onClose}>
              ×
            </button>
          )}
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
