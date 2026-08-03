import { Modal } from "../ui/Modal";

interface VerTextoModalProps {
  info: { titulo: string; texto: string } | null;
  onClose: () => void;
}

/**
 * Modal genérico para ver completo un texto que en la tabla aparece cortado
 * con "..." (comentarios de denuncias/reseñas, cuerpo de mensajes,
 * descripción de publicaciones) -- el atributo title (tooltip nativo del
 * navegador) sigue quedando como respaldo, pero no es notorio para quien no
 * sabe que existe y no funciona al tocar en celular.
 */
export function VerTextoModal({ info, onClose }: VerTextoModalProps) {
  if (!info) return null;
  return (
    <Modal open onClose={onClose} title={info.titulo} maxWidth={480}>
      <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{info.texto}</p>
    </Modal>
  );
}
