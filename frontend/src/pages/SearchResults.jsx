import { useEffect, useState } from 'react'
import { Container } from 'react-bootstrap'
import { Link, useSearchParams } from 'react-router-dom'
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import api, { urlArchivo } from '../services/api'
import SearchSidebar from '../components/SearchSidebar'

const CENTRO_INICIAL = [25.6866, -100.3161]
const precio = (valor) => `$${Number(valor).toLocaleString('es-MX')}`

/** Leaflet no mueve el mapa cuando cambian las props: se ajusta a mano a los resultados. */
function AjustarMapa({ casas, centro }) {
  const map = useMap()

  useEffect(() => {
    const puntos = casas.map((casa) => [casa.lat, casa.lng])
    if (centro) puntos.push([centro.lat, centro.lng])
    if (puntos.length === 1) map.setView(puntos[0], 14)
    else if (puntos.length > 1) map.fitBounds(puntos, { padding: [30, 30], maxZoom: 15 })
  }, [map, casas, centro])

  return null
}

export default function SearchResults() {
  const [searchParams] = useSearchParams()
  const consulta = searchParams.toString()
  // Resultado de la última respuesta; mientras no coincida con la consulta actual, está "buscando"
  const [resultado, setResultado] = useState({ consulta: null, casas: [], centro: null, error: '' })

  // El backend filtra todo (GET /api/casas/buscar); aquí solo se muestran los resultados
  useEffect(() => {
    let vigente = true

    api.get('/casas/buscar', { params: Object.fromEntries(new URLSearchParams(consulta)) })
      .then(({ data }) => {
        if (vigente) setResultado({ consulta, casas: data.data, centro: data.centro, error: '' })
      })
      .catch((error) => {
        if (vigente) setResultado({ consulta, casas: [], centro: null, error: error.message })
      })

    return () => { vigente = false }
  }, [consulta])

  const cargando = resultado.consulta !== consulta
  const { casas, centro } = resultado
  const estado = { cargando, error: resultado.error }

  return (
    <Container fluid="lg" className="search-page">
      <div className="search-layout">
        <main className="results-column">
          <div className="results-heading">
            <h1>Resultados de búsqueda</h1>
            <span>{estado.cargando ? 'Buscando...' : `${casas.length} propiedades`}</span>
          </div>
          <div className="property-results">
            {casas.map((casa) => (
              <article className="property-card" key={casa.id}>
                <img src={urlArchivo(casa.portada) || '/images/header-1.svg'} alt={casa.titulo} loading="lazy" decoding="async" />
                <div>
                  <h2>{casa.titulo}</h2>
                  <p>
                    {casa.colonia}, {casa.ciudad} · {casa.recamaras} recámaras · {casa.banos} baños
                    {casa.distanciaKm !== undefined && ` · a ${casa.distanciaKm} km`}
                  </p>
                  <strong>{precio(casa.precio)}</strong>
                  <Link to={`/casas/${casa.id}`}>Ver detalles</Link>
                </div>
              </article>
            ))}
            {!estado.cargando && estado.error && <p className="empty-results" role="alert">{estado.error}</p>}
            {!estado.cargando && !estado.error && casas.length === 0 && (
              <p className="empty-results">No encontramos casas con esos filtros.</p>
            )}
          </div>
          <MapContainer center={CENTRO_INICIAL} zoom={11} scrollWheelZoom className="results-map">
            <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <AjustarMapa casas={casas} centro={centro} />
            {centro && (
              <Circle center={[centro.lat, centro.lng]} radius={centro.radioKm * 1000} pathOptions={{ color: '#1f6fa8', fillOpacity: 0.08 }} />
            )}
            {casas.map((casa) => (
              <Marker key={casa.id} position={[casa.lat, casa.lng]}>
                <Popup>
                  <strong>{casa.titulo}</strong><br />
                  {precio(casa.precio)}<br />
                  <Link to={`/casas/${casa.id}`}>Ver detalles</Link>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </main>
        <SearchSidebar key={consulta} />
      </div>
    </Container>
  )
}
