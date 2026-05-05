"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import "./landing.css";

const navItems = [
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#empresas", label: "Empresas" },
  { href: "#conductores", label: "Conductores" },
  { href: "#blog", label: "Blog" },
  { href: "#soporte", label: "Soporte" },
];

const formMessages = {
  driver: "Listo. Recibimos tu solicitud de certificación.",
  download: "Perfecto. Te enviaremos el enlace de descarga.",
  enterprise: "Gracias. El equipo empresarial te contactará para agendar la demo.",
} as const;

type FormType = keyof typeof formMessages;
type FormStatus = Partial<Record<FormType, string>>;

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v11m0 0 4-4m-4 4-4-4M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}

function AppDownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" />
    </svg>
  );
}

function DriverIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-8 0v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm6-2 2 2 4-4" />
    </svg>
  );
}

function FormMessage({ message }: { message?: string }) {
  return (
    <p className="form-message" role="status">
      {message}
    </p>
  );
}

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [formStatus, setFormStatus] = useState<FormStatus>({});

  useEffect(() => {
    document.title = "MoviliaX Ruum Ruum | Traslado vehicular certificado";

    const description =
      "Ruum Ruum profesionaliza el traslado vehicular con conductores certificados, monitoreo GPS, inspección digital y evidencia antes y después.";
    let metaDescription = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.setAttribute("name", "description");
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute("content", description);

    let themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!themeColor) {
      themeColor = document.createElement("meta");
      themeColor.setAttribute("name", "theme-color");
      document.head.appendChild(themeColor);
    }
    themeColor.setAttribute("content", "#0B3D5F");

    const fontHref = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap";
    if (!document.querySelector(`link[href="${fontHref}"]`)) {
      const preconnectGoogle = document.createElement("link");
      preconnectGoogle.rel = "preconnect";
      preconnectGoogle.href = "https://fonts.googleapis.com";

      const preconnectGstatic = document.createElement("link");
      preconnectGstatic.rel = "preconnect";
      preconnectGstatic.href = "https://fonts.gstatic.com";
      preconnectGstatic.crossOrigin = "";

      const fontLink = document.createElement("link");
      fontLink.rel = "stylesheet";
      fontLink.href = fontHref;

      document.head.append(preconnectGoogle, preconnectGstatic, fontLink);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 24);
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const sections = [...document.querySelectorAll("main section[id]")];

    const activeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(`#${entry.target.id}`);
          }
        });
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: 0 },
    );

    sections.forEach((section) => activeObserver.observe(section));
    return () => activeObserver.disconnect();
  }, []);

  useEffect(() => {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );

    document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));
    return () => revealObserver.disconnect();
  }, []);

  const closeNav = () => setIsNavOpen(false);

  const handleSubmit = (formType: FormType) => (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!event.currentTarget.checkValidity()) {
      event.currentTarget.reportValidity();
      return;
    }

    setFormStatus((current) => ({
      ...current,
      [formType]: formMessages[formType] || "Gracias. Recibimos tu información.",
    }));
    event.currentTarget.reset();
  };

  return (
    <>
      <header className={`site-header${isScrolled ? " is-scrolled" : ""}${isNavOpen ? " is-open" : ""}`}>
        <a className="brand" href="#inicio" aria-label="MoviliaX Ruum Ruum" onClick={closeNav}>
          <img src="/Logo_Ruum_horizontal.png" alt="MoviliaX Ruum Ruum" />
        </a>
        <button
          className="nav-toggle"
          type="button"
          aria-label="Abrir menú"
          aria-expanded={isNavOpen}
          onClick={() => setIsNavOpen((current) => !current)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <nav className={`main-nav${isNavOpen ? " is-open" : ""}`} aria-label="Navegación principal">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={activeSection === item.href ? "active" : undefined}
              onClick={closeNav}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <a className="header-cta" href="#descarga" aria-label="Descargar la app Ruum Ruum" onClick={closeNav}>
          <DownloadIcon />
          Descargar
        </a>
      </header>

      <main>
        <section className="hero" id="inicio">
          <div className="hero-media" role="img" aria-label="Vehículo en traslado con seguimiento operativo"></div>
          <div className="hero-overlay"></div>
          <div className="hero-content reveal">
            <p className="eyebrow">MoviliaX presenta Ruum Ruum</p>
            <h1>Traslada tu vehículo con seguridad y evidencia digital.</h1>
            <p className="hero-copy">
              Conductores certificados, monitoreo en vivo, inspección digital y respaldo profesional para particulares,
              empresas y flotillas.
            </p>
            <div className="hero-actions" aria-label="Acciones principales">
              <a className="button button-primary" href="#descarga">
                <AppDownloadIcon />
                Descargar Ruum Ruum
              </a>
              <a className="button button-ghost" href="#conductores">
                <DriverIcon />
                Registrarme como conductor
              </a>
            </div>
            <div className="trust-row" aria-label="Señales de confianza">
              <span>Ya disponible en México</span>
              <span>Conductores verificados</span>
              <span>Evidencia antes y después</span>
            </div>
          </div>
        </section>

        <section className="section problem-section" id="problema">
          <div className="section-heading reveal">
            <p className="eyebrow">El problema</p>
            <h2>Mover tu vehículo no debería ser un riesgo.</h2>
            <p>
              Muchos traslados siguen ocurriendo sin verificación, sin evidencia y sin trazabilidad. Ruum Ruum
              convierte ese proceso informal en una experiencia controlada.
            </p>
          </div>
          <div className="three-grid">
            <article className="risk-card reveal">
              <div className="icon-circle">
                <svg viewBox="0 0 24 24">
                  <path d="M12 2 4 5v6c0 5 3.4 9.3 8 11 4.6-1.7 8-6 8-11V5l-8-3Z" />
                  <path d="M9 12h6" />
                </svg>
              </div>
              <h3>Transporte informal</h3>
              <p>Sin validación previa del conductor ni protocolos claros de entrega y recepción.</p>
            </article>
            <article className="risk-card reveal">
              <div className="icon-circle">
                <svg viewBox="0 0 24 24">
                  <path d="M4 7h3l2-3h6l2 3h3v13H4V7Z" />
                  <circle cx="12" cy="13" r="3.5" />
                </svg>
              </div>
              <h3>Falta de evidencia</h3>
              <p>Sin fotos, checklist, firma o documentos que respalden el estado real del vehículo.</p>
            </article>
            <article className="risk-card reveal">
              <div className="icon-circle">
                <svg viewBox="0 0 24 24">
                  <path d="M12 21s7-5.2 7-12a7 7 0 0 0-14 0c0 6.8 7 12 7 12Z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
              </div>
              <h3>Cero trazabilidad</h3>
              <p>Sin monitoreo GPS, bitácora operativa ni seguimiento profesional del recorrido.</p>
            </article>
          </div>
          <p className="center-note reveal">Millones de traslados al año se hacen sin control ni respaldo profesional.</p>
        </section>

        <section className="section solution-section" id="solucion">
          <div className="section-heading reveal">
            <p className="eyebrow">La solución Ruum Ruum</p>
            <h2>Profesionalizamos cada movimiento de tu vehículo.</h2>
            <p>
              Una app inteligente para solicitar, documentar, monitorear y cerrar traslados con evidencia digital de
              punta a punta.
            </p>
          </div>
          <div className="solution-grid">
            <article className="feature-card reveal">
              <span className="feature-number">01</span>
              <h3>Conductores certificados</h3>
              <p>Verificación de identidad, licencia vigente, capacitación y evaluación continua.</p>
            </article>
            <article className="feature-card reveal">
              <span className="feature-number">02</span>
              <h3>Inspección digital</h3>
              <p>Checklist pre y post traslado con fotos, comentarios, firma y reporte descargable.</p>
            </article>
            <article className="feature-card reveal">
              <span className="feature-number">03</span>
              <h3>GPS en vivo</h3>
              <p>Seguimiento en tiempo real, rutas monitoreadas y alertas durante el traslado.</p>
            </article>
            <article className="feature-card reveal">
              <span className="feature-number">04</span>
              <h3>Asistente inteligente</h3>
              <p>Recordatorios de verificaciones, mantenimiento, seguros y fechas clave del vehículo.</p>
            </article>
          </div>
        </section>

        <section className="section how-section" id="como-funciona">
          <div className="section-heading reveal">
            <p className="eyebrow">Cómo funciona</p>
            <h2>Así de fácil es mover tu vehículo.</h2>
            <p>El usuario lo vive simple. La operación por detrás queda documentada con rigor.</p>
          </div>
          <div className="timeline" aria-label="Proceso de traslado">
            <article className="step reveal">
              <span>1</span>
              <h3>Solicita</h3>
              <p>Captura origen, destino, fecha y datos del vehículo.</p>
            </article>
            <article className="step reveal">
              <span>2</span>
              <h3>Confirma y paga</h3>
              <p>Revisa la tarifa, acepta condiciones y confirma el servicio.</p>
            </article>
            <article className="step reveal">
              <span>3</span>
              <h3>Asignamos conductor</h3>
              <p>Te conectamos con un perfil certificado y verificado.</p>
            </article>
            <article className="step reveal">
              <span>4</span>
              <h3>Inspección inicial</h3>
              <p>Checklist, fotos y firma antes de iniciar el recorrido.</p>
            </article>
            <article className="step reveal">
              <span>5</span>
              <h3>Monitoreo en ruta</h3>
              <p>Sigue el traslado con GPS y soporte operativo.</p>
            </article>
            <article className="step reveal">
              <span>6</span>
              <h3>Cierre digital</h3>
              <p>Inspección final, evidencia y reporte de entrega.</p>
            </article>
          </div>
          <div className="center-action reveal">
            <a className="button button-primary" href="#descarga">
              Probar Ruum Ruum gratis
            </a>
          </div>
        </section>

        <section className="business-section" id="empresas">
          <div className="business-inner">
            <div className="business-copy reveal">
              <p className="eyebrow">Para empresas</p>
              <h2>Controla la movilidad de tu flotilla.</h2>
              <p>
                Dashboard centralizado, reportes por traslado, evidencia descargable, API para operaciones recurrentes y
                planes mensuales para agencias, arrendadoras, talleres y flotillas.
              </p>
              <a className="button button-primary" href="#demo-empresa">
                Conocer planes empresariales
              </a>
            </div>
            <div className="dashboard-preview reveal" aria-label="Vista previa de dashboard empresarial">
              <div className="dash-top">
                <span>Traslados activos</span>
                <strong>18</strong>
              </div>
              <div className="dash-map">
                <span className="route-dot dot-a"></span>
                <span className="route-dot dot-b"></span>
                <span className="route-dot dot-c"></span>
              </div>
              <div className="dash-list">
                <span>Reporte MX-042 listo</span>
                <span>Ruta CDMX - Querétaro monitoreada</span>
                <span>Inspección final pendiente de firma</span>
              </div>
            </div>
          </div>
        </section>

        <section className="section drivers-section" id="conductores">
          <div className="driver-layout">
            <div className="driver-copy reveal">
              <p className="eyebrow">Para conductores</p>
              <h2>Conviértete en conductor certificado Ruum Ruum.</h2>
              <p>
                Accede a clientes verificados, construye reputación con evidencia digital, trabaja con flexibilidad y
                recibe pagos seguros bajo una operación profesional.
              </p>
              <ul className="check-list">
                <li>Clientes y servicios validados.</li>
                <li>Evidencia que protege tu trabajo.</li>
                <li>Protocolos claros para cada traslado.</li>
                <li>Calificaciones y reputación verificable.</li>
              </ul>
            </div>
            <form className="lead-form reveal" id="driver-form" data-form="driver" onSubmit={handleSubmit("driver")}>
              <h3>Registro de certificación</h3>
              <label>
                Nombre completo <input name="nombre" type="text" autoComplete="name" required />
              </label>
              <label>
                Teléfono <input name="telefono" type="tel" autoComplete="tel" required />
              </label>
              <label>
                Ciudad <input name="ciudad" type="text" required />
              </label>
              <label>
                Experiencia
                <select name="experiencia" required defaultValue="">
                  <option value="">Selecciona</option>
                  <option>Menos de 1 año</option>
                  <option>1 a 3 años</option>
                  <option>Más de 3 años</option>
                </select>
              </label>
              <button className="button button-primary" type="submit">
                Quiero certificarme
              </button>
              <FormMessage message={formStatus.driver} />
            </form>
          </div>
        </section>

        <section className="section testimonials-section" id="testimonios">
          <div className="section-heading reveal">
            <p className="eyebrow">Testimonios</p>
            <h2>Confianza que se nota en cada entrega.</h2>
            <p>
              Historias breves de usuarios particulares, empresas y conductores que encontraron control donde antes
              había improvisación.
            </p>
          </div>
          <div className="testimonial-row" aria-label="Testimonios de clientes">
            <article className="testimonial-card reveal">
              <div className="avatar">LC</div>
              <div>
                <strong>Laura Cárdenas</strong>
                <span>CDMX</span>
              </div>
              <p className="stars">★★★★★</p>
              <p>&quot;Me mandaron evidencia antes y después. Pude seguir todo desde el teléfono.&quot;</p>
            </article>
            <article className="testimonial-card reveal">
              <div className="avatar">MR</div>
              <div>
                <strong>Marco Rivas</strong>
                <span>Querétaro</span>
              </div>
              <p className="stars">★★★★★</p>
              <p>&quot;Para nuestra flotilla, el reporte por unidad cambió completamente el control.&quot;</p>
            </article>
            <article className="testimonial-card reveal">
              <div className="avatar">AV</div>
              <div>
                <strong>Ana Vega</strong>
                <span>Toluca</span>
              </div>
              <p className="stars">★★★★★</p>
              <p>&quot;El conductor llegó puntual y el cierre digital me dio mucha tranquilidad.&quot;</p>
            </article>
            <article className="testimonial-card reveal">
              <div className="avatar">JP</div>
              <div>
                <strong>Jorge Pineda</strong>
                <span>Conductor certificado</span>
              </div>
              <p className="stars">★★★★★</p>
              <p>&quot;La evidencia me ayuda a trabajar con más claridad y mejores clientes.&quot;</p>
            </article>
          </div>
        </section>

        <section className="download-section" id="descarga">
          <div className="download-inner">
            <div className="download-copy reveal">
              <p className="eyebrow">Descarga y registro</p>
              <h2>Tu vehículo merece un traslado profesional.</h2>
              <p>
                Descarga Ruum Ruum o déjanos tus datos para enviarte el enlace cuando abramos una nueva zona de
                cobertura.
              </p>
              <div className="store-buttons" aria-label="Tiendas de aplicaciones">
                <a href="#" aria-label="Descargar en App Store">
                  <span>Disponible en</span>
                  <strong>App Store</strong>
                </a>
                <a href="#" aria-label="Descargar en Google Play">
                  <span>Disponible en</span>
                  <strong>Google Play</strong>
                </a>
              </div>
            </div>
            <form className="lead-form compact reveal" data-form="download" onSubmit={handleSubmit("download")}>
              <h3>Recibir enlace</h3>
              <label>
                Email <input name="email" type="email" autoComplete="email" required />
              </label>
              <label>
                Teléfono <input name="telefono" type="tel" autoComplete="tel" required />
              </label>
              <button className="button button-dark" type="submit">
                Quiero probar
              </button>
              <FormMessage message={formStatus.download} />
            </form>
          </div>
        </section>

        <section className="section support-section" id="soporte">
          <div className="section-heading reveal">
            <p className="eyebrow">Soporte y legales</p>
            <h2>Respuestas claras antes de entregar tu vehículo.</h2>
            <p>
              Espacios listos para crecer como páginas internas: blog, soporte, términos, privacidad y planes
              empresariales.
            </p>
          </div>
          <div className="support-grid">
            <a className="support-link reveal" id="blog" href="#">
              Blog y guías
            </a>
            <a className="support-link reveal" href="#">
              Preguntas frecuentes
            </a>
            <a className="support-link reveal" href="#">
              Términos y condiciones
            </a>
            <a className="support-link reveal" href="#">
              Política de privacidad
            </a>
          </div>
        </section>

        <section className="section demo-section" id="demo-empresa">
          <form className="enterprise-form reveal" data-form="enterprise" onSubmit={handleSubmit("enterprise")}>
            <div>
              <p className="eyebrow">Demo empresarial</p>
              <h2>Agenda una conversación para tu operación.</h2>
              <p>Cuéntanos cuántas unidades mueves al mes y te ayudamos a definir un plan.</p>
            </div>
            <div className="form-grid">
              <label>
                Empresa <input name="empresa" type="text" required />
              </label>
              <label>
                Nombre <input name="nombre" type="text" autoComplete="name" required />
              </label>
              <label>
                Email <input name="email" type="email" autoComplete="email" required />
              </label>
              <label>
                Unidades al mes <input name="unidades" type="number" min="1" required />
              </label>
            </div>
            <button className="button button-primary" type="submit">
              Solicitar demo
            </button>
            <FormMessage message={formStatus.enterprise} />
          </form>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <img src="/Logo_Ruum_horizontal.png" alt="MoviliaX Ruum Ruum" />
            <p>Traslado vehicular certificado con evidencia digital y trazabilidad operativa.</p>
          </div>
          <nav aria-label="Enlaces de producto">
            <h3>Producto</h3>
            <a href="#solucion">Ruum Ruum</a>
            <a href="#empresas">MoviliaX Logistics</a>
            <a href="#descarga">App móvil</a>
          </nav>
          <nav aria-label="Enlaces de empresa">
            <h3>Empresa</h3>
            <a href="#blog">Blog</a>
            <a href="#conductores">Conductores</a>
            <a href="#demo-empresa">Planes empresariales</a>
          </nav>
          <nav aria-label="Enlaces de soporte">
            <h3>Soporte</h3>
            <a href="#soporte">FAQ</a>
            <a href="#">Términos</a>
            <a href="#">Privacidad</a>
          </nav>
        </div>
        <div className="footer-bottom">
          <span>© 2026 MoviliaX Ruum Ruum. Todos los derechos reservados.</span>
          <div className="social-links" aria-label="Redes sociales">
            <a href="#" aria-label="LinkedIn">
              in
            </a>
            <a href="#" aria-label="Instagram">
              ig
            </a>
            <a href="#" aria-label="Facebook">
              fb
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
