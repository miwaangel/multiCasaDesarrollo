import { NavLink, Route, Routes } from 'react-router-dom'
import { Container, Nav, Navbar } from 'react-bootstrap'
import { useEffect, useState } from 'react'
import Home from './pages/Home'
import SearchResults from './pages/SearchResults'
import PropertyDetail from './pages/PropertyDetail'
import AdminLogin from './pages/AdminLogin'
import AdminPanel from './pages/AdminPanel'
import Contact from './pages/Contact'
import Dashboard from './pages/Dashboard'
import './App.css'

function App() {
  const headerImages = ['/images/header-1.svg', '/images/header-2.svg', '/images/header-3.svg', '/images/header-4.svg', '/images/header-5.svg']
  const [headerImage, setHeaderImage] = useState(headerImages[0])

  useEffect(() => {
    setHeaderImage(headerImages[Math.floor(Math.random() * headerImages.length)])
  }, [])

  return (
    <div className="site-shell">
      <header className="site-header" style={{ backgroundImage: `linear-gradient(rgba(25, 40, 51, .18), rgba(25, 40, 51, .18)), url(${headerImage})` }}>
        <Container fluid="lg" className="header-content">
          <NavLink className="brand" to="/" aria-label="Inicio MultiCasa">
            <span className="brand-mark">M</span>
            <span><strong>MULTI</strong>CASA</span>
          </NavLink>
          <Navbar expand="lg" className="top-navbar" variant="dark">
            <Navbar.Toggle aria-controls="main-navigation" />
            <Navbar.Collapse id="main-navigation">
              <Nav className="ms-auto">
                <NavLink className="nav-link" to="/">Inicio</NavLink>
                <NavLink className="nav-link" to="/buscar">Buscar</NavLink>
                <NavLink className="nav-link" to="/compania">La Compañía</NavLink>
                <NavLink className="nav-link" to="/contacto">Contacto</NavLink>
                <NavLink className="nav-link" to="/admin">Admin.</NavLink>
              </Nav>
            </Navbar.Collapse>
          </Navbar>
        </Container>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/buscar" element={<SearchResults />} />
          <Route path="/casas/:id" element={<PropertyDetail />} />
          <Route path="/contacto" element={<Contact />} />
          <Route path="/compania" element={<Contact />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/panel" element={<AdminPanel />} />
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="*" element={<section className="page-placeholder"><h1>Página no encontrada</h1></section>} />
        </Routes>
      </main>

      <footer className="site-footer">
        <Container fluid="lg">
          <div className="footer-grid">
            <div><strong>MultiCasa</strong><p>Encuentra el hogar que buscas.</p></div>
            <nav aria-label="Navegación secundaria">
              <NavLink to="/">Inicio</NavLink>
              <NavLink to="/buscar">Buscar</NavLink>
              <NavLink to="/compania">La Compañía</NavLink>
              <NavLink to="/contacto">Contacto</NavLink>
            </nav>
          </div>
          <p className="copyright">© {new Date().getFullYear()} MultiCasa</p>
        </Container>
      </footer>
    </div>
  )
}

export default App
