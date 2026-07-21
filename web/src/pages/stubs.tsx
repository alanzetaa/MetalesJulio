// Páginas placeholder — se van a completar fase por fase (ver el plan en
// C:\Users\User\.claude\plans\sequential-enchanting-wreath.md). Cada una se
// separará a su propio archivo cuando se implemente de verdad.

export function BuscarPage() {
  return (
    <div className="app-content-inner">
      <section className="app-section">
        <div className="app-section-head">
          <h2>Buscar en la comunidad</h2>
          <p>Encontrá el trabajo o la artesanía que necesitás.</p>
        </div>
        <p className="hint">(en construcción)</p>
      </section>
    </div>
  );
}

export function MensajesPage() {
  return (
    <div className="app-content-inner">
      <section className="app-section">
        <div className="app-section-head">
          <h2>Mensajes</h2>
          <p>Tus conversaciones con otros miembros de la comunidad.</p>
        </div>
        <p className="hint">(en construcción)</p>
      </section>
    </div>
  );
}

export function AdminPage() {
  return (
    <section className="app-section" id="section-admin">
      <div className="app-section-head">
        <h2>HQ Metales</h2>
        <p>Todo lo que pasa en la comunidad, en un solo lugar.</p>
      </div>
      <p className="hint">(en construcción)</p>
    </section>
  );
}

export function SeguridadPage() {
  return (
    <section className="app-section" id="section-admin">
      <div className="app-section-head">
        <h2>Seguridad</h2>
        <p>Quién puede ver y administrar HQ Metales.</p>
      </div>
      <p className="hint">(en construcción)</p>
    </section>
  );
}

export function SuspendedPage() {
  return (
    <div style={{ maxWidth: 520, margin: "80px auto", textAlign: "center", padding: "0 20px" }}>
      <h2 style={{ fontSize: 26 }}>Tu cuenta está suspendida</h2>
      <p className="hint">Si creés que es un error, contactate con la administración de la comunidad.</p>
    </div>
  );
}
