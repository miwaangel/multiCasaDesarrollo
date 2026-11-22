import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import api from '../services/api'

export const EVENTO_VISITA = 'multicasa:visita-registrada'

/**
 * Registra una visita (POST /api/visitas) cada vez que se abre una página pública.
 * Las del panel de administrador no cuentan. Al terminar avisa con un evento para que
 * la barra lateral actualice el contador sin esperar.
 */
export default function RegistroVisitas() {
  const { pathname } = useLocation()

  useEffect(() => {
    if (pathname.startsWith('/admin')) return
    api.post('/visitas', { pagina: pathname })
      .then(() => window.dispatchEvent(new Event(EVENTO_VISITA)))
      .catch(() => {}) // el contador nunca debe romper la página
  }, [pathname])

  return null
}
