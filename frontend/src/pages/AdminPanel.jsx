import { useEffect, useState } from 'react'
import { Button, Container, Form, Modal, Table } from 'react-bootstrap'
import { Link, Navigate } from 'react-router-dom'
import api from '../services/api'
import { casasMock, noticiasMock } from '../data/mockData'

const emptyCasa = {
  titulo: '', ciudad: '', codigo_postal: '', precio: '', recamaras: 1, banos: 1,
  metros_construidos: '', descripcion: '', estatus: 'venta', destacada: false,
  latitud: '', longitud: '', imagen_principal: '', imagenes_texto: '',
  interiores_texto: '', exteriores_texto: '', formas_pago_texto: '',
}

export default function AdminPanel() {
  const [casas, setCasas] = useState(casasMock)
  const [noticias, setNoticias] = useState(noticiasMock)
  const [show, setShow] = useState(false)
  const [editing, setEditing] = useState(emptyCasa)
  const [noticia, setNoticia] = useState({ titulo: '', fecha: '2026-11-18' })
  const [descargando, setDescargando] = useState('')
  const token = localStorage.getItem('multicasa_token')

  useEffect(() => {
    if (token) {
      api.get('/admin/casas').then(({ data }) => setCasas(data.data || data)).catch(() => {})
      api.get('/admin/noticias').then(({ data }) => setNoticias(data.data || data)).catch(() => {})
    }
  }, [token])

  if (!token) return <Navigate to="/admin" replace />

  const openCreate = () => { setEditing(emptyCasa); setShow(true) }
  const openEdit = (casa) => {
    setEditing({
      ...emptyCasa,
      ...casa,
      imagenes_texto: (casa.imagenes || []).join(', '),
      interiores_texto: (casa.amenidades?.interiores || []).join(', '),
      exteriores_texto: (casa.amenidades?.exteriores || []).join(', '),
      formas_pago_texto: (casa.formas_pago || []).map((pago) => pago.nombre).join(', '),
    })
    setShow(true)
  }

  const save = async (event) => {
    event.preventDefault()
    const imagenes = editing.imagenes_texto.split(',').map((item) => item.trim()).filter(Boolean)
    const interiores = editing.interiores_texto.split(',').map((item) => item.trim()).filter(Boolean)
    const exteriores = editing.exteriores_texto.split(',').map((item) => item.trim()).filter(Boolean)
    const formasPago = editing.formas_pago_texto.split(',').map((item) => item.trim()).filter(Boolean)
    const payload = {
      ...editing,
      precio: Number(editing.precio),
      recamaras: Number(editing.recamaras),
      banos: Number(editing.banos),
      metros_construidos: Number(editing.metros_construidos || 0),
      latitud: editing.latitud ? Number(editing.latitud) : null,
      longitud: editing.longitud ? Number(editing.longitud) : null,
      imagen_principal: editing.imagen_principal || imagenes[0] || '/images/header-1.svg',
      imagenes,
      amenidades: { interiores, exteriores },
      formas_pago: formasPago.map((nombre) => ({ nombre, requisitos: 'Consultar requisitos con el asesor' })),
    }
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

  // Reporte de todas las casas generado por el backend (GET /api/admin/reportes/casas).
  // Lleva el token, así que se pide con axios como blob y se descarga desde el navegador.
  const report = async (formato) => {
    setDescargando(formato)
    try {
      const respuesta = await api.get('/admin/reportes/casas', { params: { formato }, responseType: 'blob' })
      const nombre = respuesta.headers['content-disposition']?.match(/filename="(.+)"/)?.[1] || `reporte-casas.${formato}`
      const url = URL.createObjectURL(respuesta.data)
      const link = document.createElement('a')
      link.href = url
      link.download = nombre
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      window.alert(`No se pudo generar el reporte: ${error.message}`)
    } finally {
      setDescargando('')
    }
  }

  const guardarNoticia = (event) => {
    event.preventDefault()
    if (!noticia.titulo.trim()) return
    setNoticias((current) => [{ id: Date.now(), ...noticia }, ...current])
    setNoticia({ titulo: '', fecha: new Date().toISOString().slice(0, 10) })
  }

  const logout = () => {
    localStorage.removeItem('multicasa_token')
    window.location.assign('/admin')
  }

  return (
    <Container fluid="lg" className="admin-page">
      <div className="admin-heading"><h1>Panel de administrador</h1><div><Button onClick={openCreate}>Nueva casa</Button><Button variant="outline-secondary" disabled={Boolean(descargando)} onClick={() => report('pdf')}>{descargando === 'pdf' ? 'Generando...' : 'Reporte PDF'}</Button><Button variant="outline-secondary" disabled={Boolean(descargando)} onClick={() => report('xlsx')}>{descargando === 'xlsx' ? 'Generando...' : 'Reporte Excel'}</Button><Link className="btn btn-outline-secondary" to="/admin/dashboard">Dashboard</Link><Button variant="danger" onClick={logout}>Cerrar sesión</Button></div></div>
      <h2>Casas</h2>
      <div className="table-responsive"><Table bordered hover>
        <thead><tr><th>Título</th><th>Ciudad</th><th>Precio</th><th>Estatus</th><th>Acciones</th></tr></thead>
        <tbody>{casas.map((casa) => <tr key={casa.id}><td>{casa.titulo}</td><td>{casa.ciudad}</td><td>${Number(casa.precio).toLocaleString('es-MX')}</td><td>{casa.estatus}</td><td><button onClick={() => openEdit(casa)}>Editar</button><button onClick={() => marcarVendida(casa)}>Vender</button><button onClick={() => remove(casa.id)}>Eliminar</button></td></tr>)}</tbody>
      </Table></div>
      <h2>Noticias de última hora</h2>
      <Form className="news-admin-form" onSubmit={guardarNoticia}>
        <Form.Control required placeholder="Título de la noticia" value={noticia.titulo} onChange={(event) => setNoticia({ ...noticia, titulo: event.target.value })} />
        <Form.Control type="date" required value={noticia.fecha} onChange={(event) => setNoticia({ ...noticia, fecha: event.target.value })} />
        <Button type="submit">Publicar noticia</Button>
      </Form>
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
            <Form.Control type="number" placeholder="Metros construidos" value={editing.metros_construidos} onChange={(event) => setEditing({ ...editing, metros_construidos: event.target.value })} />
            <Form.Control placeholder="Latitud" value={editing.latitud} onChange={(event) => setEditing({ ...editing, latitud: event.target.value })} />
            <Form.Control placeholder="Longitud" value={editing.longitud} onChange={(event) => setEditing({ ...editing, longitud: event.target.value })} />
            <Form.Control placeholder="Imagen principal" value={editing.imagen_principal} onChange={(event) => setEditing({ ...editing, imagen_principal: event.target.value })} />
            <Form.Control placeholder="Galería separada por comas" value={editing.imagenes_texto} onChange={(event) => setEditing({ ...editing, imagenes_texto: event.target.value })} />
            <Form.Control as="textarea" rows={2} placeholder="Descripción" value={editing.descripcion} onChange={(event) => setEditing({ ...editing, descripcion: event.target.value })} />
            <Form.Control placeholder="Amenidades interiores separadas por comas" value={editing.interiores_texto} onChange={(event) => setEditing({ ...editing, interiores_texto: event.target.value })} />
            <Form.Control placeholder="Amenidades exteriores separadas por comas" value={editing.exteriores_texto} onChange={(event) => setEditing({ ...editing, exteriores_texto: event.target.value })} />
            <Form.Control placeholder="Formas de pago separadas por comas" value={editing.formas_pago_texto} onChange={(event) => setEditing({ ...editing, formas_pago_texto: event.target.value })} />
            <Form.Select value={editing.estatus} onChange={(event) => setEditing({ ...editing, estatus: event.target.value })}><option value="venta">En venta</option><option value="vendida">Vendida</option></Form.Select>
            <Form.Check label="Propiedad destacada" checked={Boolean(editing.destacada)} onChange={(event) => setEditing({ ...editing, destacada: event.target.checked })} />
          </Modal.Body>
          <Modal.Footer><Button variant="secondary" onClick={() => setShow(false)}>Cancelar</Button><Button type="submit">Guardar</Button></Modal.Footer>
        </Form>
      </Modal>
    </Container>
  )
}
