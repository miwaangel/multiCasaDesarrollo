import { useEffect, useMemo, useState } from 'react'
import { Container } from 'react-bootstrap'
import { Link, useSearchParams } from 'react-router-dom'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import api from '../services/api'
import { casasMock } from '../data/mockData'
import SearchSidebar from '../components/SearchSidebar'

export default function SearchResults() {
  const [searchParams] = useSearchParams()
  const [casas, setCasas] = useState(casasMock)

  useEffect(() => {
    api.get('/casas', { params: Object.fromEntries(searchParams.entries()) })
      .then(({ data }) => setCasas(data.data || data || casasMock))
      .catch(() => {})
  }, [searchParams])

  const filtered = useMemo(() => casas.filter((casa) => {
    const ubicacion = (searchParams.get('ubicacion') || '').toLowerCase()
    const matchesLocation = !ubicacion
      || casa.ciudad?.toLowerCase().includes(ubicacion)
      || casa.codigo_postal?.includes(ubicacion)
    const matchesMin = !searchParams.get('precio_min') || casa.precio >= Number(searchParams.get('precio_min'))
    const matchesMax = !searchParams.get('precio_max') || casa.precio <= Number(searchParams.get('precio_max'))
    const matchesRooms = !searchParams.get('recamaras') || casa.recamaras >= Number(searchParams.get('recamaras'))
    const matchesBaths = !searchParams.get('banos') || casa.banos >= Number(searchParams.get('banos'))
    const radio = Number(searchParams.get('radio') || 0)
    let matchesRadius = true
    if (radio && ubicacion) {
      const referencia = casas.find((item) =>
        item.ciudad?.toLowerCase().includes(ubicacion)
        || item.codigo_postal?.includes(ubicacion),
      )
      if (referencia?.latitud && referencia?.longitud && casa.latitud && casa.longitud) {
        const toRadians = (value) => value * Math.PI / 180
        const earthRadiusKm = 6371
        const latDistance = toRadians(Number(casa.latitud) - Number(referencia.latitud))
        const lonDistance = toRadians(Number(casa.longitud) - Number(referencia.longitud))
        const a = Math.sin(latDistance / 2) ** 2
          + Math.cos(toRadians(Number(referencia.latitud))) * Math.cos(toRadians(Number(casa.latitud)))
          * Math.sin(lonDistance / 2) ** 2
        const distanceKm = 2 * earthRadiusKm * Math.asin(Math.sqrt(a))
        matchesRadius = distanceKm <= radio
      }
    }
    return matchesLocation && matchesRadius && matchesMin && matchesMax && matchesRooms && matchesBaths
  }), [casas, searchParams])

  const center = filtered.some((casa) => casa.latitud && casa.longitud)
    ? [Number(filtered.find((casa) => casa.latitud)?.latitud), Number(filtered.find((casa) => casa.latitud)?.longitud)]
    : [25.6866, -100.3161]

  return (
    <Container fluid="lg" className="search-page">
      <div className="search-layout">
        <main className="results-column">
          <div className="results-heading"><h1>Resultados de búsqueda</h1><span>{filtered.length} propiedades</span></div>
          <div className="property-results">
            {filtered.map((casa) => (
              <article className="property-card" key={casa.id}>
                <img src={casa.imagen_principal || '/images/header-1.svg'} alt={casa.titulo} />
                <div>
                  <h2>{casa.titulo}</h2>
                  <p>{casa.ciudad} · {casa.recamaras} recámaras · {casa.banos} baños</p>
                  <strong>${Number(casa.precio).toLocaleString('es-MX')}</strong>
                  <Link to={`/casas/${casa.id}`}>Ver detalles</Link>
                </div>
              </article>
            ))}
            {filtered.length === 0 && <p className="empty-results">No encontramos casas con esos filtros.</p>}
          </div>
          <MapContainer center={center} zoom={11} scrollWheelZoom className="results-map">
            <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {filtered.filter((casa) => casa.latitud && casa.longitud).map((casa) => (
              <Marker key={casa.id} position={[Number(casa.latitud), Number(casa.longitud)]}>
                <Popup><strong>{casa.titulo}</strong><br />${Number(casa.precio).toLocaleString('es-MX')}</Popup>
              </Marker>
            ))}
          </MapContainer>
        </main>
        <SearchSidebar />
      </div>
    </Container>
  )
}
