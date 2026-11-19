import { Container } from 'react-bootstrap'
import { Link } from 'react-router-dom'

export default function Company() {
  return (
    <Container fluid="lg" className="company-page">
      <section className="company-hero">
        <div>
          <p className="company-kicker">Acerca de nosotros</p>
          <h1>La Compañía</h1>
          <p>MultiCasa conecta compradores con viviendas verificadas y asesores inmobiliarios durante todo el proceso.</p>
          <Link className="primary-link" to="/buscar">Buscar una propiedad</Link>
        </div>
        <img src="/psd-export/diseno-completo.png" alt="Diseño original de bienes raíces" />
      </section>

      <section className="company-content">
        <article>
          <h2>Nuestra misión</h2>
          <p>Facilitar la compra y venta de casas con información clara, visitas personalizadas y acompañamiento profesional.</p>
        </article>
        <article>
          <h2>Servicios</h2>
          <ul><li>Venta de propiedades</li><li>Asesoría de compra</li><li>Financiamiento y requisitos</li><li>Agenda de visitas</li></ul>
        </article>
        <article>
          <h2>Promoción</h2>
          <p>Consulta nuestro video informativo y conoce promociones, consejos y beneficios disponibles.</p>
          <Link to="/contacto">Solicitar información</Link>
        </article>
      </section>

      <section className="company-video">
        <h2>Conoce MultiCasa</h2>
        <video controls poster="/psd-export/diseno-completo.png" preload="metadata">
          <source src="/video/multicasa.mp4" type="video/mp4" />
          Tu navegador no admite video HTML5.
        </video>
      </section>
    </Container>
  )
}
