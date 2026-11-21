import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Button } from 'react-bootstrap'
import { noticiasMock } from '../data/mockData'
import api from '../services/api'

export default function SearchSidebar() {
  const navigate = useNavigate()
  const [news, setNews] = useState(noticiasMock)
  const [filters, setFilters] = useState({ ubicacion: '', radio: '', precio_min: '', precio_max: '', recamaras: '', banos: '' })
  const [visitas] = useState(() => {
    const saved = Number(sessionStorage.getItem('multicasa_visitas') || 1284)
    const next = saved + 1
    sessionStorage.setItem('multicasa_visitas', String(next))
    return next
  })
  const [conectados, setConectados] = useState(24)

  useEffect(() => {
    api.get('/noticias').then(({ data }) => setNews(data.data || data || noticiasMock)).catch(() => {})
    const interval = window.setInterval(() => {
      setConectados((current) => 20 + ((current * 7) % 17))
    }, 5000)
    return () => window.clearInterval(interval)
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
          <Form.Select name="radio" value={filters.radio} onChange={update} aria-label="Radio de búsqueda">
            <option value="">Sin rango</option><option value="2">2 km</option><option value="5">5 km</option><option value="10">10 km</option><option value="20">20 km</option>
          </Form.Select>
          <div className="two-fields">
            <Form.Select name="precio_min" value={filters.precio_min} onChange={update} aria-label="Precio mínimo">
              <option value="">Precio desde</option><option value="1000000">$1,000,000</option><option value="2000000">$2,000,000</option><option value="3000000">$3,000,000</option><option value="5000000">$5,000,000</option>
            </Form.Select>
            <Form.Select name="precio_max" value={filters.precio_max} onChange={update} aria-label="Precio máximo">
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
        <div className="news-scroll" aria-live="polite">
          {news.map((item) => <article key={item.id}><time>{item.fecha}</time><strong>{item.titulo}</strong></article>)}
        </div>
      </section>

      <section className="sidebar-block counters">
        <h2>Actividad</h2>
        <div><span>Conectados</span><strong className="odometer">{conectados}</strong></div>
        <div><span>Visitas</span><strong className="odometer">{visitas.toLocaleString('es-MX')}</strong></div>
      </section>
    </aside>
  )
}
