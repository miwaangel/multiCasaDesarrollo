import { useEffect, useState } from 'react'
import { Carousel, Container } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { casasMock } from '../data/mockData'

export default function Home() {
  const [destacadas, setDestacadas] = useState(casasMock.filter((casa) => casa.destacada))

  useEffect(() => {
    api.get('/casas/destacadas')
      .then(({ data }) => setDestacadas(data.data || data || casasMock.filter((casa) => casa.destacada)))
      .catch(() => {})
  }, [])

  return (
    <Container fluid="lg" className="home-page">
      <Carousel className="property-slider" interval={4500}>
        {destacadas.map((casa) => (
          <Carousel.Item key={casa.id}>
            <img src={casa.imagen_principal || '/images/header-1.svg'} alt={casa.titulo} />
            <Carousel.Caption>
              <h2>{casa.titulo}</h2>
              <p>{casa.ciudad} · ${Number(casa.precio).toLocaleString('es-MX')}</p>
              <Link className="slider-link" to={`/casas/${casa.id}`}>Ver propiedad</Link>
            </Carousel.Caption>
          </Carousel.Item>
        ))}
      </Carousel>

      <section className="welcome-section">
        <div>
          <h1>Bienvenido</h1>
          <p>Conoce casas y residencias seleccionadas en las mejores ubicaciones. Nuestro equipo te acompaña en cada paso de la compra.</p>
          <Link className="primary-link" to="/buscar">Buscar propiedades</Link>
        </div>
        <div className="welcome-collage" aria-label="Collage de propiedades">
          {casasMock.slice(0, 4).map((casa) => (
            <img key={casa.id} src={casa.imagen_principal} alt={casa.titulo} />
          ))}
        </div>
      </section>

      <section className="services-section">
        <h2>Servicios destacados</h2>
        <div className="service-grid">
          <article><h3>Venta de casas</h3><p>Propiedades verificadas y asesoría profesional.</p><Link to="/buscar">Ver Más...</Link></article>
          <article><h3>Compra segura</h3><p>Información clara y acompañamiento durante el proceso.</p><Link to="/buscar">Ver Más...</Link></article>
          <article><h3>Asesoría personalizada</h3><p>Encuentra una propiedad según tus necesidades.</p><Link to="/contacto">Ver Más...</Link></article>
        </div>
      </section>
    </Container>
  )
}
