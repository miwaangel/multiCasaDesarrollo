import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * React Router no mueve el scroll al cambiar de página:
 * - con #seccion (por ejemplo /servicios#seguros) baja hasta esa sección;
 * - sin #, regresa al inicio de la página nueva.
 */
export default function ScrollAlCambiar() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0)
      return undefined
    }
    // Espera a que la página pinte la sección (algunas cargan datos de la API)
    let intentos = 0
    const buscar = window.setInterval(() => {
      const destino = document.getElementById(decodeURIComponent(hash.slice(1)))
      intentos += 1
      if (destino || intentos > 20) {
        window.clearInterval(buscar)
        destino?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 50)
    return () => window.clearInterval(buscar)
  }, [pathname, hash])

  return null
}
