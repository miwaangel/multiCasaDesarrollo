import { useEffect, useState } from 'react'
import { Button, Container, Form } from 'react-bootstrap'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../services/api'

// Mismos valores que la columna mensajes_contacto.asunto (POST /api/contacto)
const ASUNTOS = {
  informacion: 'Solicitar información',
  vender: 'Quiero vender mi casa',
  construir: 'Construir',
  mudanzas: 'Mudanzas',
  seguros: 'Seguros',
  otro: 'Otro',
}

const VACIO = { nombre: '', email: '', telefono: '', asunto: 'informacion', mensaje: '', sitioWeb: '' }

/**
 * Formulario de contacto.
 * - /contacto?asunto=vender (o construir, mudanzas, seguros...) preselecciona el asunto.
 * - /contacto?casa=3 (botón "Me interesa") muestra la casa y la manda como casaId.
 */
export default function Contact() {
  const [searchParams] = useSearchParams()
  const casaId = Number(searchParams.get('casa')) || null
  const asuntoUrl = searchParams.get('asunto')

  const [message, setMessage] = useState(() => ({
    ...VACIO,
    asunto: ASUNTOS[asuntoUrl] ? asuntoUrl : 'informacion',
  }))
  const [casa, setCasa] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [status, setStatus] = useState({ tipo: '', texto: '' })
  const [errores, setErrores] = useState({})

  useEffect(() => {
    if (!casaId) return undefined
    let vigente = true
    api.get(`/casas/${casaId}`)
      .then(({ data }) => {
        if (!vigente) return
        setCasa(data.data)
        setMessage((actual) => ({
          ...actual,
          mensaje: actual.mensaje || `Me interesa la casa "${data.data.titulo}" y quiero más información.`,
        }))
      })
      .catch(() => {})
    return () => { vigente = false }
  }, [casaId])

  const update = (event) => {
    const { name, value } = event.target
    setMessage((actual) => ({ ...actual, [name]: value }))
    setErrores((actual) => ({ ...actual, [name]: undefined }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setStatus({ tipo: '', texto: '' })
    setErrores({})
    setEnviando(true)
    try {
      await api.post('/contacto', { ...message, casaId: casa ? casa.id : null })
      setStatus({ tipo: 'ok', texto: 'Recibimos tu mensaje. Un asesor te contactará pronto.' })
      setMessage({ ...VACIO, asunto: message.asunto })
    } catch (error) {
      setErrores(Object.fromEntries(error.detalles.map((d) => [d.campo, d.mensaje])))
      setStatus({ tipo: 'error', texto: error.message })
    } finally {
      setEnviando(false)
    }
  }

  const campo = (name) => ({ name, value: message[name], onChange: update, isInvalid: Boolean(errores[name]) })
  const error = (name) => <Form.Control.Feedback type="invalid">{errores[name]}</Form.Control.Feedback>

  return (
    <Container fluid="lg" className="contact-page">
      <div className="contact-layout">
        <section>
          <h1>Contacto</h1>
          <p>Escríbenos y un asesor te responderá.</p>

          {casa && (
            <p className="form-status">
              Te interesa: <Link to={`/casas/${casa.id}`}>{casa.titulo}</Link> · {casa.ciudad} · ${Number(casa.precio).toLocaleString('es-MX')}
            </p>
          )}

          <Form className="contact-form" onSubmit={submit} noValidate>
            {status.texto && <p className="form-status" role={status.tipo === 'error' ? 'alert' : 'status'}>{status.texto}</p>}

            <Form.Group>
              <Form.Control required placeholder="Nombre" maxLength={100} {...campo('nombre')} />
              {error('nombre')}
            </Form.Group>
            <Form.Group>
              <Form.Control required type="email" placeholder="Correo" maxLength={150} {...campo('email')} />
              {error('email')}
            </Form.Group>
            <Form.Group>
              <Form.Control type="tel" placeholder="Teléfono (opcional)" maxLength={20} {...campo('telefono')} />
              {error('telefono')}
            </Form.Group>
            <Form.Group>
              <Form.Select aria-label="Asunto" {...campo('asunto')}>
                {Object.entries(ASUNTOS).map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
              </Form.Select>
              {error('asunto')}
            </Form.Group>
            <Form.Group>
              <Form.Control required as="textarea" rows={5} placeholder="Mensaje" maxLength={2000} {...campo('mensaje')} />
              {error('mensaje')}
            </Form.Group>

            {/* Campo trampa para bots: invisible para las personas */}
            <input
              type="text"
              name="sitioWeb"
              value={message.sitioWeb}
              onChange={update}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, opacity: 0 }}
            />

            <Button type="submit" disabled={enviando}>{enviando ? 'Enviando...' : 'Enviar mensaje'}</Button>
          </Form>
        </section>
      </div>
    </Container>
  )
}
