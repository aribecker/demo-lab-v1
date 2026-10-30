import ConsultationWizard from './ConsultationWizard';
import AdminPanel from './AdminPanel';
import { useEffect, useRef, useState } from 'react';
import './styles.css';

export default function App() {
  const [view, setView] = useState(window.location.hash === '#administracion' ? 'admin' : 'home');
  const apiBase = import.meta.env.VITE_API_URL || '';
  const integrated = import.meta.env.VITE_CONSULTATIONS_API === 'true';
  const [service, setService] = useState('');
  const formHeading = useRef(null);
  useEffect(() => {
    if (view === 'consulta') formHeading.current?.focus({ preventScroll: true });
  }, [view]);
  function go(next, type) {
    if (type) setService(type);
    setView(next);
    window.scrollTo({ top: 0, behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }
  return (<>
<header>
<div className="ms-container">
<div className="ms-header__row">
<div className="ms-brand">MARCELA SCHPILBERG <small>CONTADORA PÚBLICA · CONSULTORÍA CONTABLE PROFESIONAL</small>
</div>
<nav className="ms-navigation" aria-label="Navegación principal">
<button className={view === "home" ? "ms-navigation__button ms-navigation__button--active" : "ms-navigation__button"} type="button" onClick={() => go("home")} aria-current={view === "home" ? "page" : undefined}>Inicio</button>
<button className={view === "consulta" ? "ms-navigation__button ms-navigation__button--active" : "ms-navigation__button"} type="button" onClick={() => go("consulta")} aria-current={view === "consulta" ? "page" : undefined}>Dejar consulta</button>
</nav>
</div>
</div>
</header>
<main>
{view === "admin" && <AdminPanel apiBase={apiBase}/> }
<div id="home" className="ms-view" hidden={view !== "home"}>
<section className="ms-hero-band">
<div className="ms-container ms-hero">
<div>
<div className="ms-eyebrow">Asesoramiento contable especializado</div>
<h1 className="ms-heading ms-heading--ink">Respuestas profesionales para tus consultas contables.</h1>
<p>Dejá tu consulta por escrito. La analizamos y te respondemos dentro de los 7 días corridos desde su recepción.</p>
<div className="ms-hero__actions">
<button className="ms-button" type="button" onClick={() => go("consulta", null)}>Enviar una consulta</button>
<a className="ms-button ms-button--secondary" href="#precios">Ver tarifas</a>
</div>
</div>
<aside className="ms-hero__aside">
<span className="ms-eyebrow">Plan de consultas</span>
<strong>$ 10.000</strong>
<p>1 consulta por semana</p>
<hr className="ms-divider" />
<p className="ms-text ms-text--tiny">Los trabajos profesionales específicos se presupuestan por separado según alcance y complejidad.</p>
</aside>
</div>
</section>
<section className="ms-section">
<div className="ms-container">
<div className="ms-section__heading">
<h2>Áreas de consulta</h2>
<p>Elegí la especialidad que corresponda. Cada solicitud se analiza de manera individual.</p>
</div>
<div className="ms-card-grid">
<article className="ms-card">
<div className="ms-card__number">01</div>
<h3>Auditoría y contabilidad</h3>
<p>Registraciones contables, análisis de saldos, confección de estados contables, criterios de exposición y cuestiones de auditoría.</p>
</article>
<article className="ms-card">
<div className="ms-card__number">02</div>
<h3>Pericias contables</h3>
<p>Consultas sobre puntos de pericia, documentación respaldatoria, informes periciales, liquidaciones y actuaciones judiciales.</p>
</article>
<article className="ms-card">
<div className="ms-card__number">03</div>
<h3>Gestión de trámites</h3>
<p>Orientación sobre gestiones ante organismos, inscripciones, presentaciones y procedimientos administrativos.</p>
</article>
</div>
</div>
</section>
<section id="precios" className="ms-section ms-section--pricing">
<div className="ms-container">
<div className="ms-section__heading">
<h2>Honorarios transparentes</h2>
<p>Podés realizar una consulta puntual dentro del abono semanal o solicitar un presupuesto para un trabajo concreto.</p>
</div>
<div className="ms-price-grid">
<article className="ms-price ms-price--featured">
<span className="ms-pill">Abono de consultas</span>
<h3 className="ms-price__heading">1 consulta por semana</h3>
<div className="ms-price__amount">$ 10.000 <span className="ms-price__period">ARS / semana</span>
</div>
<ul>
<li>Una consulta por escrito por semana.</li>
<li>Respuesta dentro de los 7 días corridos.</li>
<li>Orientación y asesoramiento sobre el tema planteado.</li>
</ul>
<button className="ms-button" type="button" onClick={() => go("consulta", "Abono semanal")}>Solicitar consulta</button>
</article>
<article className="ms-price">
<span className="ms-pill">Presupuesto individual</span>
<h3 className="ms-price__heading">Trabajos profesionales</h3>
<div className="ms-price__amount ms-price__amount--quote">A convenir</div>
<ul>
<li>Confección de estados contables, auditorías y otros trabajos.</li>
<li>Informes y tareas periciales contables.</li>
<li>Gestiones específicas y trámites.</li>
</ul>
<p className="ms-text ms-text--fine">El presupuesto depende de la complejidad, documentación disponible y alcance del trabajo.</p>
<button className="ms-button" type="button" onClick={() => go("consulta", "Presupuesto de trabajo")}>Pedir presupuesto</button>
</article>
</div>
</div>
</section>
<section className="ms-section">
<div className="ms-container">
<h2>Cómo funciona</h2>
<div className="ms-card-grid">
<div className="ms-card">
<h3>1. Completás el formulario</h3>
<p>Indicás tus datos, elegís el área y describís la consulta.</p>
</div>
<div className="ms-card">
<h3>2. Revisamos la solicitud</h3>
<p>Evaluamos el planteo y, si corresponde, el alcance del trabajo a presupuestar.</p>
</div>
<div className="ms-card">
<h3>3. Recibís la respuesta</h3>
<p>En el plan de consultas, el plazo ofrecido es de hasta 7 días corridos desde la recepción.</p>
</div>
</div>
<div className="ms-faq">
<details>
<summary>¿Un trabajo completo está incluido en el abono?</summary>
<p>No. El abono cubre la respuesta a una consulta por semana. La ejecución de trabajos, informes y gestiones se presupuesta por separado.</p>
</details>
<details>
<summary>¿Cómo se contrata y se paga?</summary>
<p>La modalidad de contratación y pago se confirmará con el estudio. El sitio no procesa pagos. La contratación y las condiciones de pago se confirmarán por correo.</p>
</details>
</div>
</div>
</section>
</div>
<div id="consulta" className="ms-view" hidden={view !== "consulta"}>
<section className="ms-section">
<div className="ms-container">
<div className="ms-section__heading">
<h2 ref={formHeading} tabIndex={-1}>Dejá tu consulta</h2>
<p>Describí tu situación con claridad. No incluyas contraseñas, datos bancarios ni información confidencial de terceros.</p>
</div>
{integrated ? <ConsultationWizard apiBase={apiBase}/> : <div className="ms-form-layout">
<div className="ms-panel">
<form id="form" action="https://formsubmit.co/conta.conmigo.1234@gmail.com" method="POST">
<input type="hidden" name="_subject" value="Nueva consulta contable desde la plataforma" />
<input type="hidden" name="_template" value="table" />
<input type="hidden" name="_autoresponse" value="Recibimos tu consulta. Revisaremos tu solicitud y nos comunicaremos por correo electrónico. El plazo de hasta 7 días corridos aplica a las consultas del abono, una vez confirmada su contratación. Este mensaje es automático." />
<input type="text" name="_honey" tabIndex="-1" autoComplete="off" className="ms-honeypot" />
<div className="ms-form-grid">
<div className="ms-field">
<label htmlFor="nombre">Nombre y apellido *</label>
<input id="nombre" name="nombre" autoComplete="name" maxLength="120" required />
</div>
<div className="ms-field">
<label htmlFor="email">Correo electrónico *</label>
<input id="email" name="email" type="email" autoComplete="email" maxLength="200" required />
</div>
</div>
<div className="ms-form-grid">
<div className="ms-field">
<label htmlFor="area">Área de consulta *</label>
<select id="area" name="area" required>
<option value="">Seleccionar área</option>
<option>Auditoría y contabilidad (estados contables)</option>
<option>Pericias contables</option>
<option>Gestión de trámites</option>
</select>
</div>
<div className="ms-field">
<label htmlFor="servicio">Tipo de solicitud *</label>
<select id="servicio" name="servicio" required value={service} onChange={event => setService(event.target.value)}>
<option value="">Seleccionar opción</option>
<option>Abono semanal</option>
<option>Presupuesto de trabajo</option>
</select>
</div>
</div>
<div className="ms-field">
<label htmlFor="asunto">Asunto *</label>
<input id="asunto" name="asunto" maxLength="180" required placeholder="Ej.: Consulta sobre confección de balance" />
</div>
<div className="ms-field">
<label htmlFor="mensaje">Detalle de la consulta *</label>
<textarea id="mensaje" name="mensaje" required minLength="20" maxLength="5000" placeholder="Explicá qué necesitás resolver, los antecedentes y el resultado que esperás.">
</textarea>
</div>
<label className="ms-consent">
<input type="checkbox" id="acepto" required name="consentimiento" value="Aceptado" />
<span className="ms-text ms-text--fine">Acepto que mis datos se utilicen para responder esta solicitud. Autorizo el envío de mi consulta mediante un proveedor externo de formularios para que el estudio pueda responderme por correo.</span>
</label>
<button className="ms-button" type="submit">Enviar consulta por correo</button>
</form>
</div>
<aside className="ms-panel">
<h3>Plazo de respuesta</h3>
<p>Hasta 7 días corridos para las consultas del abono, una vez recibidas por el estudio.</p>
<h3>Honorarios</h3>
<p>
<b>$ 10.000 por semana</b> por una consulta. Los trabajos particulares tienen presupuesto a convenir.</p>
<hr className="ms-divider" />
<p className="ms-text ms-text--fine">El formulario utiliza el servicio externo FormSubmit para enviar las consultas al correo del estudio. El destinatario debe activar FormSubmit antes de recibir consultas. No envíes información sensible ni documentación confidencial por este formulario.</p>
</aside>
</div>}
</div>
</section>
</div>
</main>
<footer>
<div className="ms-container ms-footer__row">
<div>© <span id="year">{new Date().getFullYear()}</span> Marcela Schpilberg. Plataforma de consultas.</div>
<div>Atención por escrito · Auditoría · Pericias · Trámites</div>
</div>
</footer>

</>);
}
