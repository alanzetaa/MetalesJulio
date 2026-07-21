export function PublicLandingPage() {
  return (
    <div>
      <header>
        <div className="nav-row">
          <a href="#inicio" className="logo">
            <span className="logo-badge">MJ</span>
            <span className="logo-text">
              <strong>METALES JULIO</strong>
              <span>Comunidad de oficios</span>
            </span>
          </a>
        </div>
      </header>
      <section className="hero" id="inicio">
        <div className="container">
          <p className="hero-kicker">Un proyecto de Metales Julio</p>
          <h1>
            El punto de encuentro de los <em>artesanos y oficios del metal</em>
          </h1>
          <p className="lead">
            Una comunidad impulsada por Metales Julio para que soldadores, herreros, joyeros, torneros y
            artesanos publiquen sus trabajos y artesanías, y para que cualquiera que necesite un oficio del
            metal los encuentre y los contacte directamente.
          </p>
        </div>
      </section>
    </div>
  );
}
