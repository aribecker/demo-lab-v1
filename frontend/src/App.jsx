import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router';
import packageInfo from '../package.json';
import Home from './Home.jsx';
import Login from './Login.jsx';
import HelloWorld from './HelloWorld.jsx';
import BitcoinTracker from './SharedBitcoinTracker.jsx';
import WeatherDemo from './WeatherDemo.jsx';
import ComponentGallery from './ComponentGallery.jsx';

const destinations = [
  { to: '/', label: 'Home' },
  { to: '/weather', label: 'Weather demo' },
  { to: '/components', label: 'Component gallery' },
  { to: '/login', label: 'Login' },
  { to: '/hello-world', label: 'Hello World' },
  { to: '/bitcoin', label: 'Bitcoin tracker' },
];

export default function App({ loader, authApi, simulationApi }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef(null);
  const content = useRef(null);
  const { pathname } = useLocation();

  useEffect(() => {
    setMenuOpen(false);
    content.current?.querySelector('h1')?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [pathname]);

  return <main className="page">
    <header className="masthead">
      <div className="header-start">
        <div className="navigation" onKeyDown={event => {
          if (event.key === 'Escape' && menuOpen) {
            event.preventDefault();
            setMenuOpen(false);
            menuButton.current?.focus();
          }
        }}>
          <button ref={menuButton} type="button" className="menu-toggle" aria-label="Menu"
            aria-expanded={menuOpen} aria-controls="main-navigation" onClick={() => setMenuOpen(open => !open)}>
            <span className="hamburger" aria-hidden="true"><span /><span /><span /></span>
          </button>
          <nav id="main-navigation" aria-label="Main navigation" hidden={!menuOpen}>
            {destinations.map(({ to, label }) => <NavLink key={to} to={to} end
              onClick={() => setMenuOpen(false)}>{label}</NavLink>)}
          </nav>
        </div>
        <Link to="/" className="brand" aria-label="Demo application home"><span className="brand-icon">◒</span> DEMO LAB</Link>
      </div>
      <span className="version">ITERATION 02 <span>v{packageInfo.version}</span></span>
    </header>

    <div ref={content} className="route-content">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/weather" element={<WeatherDemo loader={loader} />} />
        <Route path="/components" element={<ComponentGallery />} />
        <Route path="/login" element={<Login api={authApi} />} />
        <Route path="/hello-world" element={<HelloWorld />} />
        <Route path="/bitcoin" element={<BitcoinTracker api={simulationApi} />} />
        <Route path="*" element={<section className="intro">
          <p className="eyebrow">404</p>
          <h1 id="page-heading" tabIndex={-1}>Page not found.</h1>
          <p className="subtitle">This demo does not have a page at this address.</p>
          <Link className="text-link" to="/">Back to Home →</Link>
        </section>} />
      </Routes>
    </div>

    <footer>
      <p><span>React {React.version}</span> <i>→</i> {pathname === '/bitcoin' ? 'Binance public quotes' : 'Weather microservice → Provider'}</p>
      <p>Data: {pathname === '/bitcoin'
        ? <a href="https://www.binance.com/en/trade/BTC_USDT" target="_blank" rel="noreferrer">Binance</a>
        : <><a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a> / <a href="https://www.met.no/" target="_blank" rel="noreferrer">MET Norway</a></>} <span className="footer-note">· Times in Buenos Aires</span></p>
    </footer>
  </main>;
}




