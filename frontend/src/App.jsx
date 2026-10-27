import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router';
import packageInfo from '../package.json';
import Home from './Home.jsx';
import Login from './Login.jsx';
import HelloWorld from './HelloWorld.jsx';
import People from './People.jsx';
import Database from './Database.jsx';
import Specifications from './Specifications.jsx';
import Chatbot from './Chatbot.jsx';
import TradingSimulator from './SharedBitcoinTracker.jsx';
import MarketTracker from './MarketTracker.jsx';
import SimulatorGate from './SimulatorGate.jsx';
import { AuthProvider, AuthRouteCheck } from './AuthContext.jsx';
import WeatherDemo from './WeatherDemo.jsx';
import ComponentGallery from './ComponentGallery.jsx';

const destinations = [
  { to: '/', label: 'Home' },
  { to: '/weather', label: 'Weather demo' },
  { to: '/components', label: 'Component gallery' },
  { to: '/login', label: 'Login' },
  { to: '/people', label: 'People' },
  { to: '/database', label: 'Database' },
  { to: '/specifications', label: 'Specifications' },
  { to: '/chatbot', label: 'Chatbot' },
  { to: '/hello-world', label: 'Hello World' },
  { to: '/bitcoin', label: 'Bitcoin Tracker' },
  { to: '/trading-simulator', label: 'Trading Simulator' },
];

export default function App(props) {
  return <AuthProvider api={props.authApi}><AuthRouteCheck/><AppContent {...props}/></AuthProvider>;
}
function AppContent({ loader, authApi, simulationApi, marketApi }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef(null);
  const content = useRef(null);
  const { pathname } = useLocation();

  useEffect(() => {
    setMenuOpen(false);
    content.current?.querySelector('h1')?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [pathname]);

  return <main className="app-shell">
    <header className="app-shell__header">
      <div className="app-shell__header-start">
        <div className="app-shell__navigation" onKeyDown={event => {
          if (event.key === 'Escape' && menuOpen) {
            event.preventDefault();
            setMenuOpen(false);
            menuButton.current?.focus();
          }
        }}>
          <button ref={menuButton} type="button" className="button app-shell__menu-toggle" aria-label="Menu"
            aria-expanded={menuOpen} aria-controls="main-navigation" onClick={() => setMenuOpen(open => !open)}>
            <span className="app-shell__hamburger" aria-hidden="true"><span /><span /><span /></span>
          </button>
          <nav className="app-shell__menu" id="main-navigation" aria-label="Main navigation" hidden={!menuOpen}>
            {destinations.map(({ to, label }) => <NavLink className={({ isActive }) => `app-shell__menu-link${isActive ? ' app-shell__menu-link--active' : ''}`} key={to} to={to} end
              onClick={() => setMenuOpen(false)}>{label}</NavLink>)}
          </nav>
        </div>
        <Link to="/" className="app-shell__brand" aria-label="Demo application home"><span className="app-shell__brand-icon">◒</span> DEMO LAB</Link>
      </div>
      <span className="app-shell__version">ITERATION 02 <span>v{packageInfo.version}</span></span>
    </header>

    <div ref={content} className="app-shell__content">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/weather" element={<WeatherDemo loader={loader} />} />
        <Route path="/components" element={<ComponentGallery />} />
        <Route path="/login" element={<Login api={authApi} />} />
        <Route path="/people" element={<People />} />
        <Route path="/database" element={<Database />} />
        <Route path="/specifications" element={<Specifications />} />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/hello-world" element={<HelloWorld />} />
        <Route path="/bitcoin" element={<MarketTracker api={marketApi} />} />
        <Route path="/trading-simulator" element={<SimulatorGate><TradingSimulator api={simulationApi}/></SimulatorGate>} />
        <Route path="*" element={<section className="page-intro">
          <p className="text__eyebrow">404</p>
          <h1 className="page-intro__title" id="page-heading" tabIndex={-1}>Page not found.</h1>
          <p className="page-intro__subtitle">This demo does not have a page at this address.</p>
          <Link className="text__link" to="/">Back to Home →</Link>
        </section>} />
      </Routes>
    </div>

    <footer className="app-shell__footer">
      <p><span>React {React.version}</span> <i>→</i> {pathname === '/specifications' ? 'SDD → Bundled specifications' : pathname === '/trading-simulator' ? 'Java API → Authorized simulation' : pathname === '/bitcoin' ? 'Binance public quotes' : ['/people', '/database'].includes(pathname) ? 'Java API → PostgreSQL' : pathname === '/chatbot' ? 'Spring AI → OpenRouter' : 'Weather microservice → Provider'}</p>
      <p>Data: {pathname === '/specifications' ? 'Repository specs · build snapshot' : pathname === '/chatbot' ? 'OpenRouter · free text models' : pathname === '/database' ? 'PostgreSQL schemas and tables' : pathname === '/people' ? 'PostgreSQL shared people list' : ['/bitcoin', '/trading-simulator'].includes(pathname)
        ? <a href="https://www.binance.com/en/trade/BTC_USDT" target="_blank" rel="noreferrer">Binance</a>
        : <><a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a> / <a href="https://www.met.no/" target="_blank" rel="noreferrer">MET Norway</a></>} <span className="app-shell__footer-note">{pathname === '/specifications' ? '· Read-only source' : pathname === '/database' ? '· Values returned by PostgreSQL' : '· Times in Buenos Aires'}</span></p>
    </footer>
  </main>;
}




