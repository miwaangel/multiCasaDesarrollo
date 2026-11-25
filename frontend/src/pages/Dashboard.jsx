import { useEffect, useState } from 'react'
import { Container } from 'react-bootstrap'
import { Link, Navigate } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import api from '../services/api'

const COLORES = { venta: '#315f70', vendida: '#a96f31' }

/**
 * Dashboard del administrador con datos reales:
 * - GET /api/admin/dashboard/rangos-precio → barras (casas por rango de precio)
 * - GET /api/admin/dashboard/estatus       → pastel (vendidas vs en venta)
 */
export default function Dashboard() {
  const token = localStorage.getItem('multicasa_token')
  const [datos, setDatos] = useState({ rangos: [], estatus: null, cargando: true, error: '' })

  useEffect(() => {
    if (!token) return
    Promise.all([api.get('/admin/dashboard/rangos-precio'), api.get('/admin/dashboard/estatus')])
      .then(([rangos, estatus]) => setDatos({ rangos: rangos.data.data, estatus: estatus.data.data, cargando: false, error: '' }))
      .catch((error) => setDatos({ rangos: [], estatus: null, cargando: false, error: error.message }))
  }, [token])

  if (!token) return <Navigate to="/admin" replace />

  const { rangos, estatus, cargando, error } = datos
  const pastel = estatus
    ? [
      { nombre: 'En venta', valor: estatus.venta, color: COLORES.venta },
      { nombre: 'Vendidas', valor: estatus.vendida, color: COLORES.vendida },
    ]
    : []
  const porcentaje = (n) => (estatus?.total ? `${Math.round((n / estatus.total) * 100)}%` : '0%')

  return (
    <Container fluid="lg" className="dashboard-page">
      <div className="admin-heading">
        <h1>Dashboard</h1>
        <div><Link className="btn btn-outline-secondary" to="/admin/panel">Volver al panel</Link></div>
      </div>

      {cargando && <p role="status">Cargando datos...</p>}
      {error && <p className="form-status" role="alert">{error}</p>}

      {estatus && (
        <div className="kpi-grid">
          <div><span>Total de casas</span><strong>{estatus.total}</strong></div>
          <div><span>En venta</span><strong style={{ color: COLORES.venta }}>{estatus.venta}</strong><small>{porcentaje(estatus.venta)}</small></div>
          <div><span>Vendidas</span><strong style={{ color: COLORES.vendida }}>{estatus.vendida}</strong><small>{porcentaje(estatus.vendida)}</small></div>
        </div>
      )}

      {!cargando && !error && (
        <div className="chart-grid">
          <section>
            <h2>Casas por rango de precio</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={rangos} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="rango" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(valor) => [valor, 'Casas']} />
                <Bar dataKey="total" name="Casas" fill={COLORES.venta} radius={[4, 4, 0, 0]} label={{ position: 'top' }} />
              </BarChart>
            </ResponsiveContainer>
            <p className="chart-nota">Incluye casas en venta y vendidas.</p>
          </section>
          <section>
            <h2>Vendidas vs en venta</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pastel} dataKey="valor" nameKey="nombre" cx="50%" cy="50%" innerRadius={55} outerRadius={100} label={({ value }) => value}>
                  {pastel.map((item) => <Cell key={item.nombre} fill={item.color} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </section>
        </div>
      )}
    </Container>
  )
}
