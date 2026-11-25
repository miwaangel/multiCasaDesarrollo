import { useEffect, useState } from 'react'
import { Container } from 'react-bootstrap'
import { Link, useParams } from 'react-router-dom'
import api, { urlArchivo } from '../services/api'

const fechaNoticia = (iso) => new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })

/** "Ver más..." de la Información de última hora: noticia completa (GET /api/noticias/:id). */
export default function NoticiaDetalle() {
  const { id } = useParams()
  const [resultado, setResultado] = useState({ id: null, noticia: null, error: '' })

  useEffect(() => {
    let vigente = true
    api.get(`/noticias/${id}`)
      .then(({ data }) => { if (vigente) setResultado({ id, noticia: data.data, error: '' }) })
      .catch((error) => { if (vigente) setResultado({ id, noticia: null, error: error.message }) })
    return () => { vigente = false }
  }, [id])

  if (resultado.id !== id) {
    return <Container fluid="lg" className="noticia-page"><p className="empty-results">Cargando...</p></Container>
  }
  if (!resultado.noticia) {
    return (
      <Container fluid="lg" className="noticia-page">
        <p className="empty-results" role="alert">{resultado.error || 'La noticia no existe'}</p>
        <Link to="/">Volver al inicio</Link>
      </Container>
    )
  }

  const { noticia } = resultado

  return (
    <Container fluid="lg" className="noticia-page">
      <article className="noticia-detalle">
        <p className="company-kicker">Información de última hora</p>
        <h1>{noticia.titulo}</h1>
        <time dateTime={noticia.fechaPublicacion}>{fechaNoticia(noticia.fechaPublicacion)}</time>
        {noticia.imagenUrl && <img src={urlArchivo(noticia.imagenUrl)} alt={noticia.titulo} />}
        {noticia.contenido.split(/\n+/).filter(Boolean).map((parrafo, i) => <p key={i}>{parrafo}</p>)}
        <Link className="primary-link" to="/">Volver al inicio</Link>
      </article>
    </Container>
  )
}
