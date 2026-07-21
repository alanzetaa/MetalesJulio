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
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [enRecuperacion, setEnRecuperacion] = useState(false);

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

  const value: AuthContextValue = {
    session,
    loadingSession,
    profile,
    loadingProfile,
    isSuperAdmin,
    enRecuperacion,
    setEnRecuperacion,
    refetchProfile: () => cargarPerfilYRol(session),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
