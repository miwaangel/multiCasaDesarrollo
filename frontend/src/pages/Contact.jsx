import { useEffect, useState } from 'react'
import { Button, Container, Form } from 'react-bootstrap'
import { useSearchParams } from 'react-router-dom'
import api from '../services/api'

export default function Contact() {
  const [searchParams] = useSearchParams()
  const [message, setMessage] = useState({ nombre: '', correo: '', telefono: '', asunto: '', mensaje: '' })
  const [status, setStatus] = useState('')

  useEffect(() => {
    setMessage((current) => ({
      ...current,
      asunto: searchParams.get('asunto') || (searchParams.get('casa') ? `Casa de interés ${searchParams.get('casa')}` : ''),
      mensaje: searchParams.get('casa') ? `Estoy interesado en la casa con ID ${searchParams.get('casa')}.` : '',
    }))
  }, [searchParams])

  const submit = async (event) => {
    event.preventDefault()
    setStatus('')
    try {
      await api.post('/contacto', message)
      setStatus('Tu mensaje fue enviado.')
      setMessage({ nombre: '', correo: '', telefono: '', asunto: '', mensaje: '' })
    } catch (error) {
      setStatus(error.message)
    }
  }

  return (
    <Container fluid="lg" className="contact-page">
      <div className="contact-layout">
        <section>
          <h1>Contacto</h1>
          <p>Escríbenos y un asesor te responderá.</p>
          <Form className="contact-form" onSubmit={submit}>
            {status && <p className="form-status">{status}</p>}
            <Form.Control required placeholder="Nombre" value={message.nombre} onChange={(event) => setMessage({ ...message, nombre: event.target.value })} />
            <Form.Control required type="email" placeholder="Correo" value={message.correo} onChange={(event) => setMessage({ ...message, correo: event.target.value })} />
            <Form.Control type="tel" placeholder="Teléfono" value={message.telefono} onChange={(event) => setMessage({ ...message, telefono: event.target.value })} />
            <Form.Control required placeholder="Asunto" value={message.asunto} onChange={(event) => setMessage({ ...message, asunto: event.target.value })} />
            <Form.Control required as="textarea" rows={5} placeholder="Mensaje" value={message.mensaje} onChange={(event) => setMessage({ ...message, mensaje: event.target.value })} />
            <Button type="submit">Enviar mensaje</Button>
          </Form>
        </section>
        <section className="company-video">
          <h2>La Compañía</h2>
          <video controls poster="/images/header-5.svg" preload="metadata">
            <source src="/video/multicasa.mp4" type="video/mp4" />
            Tu navegador no admite video HTML5.
          </video>
          <p>Conoce el objetivo de MultiCasa y cómo encontraremos tu próximo hogar.</p>
        </section>
      </div>
    </Container>
  )
}
