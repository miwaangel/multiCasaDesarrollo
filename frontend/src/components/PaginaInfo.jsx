import { Container } from 'react-bootstrap'
import { urlArchivo } from '../services/api'

/**
 * Plantilla de las páginas informativas (La Compañía, Servicios, Requisitos, Ayuda, Políticas):
 * encabezado con etiqueta, título, introducción y foto, y debajo el contenido de cada página.
 * La foto es una de las casas de los seeders (la sirve el backend en /uploads/seed).
 */
export default function PaginaInfo({ etiqueta, titulo, intro, foto = '/uploads/seed/casa-05-1.jpg', acciones, children }) {
  return (
    <Container fluid="lg" className="company-page info-page">
      <section className="company-hero">
        <div>
          <p className="company-kicker">{etiqueta}</p>
          <h1>{titulo}</h1>
          <p>{intro}</p>
          {acciones}
        </div>
        <img src={urlArchivo(foto)} alt="" />
      </section>
      {children}
    </Container>
  )
}
