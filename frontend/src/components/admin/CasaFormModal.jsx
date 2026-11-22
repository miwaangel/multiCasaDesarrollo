import { useEffect, useState } from 'react'
import { Button, Form, Modal } from 'react-bootstrap'
import api, { urlArchivo } from '../../services/api'
import MapaSelector from './MapaSelector'

const VACIA = {
  titulo: '', descripcion: '', tipo: 'casa', precio: '', estatus: 'venta', destacada: false,
  direccion: '', colonia: '', ciudad: '', estado: 'Coahuila', codigoPostal: '', lat: '', lng: '',
  m2Terreno: '', m2Construccion: '', recamaras: '', banos: '', estacionamientos: '', plantas: '', orientacion: '',
}

// Campos que la API acepta vacíos (los guarda como null); los demás solo se mandan si tienen valor
const NULABLES = ['descripcion', 'm2Terreno', 'm2Construccion', 'orientacion']

/** De la casa que regresa la API (GET /admin/casas/:id) a los valores del formulario. */
function aFormulario(casa) {
  return Object.fromEntries(Object.keys(VACIA).map((k) => [k, casa[k] ?? VACIA[k]]))
}

/**
 * Alta y edición de una casa (POST / PUT /api/admin/casas, multipart/form-data).
 * - casaId = null → alta; si no, carga el detalle completo y edita.
 * - El panel lo monta solo mientras está abierto (con key por casa), así siempre empieza limpio.
 * - Las imágenes nuevas se agregan; las existentes se pueden quitar una por una.
 * - onGuardada(casa) se llama después de guardar con la respuesta de la API.
 */
export default function CasaFormModal({ casaId, onHide, onGuardada }) {
  const [casa, setCasa] = useState(VACIA)
  const [imagenes, setImagenes] = useState([]) // ya guardadas
  const [archivos, setArchivos] = useState([]) // nuevas (File)
  const [amenidadIds, setAmenidadIds] = useState([])
  const [formaPagoIds, setFormaPagoIds] = useState([])
  const [catalogos, setCatalogos] = useState({ amenidades: [], formasPago: [] })
  const [errores, setErrores] = useState({})
  const [estado, setEstado] = useState({ cargando: Boolean(casaId), guardando: false, mensaje: '' })

  // Catálogos para los checkboxes (una sola vez)
  useEffect(() => {
    Promise.all([api.get('/amenidades'), api.get('/formas-pago')])
      .then(([a, f]) => setCatalogos({ amenidades: a.data.data, formasPago: f.data.data }))
      .catch((error) => setEstado((e) => ({ ...e, mensaje: error.message })))
  }, [])

  // Edición: carga el detalle completo. El panel monta este modal de nuevo cada vez que se abre,
  // así que el estado inicial (vacío) ya sirve para el alta.
  useEffect(() => {
    if (!casaId) return undefined
    let vigente = true
    api.get(`/admin/casas/${casaId}`)
      .then(({ data }) => {
        if (!vigente) return
        setCasa(aFormulario(data.data))
        setImagenes(data.data.imagenes)
        setAmenidadIds(data.data.amenidades.map((a) => a.id))
        setFormaPagoIds(data.data.formasPago.map((f) => f.id))
        setEstado({ cargando: false, guardando: false, mensaje: '' })
      })
      .catch((error) => { if (vigente) setEstado({ cargando: false, guardando: false, mensaje: error.message }) })
    return () => { vigente = false }
  }, [casaId])

  const cambiar = (event) => {
    const { name, value, type, checked } = event.target
    setCasa((c) => ({ ...c, [name]: type === 'checkbox' ? checked : value }))
    setErrores((e) => ({ ...e, [name]: undefined }))
  }
  const alternar = (setLista) => (id) => setLista((lista) => (lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id]))

  const quitarImagen = async (imagen) => {
    if (!window.confirm('¿Quitar esta imagen? Se borra de inmediato.')) return
    try {
      await api.delete(`/admin/casas/${casaId}/imagenes/${imagen.id}`)
      const { data } = await api.get(`/admin/casas/${casaId}`)
      setImagenes(data.data.imagenes) // la API asigna otra portada si se quitó la actual
    } catch (error) {
      setEstado((e) => ({ ...e, mensaje: error.message }))
    }
  }

  const guardar = async (event) => {
    event.preventDefault()
    const datos = new FormData()
    Object.entries(casa).forEach(([campo, valor]) => {
      if (valor !== '' || (casaId && NULABLES.includes(campo))) datos.append(campo, valor)
    })
    datos.append('amenidadIds', JSON.stringify(amenidadIds))
    datos.append('formaPagoIds', JSON.stringify(formaPagoIds))
    archivos.forEach((archivo) => datos.append('imagenes', archivo))

    setEstado({ cargando: false, guardando: true, mensaje: '' })
    setErrores({})
    try {
      const config = { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 }
      const { data } = casaId
        ? await api.put(`/admin/casas/${casaId}`, datos, config)
        : await api.post('/admin/casas', datos, config)
      setEstado({ cargando: false, guardando: false, mensaje: '' })
      onGuardada(data.data)
    } catch (error) {
      setErrores(Object.fromEntries(error.detalles.map((d) => [d.campo, d.mensaje])))
      setEstado({ cargando: false, guardando: false, mensaje: error.message })
    }
  }

  const campo = (name, props = {}) => (
    <Form.Group className={props.ancho ? 'span-2' : undefined}>
      <Form.Label>{props.label}</Form.Label>
      <Form.Control
        name={name}
        value={casa[name]}
        onChange={cambiar}
        isInvalid={Boolean(errores[name])}
        type={props.type || 'text'}
        step={props.step}
        min={props.min}
        required={props.required}
        as={props.as}
        rows={props.rows}
        maxLength={props.maxLength}
        placeholder={props.placeholder}
      />
      <Form.Control.Feedback type="invalid">{errores[name]}</Form.Control.Feedback>
    </Form.Group>
  )

  const checks = (lista, seleccion, onAlternar, nombre) => (
    <div className="admin-checks">
      {lista.map((item) => (
        <Form.Check
          key={item.id}
          id={`${nombre}-${item.id}`}
          label={item.nombre}
          checked={seleccion.includes(item.id)}
          onChange={() => onAlternar(item.id)}
        />
      ))}
    </div>
  )

  return (
    <Modal show onHide={onHide} size="xl" backdrop="static">
      <Form onSubmit={guardar} noValidate>
        <Modal.Header closeButton>
          <Modal.Title>{casaId ? `Editar casa #${casaId}` : 'Nueva casa'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {estado.mensaje && <p className="form-status" role="alert">{estado.mensaje}</p>}
          {estado.cargando ? <p>Cargando...</p> : (
            <>
              <h3 className="admin-subtitle">Datos generales</h3>
              <div className="admin-form">
                {campo('titulo', { label: 'Título *', required: true, maxLength: 150, ancho: true })}
                <Form.Group>
                  <Form.Label>Tipo</Form.Label>
                  <Form.Select name="tipo" value={casa.tipo} onChange={cambiar}>
                    <option value="casa">Casa</option><option value="departamento">Departamento</option><option value="terreno">Terreno</option>
                  </Form.Select>
                </Form.Group>
                {campo('precio', { label: 'Precio (MXN) *', type: 'number', min: 0, required: true })}
                <Form.Group>
                  <Form.Label>Estatus</Form.Label>
                  <Form.Select name="estatus" value={casa.estatus} onChange={cambiar}>
                    <option value="venta">En venta</option><option value="vendida">Vendida</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="admin-check-destacada">
                  <Form.Check id="destacada" name="destacada" label="Destacada en el inicio" checked={Boolean(casa.destacada)} onChange={cambiar} />
                </Form.Group>
                {campo('descripcion', { label: 'Descripción', as: 'textarea', rows: 3, ancho: true })}
              </div>

              <h3 className="admin-subtitle">Ubicación</h3>
              <div className="admin-form">
                {campo('direccion', { label: 'Calle y número *', required: true, ancho: true })}
                {campo('colonia', { label: 'Colonia *', required: true })}
                {campo('ciudad', { label: 'Ciudad *', required: true })}
                {campo('estado', { label: 'Estado *', required: true })}
                {campo('codigoPostal', { label: 'C.P. *', required: true, maxLength: 5, placeholder: '25000' })}
                {campo('lat', { label: 'Latitud *', type: 'number', step: 'any', required: true })}
                {campo('lng', { label: 'Longitud *', type: 'number', step: 'any', required: true })}
              </div>
              <p className="admin-ayuda">Haz clic en el mapa para poner la ubicación de la casa.</p>
              <MapaSelector
                lat={casa.lat}
                lng={casa.lng}
                onElegir={({ lat, lng }) => {
                  setCasa((c) => ({ ...c, lat, lng }))
                  setErrores((e) => ({ ...e, lat: undefined, lng: undefined }))
                }}
              />

              <h3 className="admin-subtitle">Características</h3>
              <div className="admin-form admin-form-4">
                {campo('recamaras', { label: 'Recámaras', type: 'number', min: 0 })}
                {campo('banos', { label: 'Baños', type: 'number', min: 0, step: 0.5 })}
                {campo('estacionamientos', { label: 'Estacionamientos', type: 'number', min: 0 })}
                {campo('plantas', { label: 'Plantas', type: 'number', min: 0 })}
                {campo('m2Terreno', { label: 'm² terreno', type: 'number', min: 0, step: 'any' })}
                {campo('m2Construccion', { label: 'm² construcción', type: 'number', min: 0, step: 'any' })}
                <Form.Group>
                  <Form.Label>Orientación</Form.Label>
                  <Form.Select name="orientacion" value={casa.orientacion} onChange={cambiar}>
                    <option value="">Sin especificar</option>
                    <option value="norte">Norte</option><option value="sur">Sur</option>
                    <option value="oriente">Oriente</option><option value="poniente">Poniente</option>
                  </Form.Select>
                </Form.Group>
              </div>

              <h3 className="admin-subtitle">Amenidades</h3>
              <div className="admin-form">
                <div><strong>Interiores</strong>{checks(catalogos.amenidades.filter((a) => a.tipo === 'interior'), amenidadIds, alternar(setAmenidadIds), 'amenidad')}</div>
                <div><strong>Exteriores</strong>{checks(catalogos.amenidades.filter((a) => a.tipo === 'exterior'), amenidadIds, alternar(setAmenidadIds), 'amenidad')}</div>
              </div>

              <h3 className="admin-subtitle">Formas de pago</h3>
              {checks(catalogos.formasPago, formaPagoIds, alternar(setFormaPagoIds), 'pago')}

              <h3 className="admin-subtitle">Imágenes</h3>
              {imagenes.length > 0 && (
                <div className="admin-thumbs">
                  {imagenes.map((imagen) => (
                    <figure key={imagen.id}>
                      <img src={urlArchivo(imagen.url)} alt={`Imagen ${imagen.orden}`} />
                      <figcaption>
                        {imagen.esPortada ? 'Portada' : `#${imagen.orden}`}
                        <button type="button" onClick={() => quitarImagen(imagen)}>Quitar</button>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              )}
              <Form.Group>
                <Form.Label>{casaId ? 'Agregar imágenes' : 'Imágenes (la primera será la portada)'}</Form.Label>
                <Form.Control
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  isInvalid={Boolean(errores.imagenes)}
                  onChange={(event) => setArchivos([...event.target.files])}
                />
                <Form.Text>JPG, PNG o WEBP de máximo 5 MB; hasta 10 por vez.</Form.Text>
                <Form.Control.Feedback type="invalid">{errores.imagenes}</Form.Control.Feedback>
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>Cancelar</Button>
          <Button type="submit" disabled={estado.guardando || estado.cargando}>{estado.guardando ? 'Guardando...' : 'Guardar'}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
