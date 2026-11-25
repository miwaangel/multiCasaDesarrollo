import axios from 'axios'

// En desarrollo la API corre aparte (puerto 3000). En el build de producción, si no se indica
// VITE_API_URL, se usa "/api" porque el backend sirve el sitio y la API en la misma URL.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3000/api'),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('multicasa_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Token vencido o inválido en una ruta de admin: cerrar sesión y volver al login
    if (error.response?.status === 401 && error.config?.url?.startsWith('/admin') && localStorage.getItem('multicasa_token')) {
      localStorage.removeItem('multicasa_token')
      window.location.assign('/admin')
    }
    const message = error.response?.data?.error?.mensaje
      || error.response?.data?.mensaje
      || 'No fue posible completar la solicitud'
    const err = new Error(message)
    // Errores de validación: [{ campo, mensaje }] para marcar cada campo del formulario
    err.detalles = error.response?.data?.error?.detalles || []
    return Promise.reject(err)
  },
)

/**
 * La API regresa rutas de imagen relativas ("/uploads/seed/casa-01-1.jpg").
 * Se sirven desde el servidor del backend, no desde Vite: se les antepone su origen.
 */
const API_ORIGIN = new URL(api.defaults.baseURL, window.location.origin).origin

export function urlArchivo(ruta) {
  if (!ruta) return ''
  if (/^https?:\/\//.test(ruta)) return ruta
  return `${API_ORIGIN}${ruta}`
}

/** URL completa de un endpoint, para links directos (por ejemplo descargar un PDF). */
export function urlApi(ruta) {
  return `${api.defaults.baseURL}${ruta}`
}

export default api
