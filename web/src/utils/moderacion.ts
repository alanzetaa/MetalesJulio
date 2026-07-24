import { PALABRAS_PROHIBIDAS } from "../constants/palabrasProhibidas";

/**
 * Saca acentos y pasa a minúscula, para que "estúpido" y "estupido"
 * matcheen igual. El rango ̀-ͯ son las marcas diacríticas que
 * separa normalize("NFD") -- se escriben como escape (no como el
 * caracter literal) para que no se corrompan al editar este archivo con
 * otra herramienta, mismo motivo que el BOM de csv.ts.
 */
function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * Chequeo rápido en el cliente (da el aviso antes de mandar la publicación
 * o el mensaje) -- ver reglas.md, "Filtro de lenguaje ofensivo". El
 * bloqueo real está del lado del servidor (contiene_insulto() en
 * supabase-schema.sql), esto es solo para mejor UX.
 */
export function contieneInsulto(texto: string | null | undefined): boolean {
  if (!texto) return false;
  const normalizado = normalizarTexto(texto);
  return PALABRAS_PROHIBIDAS.some((palabra) => new RegExp(`\\b${palabra}\\b`, "i").test(normalizado));
}
