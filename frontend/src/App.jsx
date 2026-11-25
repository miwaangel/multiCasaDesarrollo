import { Link, NavLink, Route, Routes } from 'react-router-dom'
import { Container, Nav, Navbar } from 'react-bootstrap'
import { useState } from 'react'
import Home from './pages/Home'
import SearchResults from './pages/SearchResults'
import PropertyDetail from './pages/PropertyDetail'
import AdminLogin from './pages/AdminLogin'
import AdminPanel from './pages/AdminPanel'
import Contact from './pages/Contact'
import Dashboard from './pages/Dashboard'
import Company from './pages/Company'
import RegistroVisitas from './components/RegistroVisitas'
import ScrollAlCambiar from './components/ScrollAlCambiar'
import Servicios from './pages/Servicios'
import Requisitos from './pages/Requisitos'
import Ayuda from './pages/Ayuda'
import Politicas from './pages/Politicas'
import NoticiaDetalle from './pages/NoticiaDetalle'
import { MENU_SERVICIOS } from './components/menuServicios'
import './App.css'

const headerImages = [
  '/images/header-1.svg',
  '/images/header-2.svg',
  '/images/header-3.svg',
  '/images/header-4.svg',
  '/images/header-5.svg',
]
const currentYear = 2026

function App() {
  const [headerImage] = useState(() => headerImages[Math.floor(Math.random() * headerImages.length)])

  return (
    <div className="site-shell">
      <header className="site-header" style={{ backgroundImage: `linear-gradient(rgba(25, 40, 51, .18), rgba(25, 40, 51, .18)), url(${headerImage})` }}>
        <Container fluid="lg" className="header-content">
          <NavLink className="brand" to="/" aria-label="Inicio MultiCasa">
            <span className="brand-mark">M</span>
            <span><strong>MULTI</strong>CASA</span>
          </NavLink>
          {/* Esquina superior derecha del PSD: teléfono y links Inicio · Buscar · Admin. */}
          <div className="header-tools">
            <a className="header-phone" href="tel:18001234567">Llama al: <strong>1-800-123-4567</strong></a>
            <nav className="header-links" aria-label="Accesos rápidos">
              <NavLink to="/" end>Inicio</NavLink>
              <NavLink to="/buscar">Buscar</NavLink>
              <NavLink to="/admin">Admin.</NavLink>
            </nav>
          </div>
          {/* Menú superior del PSD (con rollover) */}
          <Navbar expand="lg" className="top-navbar" variant="dark">
            <Navbar.Toggle aria-controls="main-navigation" />
            <Navbar.Collapse id="main-navigation">
              <Nav className="ms-auto">
                <NavLink className="nav-link" to="/" end>Inicio</NavLink>
                <NavLink className="nav-link" to="/compania">La Compañía</NavLink>
                <NavLink className="nav-link" to="/servicios">Servicios</NavLink>
                <NavLink className="nav-link" to="/requisitos">Requisitos</NavLink>
                <NavLink className="nav-link" to="/contacto">Contactos</NavLink>
              </Nav>
            </Navbar.Collapse>
          </Navbar>
        </Container>
      </header>

      <RegistroVisitas />
      <ScrollAlCambiar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/buscar" element={<SearchResults />} />
          <Route path="/casas/:id" element={<PropertyDetail />} />
          <Route path="/contacto" element={<Contact />} />
          <Route path="/compania" element={<Company />} />
          <Route path="/servicios" element={<Servicios />} />
          <Route path="/requisitos" element={<Requisitos />} />
          <Route path="/ayuda" element={<Ayuda />} />
          <Route path="/politicas" element={<Politicas />} />
          <Route path="/noticias/:id" element={<NoticiaDetalle />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/panel" element={<AdminPanel />} />
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="*" element={<section className="page-placeholder"><h1>Página no encontrada</h1></section>} />
        </Routes>
      </main>

      <footer className="site-footer">
        <Container fluid="lg">
          <div className="footer-grid">
            <div><strong>Bienes Raíces MultiCasa</strong><p>Tu mejor opción en agencia de bienes raíces.</p></div>
            {/* Mismos enlaces que el pie del PSD */}
            <nav aria-label="Servicios">
              <Link to="/">Inicio</Link>
              {MENU_SERVICIOS.map((enlace) => <Link key={enlace.texto} to={enlace.to}>{enlace.texto}</Link>)}
            </nav>
          </div>
          <nav className="footer-legal" aria-label="Ayuda y políticas">
            <Link to="/ayuda#preguntas">Preguntas frecuentes</Link>
            <Link to="/ayuda#tips">Tips para antes de comprar</Link>
            <Link to="/politicas#calidad">Políticas de calidad</Link>
            <Link to="/politicas#iso">ISO 9001</Link>
            <Link to="/politicas#privacidad">Aviso de privacidad</Link>
          </nav>
          <p className="copyright">Bienes Raíces MultiCasa © {currentYear}</p>
        </Container>
      </footer>
    </div>
  )
}

export default App
