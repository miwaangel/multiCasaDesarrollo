import { useEffect, useState } from 'react'
import { Carousel, Container } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import api, { urlArchivo } from '../services/api'
import SearchSidebar from '../components/SearchSidebar'

const precio = (valor) => `$${Number(valor).toLocaleString('es-MX')}`

const SERVICIOS = [
  { titulo: 'Compra de casa', texto: 'Casas, departamentos y terrenos en Saltillo, Ramos Arizpe y el área metropolitana de Monterrey, con fichas técnicas completas y ubicación en el mapa.', link: '/buscar', accion: 'Ver propiedades' },
  { titulo: 'Vende tu casa', texto: 'Valuamos tu propiedad, la publicamos con fotos profesionales y te acompañamos hasta la firma ante notario.', link: '/contacto?asunto=vender', accion: 'Quiero vender' },
  { titulo: 'Créditos y formas de pago', texto: 'Te orientamos con Infonavit, Fovissste, crédito bancario o pago de contado: requisitos, montos y trámites.', link: '/contacto?asunto=informacion', accion: 'Pedir asesoría' },
]

/** Inicio: carrusel de destacadas, bienvenida y servicios. Todo con casas reales de la API. */
export default function Home() {
  const [destacadas, setDestacadas] = useState({ casas: [], cargando: true })

  useEffect(() => {
    api.get('/casas/destacadas')
      .then(({ data }) => setDestacadas({ casas: data.data, cargando: false }))
      .catch(() => setDestacadas({ casas: [], cargando: false }))
  }, [])

  const { casas, cargando } = destacadas

  return (
    <Container fluid="lg" className="home-page">
      <div className="home-layout">
        <div>
          {cargando && <p className="slider-loading" role="status">Cargando propiedades destacadas...</p>}
          <Carousel className="property-slider" interval={4500} indicators={casas.length > 1} controls={casas.length > 1} aria-label="Propiedades destacadas">
            {casas.length === 0 ? (
              <Carousel.Item>
                <img src="/images/header-1.svg" alt="MultiCasa" />
                <Carousel.Caption>
                  <h2>Encuentra tu futura propiedad</h2>
                  <p>Busca por C.P. o ciudad, precio, recámaras y baños.</p>
                  <Link className="slider-link" to="/buscar">Buscar propiedades</Link>
                </Carousel.Caption>
              </Carousel.Item>
            ) : casas.map((casa) => (
              <Carousel.Item key={casa.id}>
                <img src={urlArchivo(casa.portada) || '/images/header-1.svg'} alt={casa.titulo} />
                <Carousel.Caption>
                  <h2>{casa.titulo}</h2>
                  <p>{casa.colonia}, {casa.ciudad} · {precio(casa.precio)}</p>
                  <Link className="slider-link" to={`/casas/${casa.id}`}>Ver propiedad</Link>
                </Carousel.Caption>
              </Carousel.Item>
            ))}
          </Carousel>
        </div>
        <SearchSidebar />
      </div>

      <section className="welcome-section">
        <div>
          <h1>Bienvenido</h1>
          <p>
            En Bienes Raíces MultiCasa te ayudamos a encontrar la casa que buscas en Coahuila y Nuevo León.
            Cada propiedad tiene fotos, ficha técnica descargable en PDF y su ubicación en el mapa, y un asesor
            te acompaña desde la primera visita hasta la entrega de llaves.
          </p>
          <Link className="primary-link" to="/buscar">Buscar propiedades</Link>
        </div>
        {casas.length > 0 && (
          <div className="welcome-collage" aria-label="Propiedades destacadas">
            {casas.slice(0, 4).map((casa) => (
              <Link key={casa.id} to={`/casas/${casa.id}`}>
                <img src={urlArchivo(casa.portada) || '/images/header-1.svg'} alt={casa.titulo} loading="lazy" decoding="async" />
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="services-section">
        <h2>Servicios destacados</h2>
        <div className="service-grid">
          {SERVICIOS.map((s) => (
            <article key={s.titulo}><h3>{s.titulo}</h3><p>{s.texto}</p><Link to={s.link}>{s.accion}...</Link></article>
          ))}
        </div>
      </section>
    </Container>
  )
}
