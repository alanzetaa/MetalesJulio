interface PaginationControlsProps {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}

export function PaginationControls({ page, totalPages, onPrev, onNext }: PaginationControlsProps) {
  if (totalPages <= 1) return null;
  return (
    <div className="admin-pagination">
      <button type="button" className="btn btn-outline-dark" onClick={onPrev} disabled={page <= 1}>
        ‹ Anterior
      </button>
      <span className="admin-pagination-info">
        Página {page} de {totalPages}
      </span>
      <button type="button" className="btn btn-outline-dark" onClick={onNext} disabled={page >= totalPages}>
        Siguiente ›
      </button>
    </div>
  );
}
