import type { TipoPublicacion } from "../lib/database.types";

// Bajado de 3 a 2 para cuidar el espacio de Storage (plan gratuito de
// Supabase) -- ver reglas.md ("Fotos de publicaciones").
export const MAX_FOTOS = 2;
export const MAX_FOTO_BYTES = 5 * 1024 * 1024;

export function tipoLabel(tipo: TipoPublicacion): string {
  return tipo === "busco" ? "Busco" : "Ofrezco";
}

export function tipoBadgeClass(tipo: TipoPublicacion): string {
  return tipo === "busco" ? "badge-tipo-busco" : "badge-tipo-ofrezco";
}

export function tipoCardClass(tipo: TipoPublicacion): string {
  return tipo === "busco" ? "card-tipo-busco" : "card-tipo-ofrezco";
}

// Ventana para poder editar título/rubro/descripción/tipo de una
// publicación ya creada (pedido explícito del dueño) -- coincide con el
// límite que hace cumplir el trigger limitar_edicion_publicacion() en
// supabase-schema.sql, así que si se cambia acá hay que cambiarlo ahí
// también. Pasado ese tiempo, solo se puede seguir editando las fotos
// (eso no tiene límite de tiempo, ver reglas.md).
export const EDIT_WINDOW_MINUTES = 20;

export function puedeEditarPublicacion(createdAt: string): boolean {
  const limite = new Date(createdAt).getTime() + EDIT_WINDOW_MINUTES * 60_000;
  return Date.now() < limite;
}

export function fotoExtension(fileName: string): string {
  const parts = fileName.split(".");
  return parts.length > 1 ? (parts.pop() ?? "jpg") : "jpg";
}

export function buildFotoPath(userId: string, fileName: string): string {
  return `${userId}/${crypto.randomUUID()}.${fotoExtension(fileName)}`;
}
