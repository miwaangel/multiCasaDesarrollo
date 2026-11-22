import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
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
const API_ORIGIN = new URL(api.defaults.baseURL).origin

export function urlArchivo(ruta) {
  if (!ruta) return ''
  if (/^https?:\/\//.test(ruta)) return ruta
  return `${API_ORIGIN}${ruta}`
}

export default api
