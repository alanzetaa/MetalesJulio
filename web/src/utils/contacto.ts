import type { MedioContacto } from "../lib/database.types";

export interface ContactLink {
  medio: MedioContacto;
  label: string;
  url: string;
  className: string;
}

type ContactableItem = {
  whatsapp: string | null;
  instagram: string | null;
  contacto_email: string | null;
};

/**
 * Arma los botones de contacto disponibles para una publicación, en el mismo
 * orden que la app vanilla: WhatsApp, Instagram, Email — solo los medios que
 * la persona haya cargado en su perfil.
 */
export function buildContactLinks(item: ContactableItem): ContactLink[] {
  const links: ContactLink[] = [];
  if (item.whatsapp) {
    links.push({
      medio: "whatsapp",
      label: "WhatsApp",
      url: `https://wa.me/${encodeURIComponent(item.whatsapp)}`,
      className: "btn btn-dark",
    });
  }
  if (item.instagram) {
    const handle = item.instagram.replace(/^@/, "");
    links.push({
      medio: "instagram",
      label: "Instagram",
      url: `https://instagram.com/${encodeURIComponent(handle)}`,
      className: "btn btn-outline-dark",
    });
  }
  if (item.contacto_email) {
    links.push({
      medio: "email",
      label: "Email",
      url: `mailto:${encodeURIComponent(item.contacto_email)}`,
      className: "btn btn-outline-dark",
    });
  }
  return links;
}
