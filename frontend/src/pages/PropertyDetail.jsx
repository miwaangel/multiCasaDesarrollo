import { useEffect, useState } from 'react'
import { Container } from 'react-bootstrap'
import { Link, useParams } from 'react-router-dom'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import api, { urlApi, urlArchivo } from '../services/api'

const TIPOS = { casa: 'Casa', departamento: 'Departamento', terreno: 'Terreno' }
const precio = (valor) => `$${Number(valor).toLocaleString('es-MX')}`
const m2 = (valor) => (valor === null || valor === undefined ? '—' : `${Number(valor).toLocaleString('es-MX')} m²`)

/** Detalle público de una casa en venta (GET /api/casas/:id). */
export default function PropertyDetail() {
  const { id } = useParams()
  const [resultado, setResultado] = useState({ id: null, casa: null, error: '' })

  useEffect(() => {
    let vigente = true
    api.get(`/casas/${id}`)
      .then(({ data }) => { if (vigente) setResultado({ id, casa: data.data, error: '' }) })
      .catch((error) => { if (vigente) setResultado({ id, casa: null, error: error.message }) })
    return () => { vigente = false }
  }, [id])

  if (resultado.id !== id) {
    return <Container fluid="lg" className="detail-page"><p className="empty-results">Cargando...</p></Container>
  }
  if (!resultado.casa) {
    return (
      <Container fluid="lg" className="detail-page">
        <p className="empty-results" role="alert">{resultado.error || 'La casa no existe'}</p>
        <Link to="/buscar">Volver a la búsqueda</Link>
      </Container>
    )
  }

  const { casa } = resultado
  const imagenes = casa.imagenes?.length ? casa.imagenes : [{ id: 0, url: null }]
  const interiores = casa.amenidades.filter((a) => a.tipo === 'interior')
  const exteriores = casa.amenidades.filter((a) => a.tipo === 'exterior')

  return (
    <Container fluid="lg" className="detail-page">
      <div className="detail-gallery">
        {imagenes.map((imagen, index) => (
          <img key={imagen.id} src={urlArchivo(imagen.url) || '/images/header-1.svg'} alt={`${casa.titulo} vista ${index + 1}`} loading={index === 0 ? 'eager' : 'lazy'} decoding="async" />
        ))}
      </div>
      <div className="detail-layout">
        <section>
          <p className="status-label">{TIPOS[casa.tipo] ?? casa.tipo} en venta</p>
          <h1>{casa.titulo}</h1>
          <p className="detail-location">{casa.direccion}, {casa.colonia}, {casa.ciudad}, {casa.estado} · C.P. {casa.codigoPostal}</p>
          <strong className="detail-price">{precio(casa.precio)}</strong>
          <p>{casa.descripcion}</p>

          <h2>Ficha técnica</h2>
          <dl className="technical-grid">
            <div><dt>Recámaras</dt><dd>{casa.recamaras}</dd></div>
            <div><dt>Baños</dt><dd>{casa.banos}</dd></div>
            <div><dt>Terreno</dt><dd>{m2(casa.m2Terreno)}</dd></div>
            <div><dt>Construcción</dt><dd>{m2(casa.m2Construccion)}</dd></div>
            <div><dt>Estacionamientos</dt><dd>{casa.estacionamientos}</dd></div>
            <div><dt>Plantas</dt><dd>{casa.plantas}</dd></div>
          </dl>

          <div className="amenities">
            <div><h3>Interior</h3><ul>{interiores.map((a) => <li key={a.id}>{a.nombre}</li>)}</ul></div>
            <div><h3>Exterior</h3><ul>{exteriores.map((a) => <li key={a.id}>{a.nombre}</li>)}</ul></div>
          </div>

          <h2>Formas de pago</h2>
          <ul>
            {casa.formasPago.map((pago) => (
              <li key={pago.id}><strong>{pago.nombre}:</strong> {pago.requisitos}</li>
            ))}
          </ul>
        </section>
        <aside className="detail-actions">
          {/* El PDF lo genera el backend (GET /api/casas/:id/pdf) */}
          <a className="detail-button" href={urlApi(`/casas/${casa.id}/pdf?descargar=1`)}>Descargar ficha en PDF</a>
          <Link className="detail-button interest" to={`/contacto?casa=${casa.id}`}>Me interesa</Link>
        </aside>
      </div>
      <MapContainer center={[casa.lat, casa.lng]} zoom={15} scrollWheelZoom className="detail-map">
        <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={[casa.lat, casa.lng]}><Popup>{casa.titulo}</Popup></Marker>
      </MapContainer>
    </Container>
  )
}
