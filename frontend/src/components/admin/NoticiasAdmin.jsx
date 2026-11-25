import { useCallback, useEffect, useState } from 'react'
import { Button, Form, Table } from 'react-bootstrap'
import api from '../../services/api'

const VACIA = { titulo: '', resumen: '', contenido: '', activa: true }
const fecha = (iso) => new Date(iso).toLocaleDateString('es-MX', { dateStyle: 'medium' })

/** Noticias de última hora (CRUD en /api/admin/noticias). */
export default function NoticiasAdmin() {
  const [noticias, setNoticias] = useState([])
  const [nueva, setNueva] = useState(VACIA)
  const [errores, setErrores] = useState({})
  const [mensaje, setMensaje] = useState('')

  const cargar = useCallback(() => api.get('/admin/noticias', { params: { limite: 50 } })
    .then(({ data }) => setNoticias(data.data))
    .catch((error) => setMensaje(error.message)), [])

  useEffect(() => { cargar() }, [cargar])

  const cambiar = (event) => {
    const { name, value, type, checked } = event.target
    setNueva((n) => ({ ...n, [name]: type === 'checkbox' ? checked : value }))
    setErrores((e) => ({ ...e, [name]: undefined }))
  }

  const publicar = async (event) => {
    event.preventDefault()
    setMensaje('')
    try {
      await api.post('/admin/noticias', nueva)
      setNueva(VACIA)
      setErrores({})
      await cargar()
    } catch (error) {
      setErrores(Object.fromEntries(error.detalles.map((d) => [d.campo, d.mensaje])))
      setMensaje(error.message)
    }
  }

  const alternarActiva = async (noticia) => {
    try {
      await api.put(`/admin/noticias/${noticia.id}`, { activa: !noticia.activa })
      await cargar()
    } catch (error) {
      setMensaje(error.message)
    }
  }

  const borrar = async (noticia) => {
    if (!window.confirm(`¿Eliminar la noticia "${noticia.titulo}"?`)) return
    try {
      await api.delete(`/admin/noticias/${noticia.id}`)
      await cargar()
    } catch (error) {
      setMensaje(error.message)
    }
  }

  return (
    <section>
      <h2>Noticias de última hora</h2>
      {mensaje && <p className="form-status" role="alert">{mensaje}</p>}
      <Form className="admin-noticia-form" onSubmit={publicar} noValidate>
        <Form.Group>
          <Form.Control name="titulo" placeholder="Título *" maxLength={150} value={nueva.titulo} onChange={cambiar} isInvalid={Boolean(errores.titulo)} />
          <Form.Control.Feedback type="invalid">{errores.titulo}</Form.Control.Feedback>
        </Form.Group>
        <Form.Group>
          <Form.Control name="resumen" placeholder="Resumen (se muestra en la barra lateral) *" maxLength={255} value={nueva.resumen} onChange={cambiar} isInvalid={Boolean(errores.resumen)} />
          <Form.Control.Feedback type="invalid">{errores.resumen}</Form.Control.Feedback>
        </Form.Group>
        <Form.Group className="span-2">
          <Form.Control as="textarea" rows={2} name="contenido" placeholder="Contenido completo (opcional)" value={nueva.contenido} onChange={cambiar} />
        </Form.Group>
        <Form.Check id="noticia-activa" name="activa" label="Publicar de inmediato" checked={nueva.activa} onChange={cambiar} />
        <Button type="submit">Publicar noticia</Button>
      </Form>

      <div className="table-responsive">
        <Table bordered hover size="sm">
          <thead><tr><th>Título</th><th>Fecha</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {noticias.map((n) => (
              <tr key={n.id}>
                <td><strong>{n.titulo}</strong><br /><small>{n.resumen}</small></td>
                <td>{fecha(n.fechaPublicacion)}</td>
                <td>{n.activa ? 'Publicada' : 'Oculta'}</td>
                <td>
                  <button type="button" onClick={() => alternarActiva(n)}>{n.activa ? 'Ocultar' : 'Publicar'}</button>
                  <button type="button" onClick={() => borrar(n)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </section>
  )
}
