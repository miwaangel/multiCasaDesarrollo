import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import PaginaInfo from '../components/PaginaInfo'

const VALORES = [
  ['Honestidad', 'Publicamos el precio real, los metros reales y los detalles de cada propiedad, también los que no se ven en las fotos.'],
  ['Acompañamiento', 'Un mismo asesor te atiende desde la primera visita hasta la entrega de llaves, y sigue disponible después.'],
  ['Claridad', 'Te explicamos cada trámite, costo y requisito antes de firmar, sin letras chiquitas.'],
  ['Compromiso local', 'Conocemos las colonias de Saltillo, Ramos Arizpe y Monterrey: servicios, escuelas, vialidades y plusvalía.'],
]

/** La Compañía: quiénes somos, misión, visión, valores, cifras del catálogo y video (issue #16). */
export default function Company() {
  const [cifras, setCifras] = useState(null)
  const [hayVideo, setHayVideo] = useState(true)

  // Cifras reales del catálogo (casas en venta y ciudades)
  useEffect(() => {
    api.get('/casas/buscar')
      .then(({ data }) => setCifras({ casas: data.total, ciudades: new Set(data.data.map((c) => c.ciudad)).size }))
      .catch(() => {})
  }, [])

  return (
    <PaginaInfo
      etiqueta="Acerca de nosotros"
      titulo="La Compañía"
      intro="Bienes Raíces MultiCasa es una agencia inmobiliaria del noreste de México. Ayudamos a familias a comprar, vender y construir su casa en Coahuila y Nuevo León, con información clara y un asesor que las acompaña en cada paso."
      acciones={<Link className="primary-link" to="/buscar">Ver propiedades en venta</Link>}
    >
      {cifras && (
        <section className="info-cifras" aria-label="MultiCasa en números">
          <div><strong>{cifras.casas}</strong><span>propiedades en venta hoy</span></div>
          <div><strong>{cifras.ciudades}</strong><span>ciudades con propiedades</span></div>
          <div><strong>1</strong><span>asesor dedicado por cliente</span></div>
        </section>
      )}

      <section className="company-content">
        <article>
          <h2>Quiénes somos</h2>
          <p>
            Somos un equipo de asesores inmobiliarios, valuadores y gestores que conoce el mercado de vivienda
            de la región. Revisamos cada propiedad antes de publicarla: documentos, medidas, servicios y estado
            de la construcción.
          </p>
        </article>
        <article>
          <h2>Misión</h2>
          <p>
            Que cada familia compre o venda su casa con seguridad, sabiendo exactamente qué está pagando y qué
            trámites siguen, en el menor tiempo posible.
          </p>
        </article>
        <article>
          <h2>Visión</h2>
          <p>
            Ser la inmobiliaria de referencia del noreste del país por la confianza de nuestros clientes y la
            calidad de la información que publicamos.
          </p>
        </article>
      </section>

      <section className="info-seccion">
        <h2>Nuestros valores</h2>
        <div className="info-grid">
          {VALORES.map(([titulo, texto]) => (
            <article key={titulo}><h3>{titulo}</h3><p>{texto}</p></article>
          ))}
        </div>
      </section>

      <section className="company-video" id="video">
        <h2>Conoce MultiCasa</h2>
        {hayVideo ? (
          <video controls preload="metadata" onError={() => setHayVideo(false)}>
            <source src="/video/multicasa.mp4" type="video/mp4" onError={() => setHayVideo(false)} />
            Tu navegador no admite video HTML5.
          </video>
        ) : (
          <p className="info-aviso">El video de presentación estará disponible muy pronto.</p>
        )}
      </section>

      <section className="info-cta">
        <p>¿Quieres vender tu casa o tienes dudas sobre una propiedad?</p>
        <Link className="primary-link" to="/contacto">Habla con un asesor</Link>
      </section>
    </PaginaInfo>
  )
}
