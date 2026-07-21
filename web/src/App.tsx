import { Navigate, Route, BrowserRouter, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { ErrorBoundary } from "./components/layout/ErrorBoundary";
import { AppShell } from "./components/layout/AppShell";
import { NewPasswordModal } from "./components/auth/NewPasswordModal";
import { PublicLandingPage } from "./pages/PublicLandingPage";
import {
  AdminPage,
  BuscarPage,
  MensajesPage,
  MisPublicacionesPage,
  PerfilPage,
  SeguridadPage,
  SuspendedPage,
} from "./pages/stubs";

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
    <Routes>
      <Route path="/" element={<RootRoute />} />
      <Route path="/suspendido" element={<SuspendedPage />} />
      <Route element={<AppShell />}>
        <Route path="/buscar" element={<BuscarPage />} />
        <Route path="/publicaciones" element={<MisPublicacionesPage />} />
        <Route path="/mensajes" element={<MensajesPage />} />
        <Route path="/perfil" element={<PerfilPage />} />
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
    </ErrorBoundary>
  );
}
