import { useEffect, useState } from 'react'
import { Container } from 'react-bootstrap'
import { Navigate } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import api from '../services/api'
import { casasMock } from '../data/mockData'

export default function Dashboard() {
  const token = localStorage.getItem('multicasa_token')
  const [casas, setCasas] = useState(casasMock)

  useEffect(() => {
    if (token) {
      api.get('/dashboard')
        .then(({ data }) => {
          const payload = data.data || data
          if (Array.isArray(payload)) setCasas(payload)
          else if (Array.isArray(payload?.casas)) setCasas(payload.casas)
        })
        .catch(() => {})
    }
  }, [token])

  if (!token) return <Navigate to="/admin" replace />

  const rangos = [
    { nombre: 'Menos de $2M', cantidad: casas.filter((casa) => casa.precio < 2000000).length },
    { nombre: '$2M a $3M', cantidad: casas.filter((casa) => casa.precio >= 2000000 && casa.precio < 3000000).length },
    { nombre: '$3M a $5M', cantidad: casas.filter((casa) => casa.precio >= 3000000 && casa.precio < 5000000).length },
    { nombre: '$5M o más', cantidad: casas.filter((casa) => casa.precio >= 5000000).length },
  ]
  const estatus = [
    { name: 'En venta', value: casas.filter((casa) => casa.estatus === 'venta').length, color: '#315f70' },
    { name: 'Vendidas', value: casas.filter((casa) => casa.estatus === 'vendida').length, color: '#a96f31' },
  ]

  return (
    <Container fluid="lg" className="dashboard-page">
      <h1>Dashboard</h1>
      <div className="chart-grid">
        <section>
          <h2>Casas por rango de precio</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={rangos}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="nombre" /><YAxis allowDecimals={false} /><Tooltip /><Legend />
              <Bar dataKey="cantidad" name="Casas" fill="#315f70" />
            </BarChart>
          </ResponsiveContainer>
        </section>
        <section>
          <h2>Vendidas vs en venta</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={estatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {estatus.map((item) => <Cell key={item.name} fill={item.color} />)}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </section>
      </div>
    </Container>
  )
}
