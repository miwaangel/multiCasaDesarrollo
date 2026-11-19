import { useEffect, useState } from 'react'
import { Button, Container, Form, Modal, Table } from 'react-bootstrap'
import { Navigate } from 'react-router-dom'
import api from '../services/api'
import { casasMock, noticiasMock } from '../data/mockData'

const emptyCasa = { titulo: '', ciudad: '', codigo_postal: '', precio: '', recamaras: 1, banos: 1, estatus: 'venta', destacada: false, latitud: '', longitud: '' }

export default function AdminPanel() {
  const [casas, setCasas] = useState(casasMock)
  const [noticias, setNoticias] = useState(noticiasMock)
  const [show, setShow] = useState(false)
  const [editing, setEditing] = useState(emptyCasa)
  const token = localStorage.getItem('multicasa_token')

  useEffect(() => {
    if (token) {
      api.get('/admin/casas').then(({ data }) => setCasas(data.data || data)).catch(() => {})
      api.get('/admin/noticias').then(({ data }) => setNoticias(data.data || data)).catch(() => {})
    }
  }, [token])

  if (!token) return <Navigate to="/admin" replace />

  const openCreate = () => { setEditing(emptyCasa); setShow(true) }
  const openEdit = (casa) => { setEditing({ ...casa }); setShow(true) }

  const save = async (event) => {
    event.preventDefault()
    const payload = { ...editing, precio: Number(editing.precio), recamaras: Number(editing.recamaras), banos: Number(editing.banos) }
    try {
      if (editing.id) await api.put(`/admin/casas/${editing.id}`, payload)
      else await api.post('/admin/casas', payload)
    } catch {}
    setCasas((current) => editing.id
      ? current.map((casa) => casa.id === editing.id ? { ...casa, ...payload } : casa)
      : [...current, { ...payload, id: Date.now(), imagen_principal: '/images/header-1.svg' }])
    setShow(false)
  }

  const remove = async (id) => {
    if (!window.confirm('¿Eliminar esta casa?')) return
    try { await api.delete(`/admin/casas/${id}`) } catch {}
    setCasas((current) => current.filter((casa) => casa.id !== id))
  }

  const marcarVendida = async (casa) => {
    const payload = { ...casa, estatus: 'vendida' }
    try { await api.patch(`/admin/casas/${casa.id}`, { estatus: 'vendida' }) } catch {}
    setCasas((current) => current.map((item) => item.id === casa.id ? payload : item))
  }

  const report = () => {
    const rows = [['ID', 'Titulo', 'Ciudad', 'Precio', 'Estatus'], ...casas.map((casa) => [casa.id, casa.titulo, casa.ciudad, casa.precio, casa.estatus])]
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'reporte-casas.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Container fluid="lg" className="admin-page">
      <div className="admin-heading"><h1>Panel de administrador</h1><div><Button onClick={openCreate}>Nueva casa</Button><Button variant="outline-secondary" onClick={report}>Descargar reporte</Button></div></div>
      <h2>Casas</h2>
      <div className="table-responsive"><Table bordered hover>
        <thead><tr><th>Título</th><th>Ciudad</th><th>Precio</th><th>Estatus</th><th>Acciones</th></tr></thead>
        <tbody>{casas.map((casa) => <tr key={casa.id}><td>{casa.titulo}</td><td>{casa.ciudad}</td><td>${Number(casa.precio).toLocaleString('es-MX')}</td><td>{casa.estatus}</td><td><button onClick={() => openEdit(casa)}>Editar</button><button onClick={() => marcarVendida(casa)}>Vender</button><button onClick={() => remove(casa.id)}>Eliminar</button></td></tr>)}</tbody>
      </Table></div>
      <h2>Noticias de última hora</h2>
      <ul>{noticias.map((item) => <li key={item.id}><strong>{item.titulo}</strong> — {item.fecha}</li>)}</ul>

      <Modal show={show} onHide={() => setShow(false)} size="lg">
        <Form onSubmit={save}>
          <Modal.Header closeButton><Modal.Title>{editing.id ? 'Editar casa' : 'Nueva casa'}</Modal.Title></Modal.Header>
          <Modal.Body className="admin-form">
            <Form.Control required placeholder="Título" value={editing.titulo} onChange={(event) => setEditing({ ...editing, titulo: event.target.value })} />
            <Form.Control required placeholder="Ciudad" value={editing.ciudad} onChange={(event) => setEditing({ ...editing, ciudad: event.target.value })} />
            <Form.Control placeholder="C.P." value={editing.codigo_postal} onChange={(event) => setEditing({ ...editing, codigo_postal: event.target.value })} />
            <Form.Control required type="number" placeholder="Precio" value={editing.precio} onChange={(event) => setEditing({ ...editing, precio: event.target.value })} />
            <Form.Control type="number" placeholder="Recámaras" value={editing.recamaras} onChange={(event) => setEditing({ ...editing, recamaras: event.target.value })} />
            <Form.Control type="number" placeholder="Baños" value={editing.banos} onChange={(event) => setEditing({ ...editing, banos: event.target.value })} />
            <Form.Select value={editing.estatus} onChange={(event) => setEditing({ ...editing, estatus: event.target.value })}><option value="venta">En venta</option><option value="vendida">Vendida</option></Form.Select>
            <Form.Check label="Propiedad destacada" checked={Boolean(editing.destacada)} onChange={(event) => setEditing({ ...editing, destacada: event.target.checked })} />
          </Modal.Body>
          <Modal.Footer><Button variant="secondary" onClick={() => setShow(false)}>Cancelar</Button><Button type="submit">Guardar</Button></Modal.Footer>
        </Form>
      </Modal>
    </Container>
  )
}
