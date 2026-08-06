import type { Session } from "@supabase/supabase-js";

/**
 * Al loguearse con Google, Supabase guarda los datos que Google devuelve en
 * session.user.user_metadata (given_name/family_name si el scope los trae,
 * o si no, full_name/name enteros) -- se usa para precargar "Mi perfil" la
 * primera vez, así la persona no tiene que volver a tipear lo que Google ya
 * nos dio. Sigue siendo editable: si Google trae el nombre distinto a como
 * la persona lo quiere usar acá, lo puede cambiar antes de guardar.
 */
export function nombreApellidoDesdeGoogle(session: Session | null): { nombre: string; apellido: string } {
  const meta = (session?.user.user_metadata ?? {}) as Record<string, unknown>;
  const given = typeof meta.given_name === "string" ? meta.given_name.trim() : "";
  const family = typeof meta.family_name === "string" ? meta.family_name.trim() : "";
  if (given || family) return { nombre: given, apellido: family };

  const completo =
    (typeof meta.full_name === "string" && meta.full_name) || (typeof meta.name === "string" && meta.name) || "";
  const partes = completo.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return { nombre: "", apellido: "" };
  if (partes.length === 1) return { nombre: partes[0], apellido: "" };
  return { nombre: partes[0], apellido: partes.slice(1).join(" ") };
}
