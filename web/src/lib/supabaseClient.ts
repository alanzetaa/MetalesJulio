import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

if (!isConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    "Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Revisá el archivo .env (ver .env.example)."
  );
}

// Por seguridad, la sesión no persiste entre recargas de página (decisión
// explícita del dueño, mismo criterio que en Biddit): se borra cualquier
// resto de sesión vieja en localStorage al cargar, salvo que la URL traiga
// un access_token (login con Google o recuperar contraseña en curso, para
// no pisar esa sesión antes de que se procese).
if (typeof window !== "undefined" && window.location.hash.indexOf("access_token") === -1) {
  Object.keys(window.localStorage)
    .filter((k) => k.indexOf("supabase") !== -1 || k.indexOf("sb-") === 0)
    .forEach((k) => window.localStorage.removeItem(k));
}

export const supabase = createClient<Database>(SUPABASE_URL ?? "", SUPABASE_ANON_KEY ?? "", {
  auth: { persistSession: false },
});

export const FOTOS_BUCKET = "publicaciones-fotos";

export function fotoUrl(path: string): string {
  return supabase.storage.from(FOTOS_BUCKET).getPublicUrl(path).data.publicUrl;
}
