import { Modal } from "../ui/Modal";
import { TerminosContenido } from "./TerminosContenido";

interface TerminosModalProps {
  open: boolean;
  onClose: () => void;
}

export function TerminosModal({ open, onClose }: TerminosModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Términos y Condiciones" maxWidth={560}>
      <TerminosContenido />
    </Modal>
  );
}
