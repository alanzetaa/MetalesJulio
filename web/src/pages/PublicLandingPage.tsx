import { useState } from "react";
import { useMemberCount } from "../hooks/useMemberCount";
import { LoginModal } from "../components/auth/LoginModal";
import { RegisterModal } from "../components/auth/RegisterModal";
import { ForgotPasswordModal } from "../components/auth/ForgotPasswordModal";

function memberCountText(n: number | null | undefined): string {
  if (n == null) return "Cargando comunidad…";
  return n === 1 ? "1 persona ya forma parte de la comunidad" : `${n} personas ya forman parte de la comunidad`;
}

export function PublicLandingPage() {
  const { data: memberCount } = useMemberCount();
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  return (
    <div id="publicView">
      <header>
        <div className="nav-row">
          <a href="#inicio" className="logo">
            <span className="logo-badge">MJ</span>
            <span className="logo-text">
              <strong>METALES JULIO</strong>
              <span>Comunidad de oficios</span>
            </span>
          </a>
          <nav className="links">
            <button type="button" className="nav-cta-link" onClick={() => setRegisterOpen(true)}>
              Sumate gratis a la comunidad
            </button>
            <a href="#como-funciona">Cómo funciona</a>
            <a href="https://www.tiendametalesjulio.com.ar/" target="_blank" rel="noopener noreferrer">
              Tienda oficial ↗
            </a>
          </nav>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" className="btn btn-outline" onClick={() => setLoginOpen(true)}>
              Ingresar
            </button>
            <button type="button" className="btn btn-accent" onClick={() => setRegisterOpen(true)}>
              Registrarme
            </button>
          </div>
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
            metal los encuentre y los contacte directamente. Para ver quién forma parte y buscar, primero hay
            que ser parte de la comunidad.
          </p>
          <ul className="value-props">
            <li>Contacto directo, sin intermediarios</li>
            <li>Identidad verificada con DNI</li>
            <li>100% oficios del metal</li>
          </ul>
          <p className="member-count">{memberCountText(memberCount)}</p>
        </div>
      </section>

      <section className="section how" id="como-funciona">
        <div className="container">
          <div className="section-head">
            <div>
              <h2>¿Cómo funciona la comunidad?</h2>
              <p>Todo lo que pasa adentro (buscar, ver quién publica) es solo para miembros registrados.</p>
            </div>
          </div>
          <div className="how-grid">
            <div className="how-item">
              <div className="num">1</div>
              <h3>Te registrás</h3>
              <p>Creás tu cuenta con email y contraseña, y después completás tu perfil (nombre, DNI, contacto).</p>
            </div>
            <div className="how-item">
              <div className="num">2</div>
              <h3>Publicás tus trabajos</h3>
              <p>Cargás cada trabajo o artesanía como una publicación: título, rubro y descripción.</p>
            </div>
            <div className="how-item">
              <div className="num">3</div>
              <h3>La comunidad te encuentra</h3>
              <p>Otros miembros buscan por rubro, ven tu publicación y te contactan por WhatsApp, Instagram o email.</p>
            </div>
          </div>
          <p className="hint" style={{ marginTop: 22 }}>
            Tu DNI, tu CUIT y el email de tu cuenta son privados: se usan solo para verificar tu identidad y
            nunca se muestran a otros usuarios.
          </p>
        </div>
      </section>

      <footer>
        <div className="container footer-grid">
          <div>
            <h4>Comunidad Metales Julio</h4>
            <p style={{ maxWidth: 280 }}>
              Un espacio para que los artesanos y oficios del metal se muestren, se encuentren y se ayuden
              entre sí.
            </p>
          </div>
          <div>
            <h4>Metales Julio (tienda oficial)</h4>
            <p>
              <a href="https://www.tiendametalesjulio.com.ar/" target="_blank" rel="noopener noreferrer">
                tiendametalesjulio.com.ar ↗
              </a>
            </p>
            <p>Av. Warnes 702, CABA</p>
            <p>(011) 4854-6268 / 4857-3459</p>
          </div>
          <div>
            <h4>Seguinos</h4>
            <p>
              <a href="https://instagram.com/metales.julio" target="_blank" rel="noopener noreferrer">
                Instagram @metales.julio
              </a>
            </p>
            <p>
              <a href="https://facebook.com/metales.julio" target="_blank" rel="noopener noreferrer">
                Facebook @metales.julio
              </a>
            </p>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© {new Date().getFullYear()} Comunidad Metales Julio</span>
          <span>Proyecto comunitario, no afiliado oficialmente a la tienda</span>
        </div>
      </footer>

      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onForgotPassword={() => {
          setLoginOpen(false);
          setForgotOpen(true);
        }}
      />
      <RegisterModal open={registerOpen} onClose={() => setRegisterOpen(false)} />
      <ForgotPasswordModal open={forgotOpen} onClose={() => setForgotOpen(false)} />
    </div>
  );
}
