import { useState } from 'react'
import { Button, Form } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [credentials, setCredentials] = useState({ correo: '', password: '' })
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    try {
      const { data } = await api.post('/auth/login', credentials)
      const token = data.token || data.data?.token
      if (!token) throw new Error('La respuesta no incluye token')
      localStorage.setItem('multicasa_token', token)
      navigate('/admin/panel')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <section className="login-page">
      <Form className="login-card" onSubmit={submit}>
        <h1>Acceso administrativo</h1>
        {error && <p className="form-error">{error}</p>}
        <Form.Group>
          <Form.Label>Correo</Form.Label>
          <Form.Control type="email" required value={credentials.correo} onChange={(event) => setCredentials({ ...credentials, correo: event.target.value })} />
        </Form.Group>
        <Form.Group>
          <Form.Label>Contraseña</Form.Label>
          <Form.Control type="password" required value={credentials.password} onChange={(event) => setCredentials({ ...credentials, password: event.target.value })} />
        </Form.Group>
        <Button type="submit">Ingresar</Button>
      </Form>
    </section>
  )
}
