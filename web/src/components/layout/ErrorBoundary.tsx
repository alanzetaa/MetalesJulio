import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

const CHUNK_RELOAD_KEY = "mj_chunk_reload_intentado";

/**
 * Cada página se descarga por separado (code splitting por ruta) -- si el
 * sitio se actualiza justo mientras alguien lo tiene abierto en el
 * celular/navegador, el archivo .js de una página a la que todavía no
 * había entrado puede haber cambiado de nombre en el servidor. El
 * navegador tira este error al no encontrarlo, y sin este chequeo
 * terminaba en la pantalla de "Algo salió mal" en vez de solo traer la
 * versión nueva -- que es lo único que hace falta.
 */
function esErrorDeChunkDesactualizado(error: Error): boolean {
  return /dynamically imported module|module script failed|Loading chunk .* failed/i.test(error.message);
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("Error inesperado:", error, info.componentStack);
    // Un solo intento de recarga automática (la bandera en sessionStorage
    // evita un loop infinito si el reload no arregla nada): si sigue
    // fallando después de traer la versión nueva, ahí sí se muestra la
    // pantalla de error real más abajo.
    if (esErrorDeChunkDesactualizado(error) && !sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
      sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
      window.location.reload();
    }
  }

  render() {
    if (this.state.error) {
      if (esErrorDeChunkDesactualizado(this.state.error) && sessionStorage.getItem(CHUNK_RELOAD_KEY) === "1") {
        return null;
      }
      return (
        <div className="error-boundary">
          <h2>Algo salió mal</h2>
          <p className="hint">
            Ocurrió un error inesperado. Probá recargar la página; si el problema sigue, avisale al
            administrador de la comunidad.
          </p>
          <button type="button" className="btn btn-dark" onClick={() => window.location.reload()}>
            Recargar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
