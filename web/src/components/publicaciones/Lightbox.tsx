import type { MouseEvent } from "react";
import { fotoUrl } from "../../lib/supabaseClient";

interface LightboxProps {
  fotoPaths: string[] | null;
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

export function Lightbox({ fotoPaths, index, onClose, onIndexChange }: LightboxProps) {
  if (!fotoPaths || !fotoPaths.length) return null;
  const haySeveras = fotoPaths.length > 1;

  function handleOverlayClick(e: MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  function prev() {
    onIndexChange((index - 1 + fotoPaths!.length) % fotoPaths!.length);
  }

  function next() {
    onIndexChange((index + 1) % fotoPaths!.length);
  }

  return (
    <div className="modal-overlay open" onMouseDown={handleOverlayClick}>
      <div className="lightbox-inner">
        <button type="button" className="lightbox-close" aria-label="Cerrar" onClick={onClose}>
          ×
        </button>
        <button
          type="button"
          className="lightbox-nav lightbox-prev"
          aria-label="Foto anterior"
          hidden={!haySeveras}
          onClick={prev}
        >
          ‹
        </button>
        <img className="lightbox-img" src={fotoUrl(fotoPaths[index])} alt="" />
        <button
          type="button"
          className="lightbox-nav lightbox-next"
          aria-label="Foto siguiente"
          hidden={!haySeveras}
          onClick={next}
        >
          ›
        </button>
        <span className="lightbox-counter">{haySeveras ? `${index + 1} / ${fotoPaths.length}` : ""}</span>
      </div>
    </div>
  );
}
