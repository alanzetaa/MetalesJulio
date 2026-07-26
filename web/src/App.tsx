import { lazy, Suspense } from "react";
import { Navigate, Route, BrowserRouter, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { ErrorBoundary } from "./components/layout/ErrorBoundary";
import { AppShell } from "./components/layout/AppShell";
import { NewPasswordModal } from "./components/auth/NewPasswordModal";
import { PublicLandingPage } from "./pages/PublicLandingPage";
import { SuspendedPage } from "./pages/stubs";

// Todo lo que vive detrás del login se carga en su propio "pedazo" de
// código, bajo demanda -- ver reglas.md ("Code splitting por ruta"). Antes
// todo esto (incluido HQ Metales entero) se descargaba de una sola vez para
// cualquiera que entrara al sitio, aunque nunca visitara esas pantallas.
const PerfilPage = lazy(() => import("./pages/PerfilPage").then((m) => ({ default: m.PerfilPage })));
const PerfilPublicoPage = lazy(() =>
  import("./pages/PerfilPublicoPage").then((m) => ({ default: m.PerfilPublicoPage }))
);
const MisPublicacionesPage = lazy(() =>
  import("./pages/MisPublicacionesPage").then((m) => ({ default: m.MisPublicacionesPage }))
);
const BuscarPage = lazy(() => import("./pages/BuscarPage").then((m) => ({ default: m.BuscarPage })));
const GuardadosPage = lazy(() => import("./pages/GuardadosPage").then((m) => ({ default: m.GuardadosPage })));
const MensajesPage = lazy(() => import("./pages/MensajesPage").then((m) => ({ default: m.MensajesPage })));
const AdminPage = lazy(() => import("./pages/AdminPage").then((m) => ({ default: m.AdminPage })));
const SeguridadPage = lazy(() => import("./pages/SeguridadPage").then((m) => ({ default: m.SeguridadPage })));

const queryClient = new QueryClient();

function RootRoute() {
  const { session, loadingSession } = useAuth();
  if (loadingSession) return null;
  if (session) return <Navigate to="/buscar" replace />;
  return <PublicLandingPage />;
}

function RequireSuperAdmin({ children }: { children: React.ReactNode }) {
  const { isSuperAdmin, loadingProfile } = useAuth();
  if (loadingProfile) return null;
  if (!isSuperAdmin) return <Navigate to="/buscar" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<RootRoute />} />
        <Route path="/suspendido" element={<SuspendedPage />} />
        <Route element={<AppShell />}>
          <Route path="/buscar" element={<BuscarPage />} />
          <Route path="/guardados" element={<GuardadosPage />} />
          <Route path="/publicaciones" element={<MisPublicacionesPage />} />
          <Route path="/mensajes" element={<MensajesPage />} />
          <Route path="/perfil" element={<PerfilPage />} />
          <Route path="/perfil/:userId" element={<PerfilPublicoPage />} />
          <Route
            path="/admin"
            element={
              <RequireSuperAdmin>
                <AdminPage />
              </RequireSuperAdmin>
            }
          />
          <Route
            path="/admin/seguridad"
            element={
              <RequireSuperAdmin>
                <SeguridadPage />
              </RequireSuperAdmin>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ToastProvider>
            <AuthProvider>
              <AppRoutes />
              <NewPasswordModal />
            </AuthProvider>
          </ToastProvider>
        </BrowserRouter>
      </QueryClientProvider>
      <Analytics />
      <SpeedInsights />
    </ErrorBoundary>
  );
}
