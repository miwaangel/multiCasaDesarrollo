import { useCallback, useEffect, useState } from 'react'
import { Button, Container, Form, Table } from 'react-bootstrap'
import { Link, Navigate } from 'react-router-dom'
import api, { urlArchivo } from '../services/api'
import CasaFormModal from '../components/admin/CasaFormModal'
import NoticiasAdmin from '../components/admin/NoticiasAdmin'

const LIMITE = 10
const precio = (valor) => `$${Number(valor).toLocaleString('es-MX')}`

/** Panel del administrador: casas (CRUD, vender, reportes) y noticias. Todo contra /api/admin. */
export default function AdminPanel() {
  const token = localStorage.getItem('multicasa_token')
  const [filtros, setFiltros] = useState({ estatus: '', busqueda: '', pagina: 1 })
  const [listado, setListado] = useState({ casas: [], total: 0, cargando: true })
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' })
  const [modal, setModal] = useState({ show: false, casaId: null })
  const [descargando, setDescargando] = useState('')

  const cargar = useCallback(() => {
    const params = { pagina: filtros.pagina, limite: LIMITE }
    if (filtros.estatus) params.estatus = filtros.estatus
    if (filtros.busqueda.trim()) params.busqueda = filtros.busqueda.trim()
    return api.get('/admin/casas', { params })
      .then(({ data }) => setListado({ casas: data.data, total: data.total, cargando: false }))
      .catch((error) => {
        setListado({ casas: [], total: 0, cargando: false })
        setMensaje({ tipo: 'error', texto: error.message })
      })
  }, [filtros])

  useEffect(() => {
    if (token) cargar()
  }, [token, cargar])

  if (!token) return <Navigate to="/admin" replace />

  const paginas = Math.max(1, Math.ceil(listado.total / LIMITE))
  const filtrar = (cambio) => setFiltros((f) => ({ ...f, ...cambio, pagina: cambio.pagina ?? 1 }))
  const avisar = (texto, tipo = 'ok') => setMensaje({ tipo, texto })

  const guardada = async (casa) => {
    setModal({ show: false, casaId: null })
    await cargar()
    avisar(`Casa "${casa.titulo}" guardada.`)
  }

  const cambiarEstatus = async (casa) => {
    const estatus = casa.estatus === 'venta' ? 'vendida' : 'venta'
    try {
      await api.patch(`/admin/casas/${casa.id}/estatus`, { estatus })
      await cargar()
      avisar(estatus === 'vendida' ? `"${casa.titulo}" marcada como vendida.` : `"${casa.titulo}" regresó a venta.`)
    } catch (error) {
      avisar(error.message, 'error')
    }
  }

  const eliminar = async (casa) => {
    if (!window.confirm(`¿Eliminar "${casa.titulo}"? Se borran también sus imágenes. No se puede deshacer.`)) return
    try {
      await api.delete(`/admin/casas/${casa.id}`)
      avisar(`"${casa.titulo}" eliminada.`)
      // Si era la última de la página, regresa a la anterior
      if (listado.casas.length === 1 && filtros.pagina > 1) filtrar({ pagina: filtros.pagina - 1 })
      else cargar()
    } catch (error) {
      avisar(error.message, 'error')
    }
  }

  // Reporte de todas las casas generado por el backend (GET /api/admin/reportes/casas).
  // Lleva el token, así que se pide con axios como blob y se descarga desde el navegador.
  const report = async (formato) => {
    setDescargando(formato)
    try {
      const respuesta = await api.get('/admin/reportes/casas', { params: { formato }, responseType: 'blob', timeout: 60000 })
      const nombre = respuesta.headers['content-disposition']?.match(/filename="(.+)"/)?.[1] || `reporte-casas.${formato}`
      const url = URL.createObjectURL(respuesta.data)
      const link = document.createElement('a')
      link.href = url
      link.download = nombre
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      avisar(`No se pudo generar el reporte: ${error.message}`, 'error')
    } finally {
      setDescargando('')
    }
  }

  const logout = () => {
    localStorage.removeItem('multicasa_token')
    window.location.assign('/admin')
  }

  return (
    <Container fluid="lg" className="admin-page">
      <div className="admin-heading">
        <h1>Panel de administrador</h1>
        <div>
          <Button onClick={() => setModal({ show: true, casaId: null })}>Nueva casa</Button>
          <Button variant="outline-secondary" disabled={Boolean(descargando)} onClick={() => report('pdf')}>{descargando === 'pdf' ? 'Generando...' : 'Reporte PDF'}</Button>
          <Button variant="outline-secondary" disabled={Boolean(descargando)} onClick={() => report('xlsx')}>{descargando === 'xlsx' ? 'Generando...' : 'Reporte Excel'}</Button>
          <Link className="btn btn-outline-secondary" to="/admin/dashboard">Dashboard</Link>
          <Button variant="danger" onClick={logout}>Cerrar sesión</Button>
        </div>
      </div>

      {mensaje.texto && (
        <p className="form-status" role={mensaje.tipo === 'error' ? 'alert' : 'status'}>
          {mensaje.texto} <button type="button" className="admin-cerrar" onClick={() => setMensaje({ tipo: '', texto: '' })} aria-label="Cerrar">×</button>
        </p>
      )}

      <h2>Casas <small>({listado.total})</small></h2>
      <Form className="admin-filtros" onSubmit={(event) => { event.preventDefault(); cargar() }}>
        <Form.Control placeholder="Buscar por título o colonia" value={filtros.busqueda} onChange={(event) => filtrar({ busqueda: event.target.value })} />
        <Form.Select value={filtros.estatus} onChange={(event) => filtrar({ estatus: event.target.value })} aria-label="Estatus">
          <option value="">Todas</option><option value="venta">En venta</option><option value="vendida">Vendidas</option>
        </Form.Select>
      </Form>

      <div className="table-responsive">
        <Table bordered hover className="admin-tabla">
          <thead><tr><th>Foto</th><th>Título</th><th>Ciudad</th><th>Precio</th><th>Estatus</th><th>Acciones</th></tr></thead>
          <tbody>
            {listado.casas.map((casa) => (
              <tr key={casa.id} className={casa.estatus === 'vendida' ? 'vendida' : undefined}>
                <td>{casa.portada ? <img src={urlArchivo(casa.portada)} alt="" loading="lazy" /> : '—'}</td>
                <td>{casa.titulo}{casa.destacada && <span className="admin-badge">Destacada</span>}</td>
                <td>{casa.ciudad}</td>
                <td>{precio(casa.precio)}</td>
                <td>{casa.estatus === 'venta' ? 'En venta' : `Vendida${casa.fechaVenta ? ` (${casa.fechaVenta})` : ''}`}</td>
                <td>
                  <button type="button" onClick={() => setModal({ show: true, casaId: casa.id })}>Editar</button>
                  <button type="button" onClick={() => cambiarEstatus(casa)}>{casa.estatus === 'venta' ? 'Vender' : 'Regresar a venta'}</button>
                  <button type="button" className="peligro" onClick={() => eliminar(casa)}>Eliminar</button>
                </td>
              </tr>
            ))}
            {!listado.cargando && listado.casas.length === 0 && (
              <tr><td colSpan={6}>No hay casas con esos filtros.</td></tr>
            )}
          </tbody>
        </Table>
      </div>
      {paginas > 1 && (
        <div className="admin-paginacion">
          <Button size="sm" variant="outline-secondary" disabled={filtros.pagina <= 1} onClick={() => filtrar({ pagina: filtros.pagina - 1 })}>Anterior</Button>
          <span>Página {filtros.pagina} de {paginas}</span>
          <Button size="sm" variant="outline-secondary" disabled={filtros.pagina >= paginas} onClick={() => filtrar({ pagina: filtros.pagina + 1 })}>Siguiente</Button>
        </div>
      )}

      <NoticiasAdmin />

      {modal.show && (
        <CasaFormModal
          key={modal.casaId ?? 'nueva'}
          casaId={modal.casaId}
          onHide={() => setModal({ show: false, casaId: null })}
          onGuardada={guardada}
        />
      )}
    </Container>
  )
}
