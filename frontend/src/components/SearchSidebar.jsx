import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Form, Button } from 'react-bootstrap'
import api from '../services/api'
import { EVENTO_VISITA } from './RegistroVisitas'

// Mismos nombres que GET /api/casas/buscar (contrato de la API, sección 2.6)
const FILTROS = ['ubicacion', 'radioKm', 'precioMin', 'precioMax', 'recamaras', 'banos']

const fechaNoticia = (iso) => new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
// Contador estilo odómetro del PSD (07899): un cuadro por dígito
const digitos = (valor, minimo) => (valor === null ? '-'.repeat(minimo) : String(valor).padStart(minimo, '0'))
  .split('').map((d, i) => <span key={i}>{d}</span>)

export default function SearchSidebar() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [news, setNews] = useState([])
  // En /buscar el formulario muestra los filtros con los que se hizo la búsqueda
  const [filters, setFilters] = useState(() =>
    Object.fromEntries(FILTROS.map((nombre) => [nombre, searchParams.get(nombre) || ''])))
  const [contador, setContador] = useState({ visitas: null, conectados: null })

  // Noticias activas de la API (GET /api/noticias)
  useEffect(() => {
    api.get('/noticias').then(({ data }) => setNews(data.data)).catch(() => setNews([]))
  }, [])

  // Contador real (GET /api/visitas/resumen): al registrarse una visita y cada 30 s
  useEffect(() => {
    const actualizar = () => api.get('/visitas/resumen').then(({ data }) => setContador(data.data)).catch(() => {})
    actualizar()
    window.addEventListener(EVENTO_VISITA, actualizar)
    const intervalo = window.setInterval(actualizar, 30000)
    return () => {
      window.removeEventListener(EVENTO_VISITA, actualizar)
      window.clearInterval(intervalo)
    }
  }, [])

  const update = (event) => setFilters((current) => ({ ...current, [event.target.name]: event.target.value }))

  const submit = (event) => {
    event.preventDefault()
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    navigate(`/buscar?${params.toString()}`)
  }

  return (
    <aside className="search-sidebar">
      <section className="sidebar-block">
        <h2>Encuentra tu futura propiedad</h2>
        <Form onSubmit={submit}>
          <Form.Control name="ubicacion" value={filters.ubicacion} onChange={update} placeholder="C.P. o ciudad" aria-label="Ciudad o código postal" />
          <Form.Select name="radioKm" value={filters.radioKm} onChange={update} aria-label="Radio de búsqueda">
            <option value="">Sin rango</option><option value="2">2 km</option><option value="5">5 km</option><option value="10">10 km</option><option value="20">20 km</option>
          </Form.Select>
          <div className="two-fields">
            <Form.Select name="precioMin" value={filters.precioMin} onChange={update} aria-label="Precio mínimo">
              <option value="">Precio desde</option><option value="1000000">$1,000,000</option><option value="2000000">$2,000,000</option><option value="3000000">$3,000,000</option><option value="5000000">$5,000,000</option>
            </Form.Select>
            <Form.Select name="precioMax" value={filters.precioMax} onChange={update} aria-label="Precio máximo">
              <option value="">Precio hasta</option><option value="2000000">$2,000,000</option><option value="3000000">$3,000,000</option><option value="5000000">$5,000,000</option><option value="10000000">$10,000,000</option>
            </Form.Select>
          </div>
          <div className="two-fields">
            <Form.Select name="recamaras" value={filters.recamaras} onChange={update} aria-label="Recámaras"><option value="">Recámaras</option><option value="1">1+</option><option value="2">2+</option><option value="3">3+</option><option value="4">4+</option></Form.Select>
            <Form.Select name="banos" value={filters.banos} onChange={update} aria-label="Baños"><option value="">Baños</option><option value="1">1+</option><option value="2">2+</option><option value="3">3+</option><option value="4">4+</option></Form.Select>
          </div>
          <Button type="submit" className="search-button">Buscar</Button>
        </Form>
      </section>

      <section className="sidebar-block">
        <h2>Información de última hora</h2>
        {news.length === 0 ? <p className="news-vacio">Sin noticias por ahora.</p> : (
          // La lista va dos veces para que el desplazamiento vertical sea continuo (se pausa con el mouse)
          <div className="news-scroll">
            <div className={`news-track${news.length > 2 ? ' animada' : ''}`} style={{ '--duracion': `${news.length * 6}s` }}>
              {[...news, ...(news.length > 2 ? news : [])].map((item, i) => (
                <article key={`${item.id}-${i}`} aria-hidden={i >= news.length ? 'true' : undefined}>
                  <time dateTime={item.fechaPublicacion}>{fechaNoticia(item.fechaPublicacion)}</time>
                  <strong>{item.titulo}</strong>
                  <span>{item.resumen}</span>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="sidebar-block counters">
        <h2>Actividad</h2>
        <div><span>Conectados</span><strong className="odometer">{digitos(contador.conectados, 3)}</strong></div>
        <div><span>Visitas</span><strong className="odometer">{digitos(contador.visitas, 5)}</strong></div>
      </section>
    </aside>
  )
}
