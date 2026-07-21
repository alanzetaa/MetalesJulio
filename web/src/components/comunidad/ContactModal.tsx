import { Modal } from "../ui/Modal";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { capitalizarNombre } from "../../utils/format";
import { buildContactLinks, type ContactLink } from "../../utils/contacto";
import type { ComunidadPublicacionRow } from "../../lib/database.types";

interface ContactModalProps {
  item: ComunidadPublicacionRow | null;
  onClose: () => void;
}

export function ContactModal({ item, onClose }: ContactModalProps) {
  const { session } = useAuth();

  async function handleClick(link: ContactLink) {
    if (item && session) {
      await supabase.from("contactos").insert({
        publicacion_id: item.id,
        autor_id: item.autor_id,
        visitante_id: session.user.id,
        medio: link.medio,
      });
    }
    if (link.medio === "email") {
      window.location.href = link.url;
    } else {
      window.open(link.url, "_blank", "noopener");
    }
  }

  const links = item ? buildContactLinks(item) : [];

  return (
    <Modal
      open={Boolean(item)}
      onClose={onClose}
      title={item ? `Contactar a ${capitalizarNombre(item.nombre)} ${capitalizarNombre(item.apellido)}` : ""}
    >
      {links.length === 0 ? (
        <p className="hint">Esta persona todavía no cargó un dato de contacto público.</p>
      ) : (
        <div className="contact-list">
          {links.map((link) => (
            <button key={link.medio} type="button" className={link.className} onClick={() => void handleClick(link)}>
              {link.label}
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
