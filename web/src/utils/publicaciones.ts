import type { TipoPublicacion } from "../lib/database.types";

export const MAX_FOTOS = 3;
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

export function fotoExtension(fileName: string): string {
  const parts = fileName.split(".");
  return parts.length > 1 ? (parts.pop() ?? "jpg") : "jpg";
}

export function buildFotoPath(userId: string, fileName: string): string {
  return `${userId}/${crypto.randomUUID()}.${fotoExtension(fileName)}`;
}
