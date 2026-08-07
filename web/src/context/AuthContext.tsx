import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import type { ProfileRow } from "../lib/database.types";

interface AuthContextValue {
  /** null mientras se resuelve la sesión inicial */
  session: Session | null;
  loadingSession: boolean;
  /** null = todavía no se cargó / no completó el perfil */
  profile: ProfileRow | null;
  loadingProfile: boolean;
  isSuperAdmin: boolean;
  /** Bandera para el flujo de "recuperar contraseña" (ver PASSWORD_RECOVERY) */
  enRecuperacion: boolean;
  setEnRecuperacion: (v: boolean) => void;
  refetchProfile: () => Promise<void>;
  /** Nombre de la persona que se está viendo, o null si no hay "Ver como" activo */
  impersonatingLabel: string | null;
  /** Genera una sesión temporal a nombre de targetId (solo súper admins) -- devuelve un mensaje de error, o null si salió bien */
  verComo: (targetId: string, label: string) => Promise<string | null>;
  /** Vuelve a la sesión propia del súper admin, cerrando "Ver como" */
  salirDeVerComo: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [enRecuperacion, setEnRecuperacion] = useState(false);
  // Sesión propia del súper admin, guardada en memoria mientras dura un "Ver
  // como" -- se pierde si se recarga la página (mismo criterio que
  // persistSession:false), así que un F5 durante un "Ver como" simplemente
  // desloguea del todo, sin dejar ningún resto pisado.
  const [adminBackupSession, setAdminBackupSession] = useState<Session | null>(null);
  const [impersonatingLabel, setImpersonatingLabel] = useState<string | null>(null);

  // Guarda contra respuestas obsoletas: si la sesión cambió mientras una
  // consulta estaba en vuelo (por ej. cambiando de cuenta rápido en la misma
  // pestaña), se descarta el resultado viejo en vez de pisar el estado actual.
  const sessionTokenRef = useRef(0);

  async function cargarPerfilYRol(currentSession: Session | null) {
    const miToken = ++sessionTokenRef.current;
    if (!currentSession) {
      setProfile(null);
      setIsSuperAdmin(false);
      return;
    }
    setLoadingProfile(true);
    const [profileRes, adminRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", currentSession.user.id).maybeSingle(),
      supabase.rpc("es_super_admin"),
    ]);
    if (miToken !== sessionTokenRef.current) return; // una llamada más nueva ya arrancó
    setProfile(profileRes.data ?? null);
    setIsSuperAdmin(!adminRes.error && adminRes.data === true);
    setLoadingProfile(false);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoadingSession(false);
      void cargarPerfilYRol(data.session);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === "PASSWORD_RECOVERY") {
        setEnRecuperacion(true);
        setSession(newSession);
        return;
      }
      setSession(newSession);
      setLoadingSession(false);
      void cargarPerfilYRol(newSession);
    });

    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function verComo(targetId: string, label: string): Promise<string | null> {
    if (!session) return "No hay sesión activa.";
    const { data, error } = await supabase.functions.invoke("ver-como", { body: { targetId } });
    if (error) return error.message;
    const resultado = data as { email?: string; hashedToken?: string } | null;
    if (!resultado?.email || !resultado.hashedToken) return "No se pudo generar la sesión.";

    const backup = session;
    const { error: otpError } = await supabase.auth.verifyOtp({
      token_hash: resultado.hashedToken,
      type: "magiclink",
    });
    if (otpError) return otpError.message;

    setAdminBackupSession(backup);
    setImpersonatingLabel(label);
    return null;
  }

  async function salirDeVerComo() {
    if (!adminBackupSession) return;
    await supabase.auth.setSession({
      access_token: adminBackupSession.access_token,
      refresh_token: adminBackupSession.refresh_token,
    });
    setAdminBackupSession(null);
    setImpersonatingLabel(null);
  }

  const value: AuthContextValue = {
    session,
    loadingSession,
    profile,
    loadingProfile,
    isSuperAdmin,
    enRecuperacion,
    setEnRecuperacion,
    refetchProfile: () => cargarPerfilYRol(session),
    impersonatingLabel,
    verComo,
    salirDeVerComo,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
