import { NavLink, Route, Routes } from 'react-router-dom'
import { Container, Nav, Navbar } from 'react-bootstrap'
import { useEffect, useState } from 'react'
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
          <Route path="/" element={<section className="page-placeholder"><h1>Bienvenido a MultiCasa</h1><p>Catálogo de bienes raíces.</p></section>} />
          <Route path="/buscar" element={<section className="page-placeholder"><h1>Búsqueda de casas</h1></section>} />
          <Route path="/compania" element={<section className="page-placeholder"><h1>La Compañía</h1></section>} />
          <Route path="/contacto" element={<section className="page-placeholder"><h1>Contacto</h1></section>} />
          <Route path="/admin" element={<section className="page-placeholder"><h1>Administración</h1></section>} />
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
