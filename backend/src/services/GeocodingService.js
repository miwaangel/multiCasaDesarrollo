const env = require('../config/env');
const AppError = require('../utils/AppError');
const CasaRepository = require('../repositories/CasaRepository');

const esCodigoPostal = (texto) => /^\d{5}$/.test(texto);
const normalizar = (texto) =>
  texto
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

/**
 * Convierte un C.P. o el nombre de una ciudad en coordenadas { lat, lng, fuente }.
 *
 * 1. Caché en memoria (no se repite una consulta mientras el servidor siga encendido).
 * 2. La propia BD: centro (promedio) de las casas con ese C.P. o en esa ciudad.
 *    Así la búsqueda funciona sin internet para todo lo que ya está en el catálogo.
 * 3. Nominatim (OpenStreetMap) para cualquier otro C.P. o ciudad de México.
 *    Su política de uso pide máximo 1 consulta por segundo y un User-Agent propio.
 *
 * Regresa null si la ubicación no existe.
 * Lanza 503 GEOCODIFICACION_NO_DISPONIBLE si Nominatim no responde.
 */
class GeocodingService {
  static INTERVALO_MS = 1100;

  #cache = new Map();
  #ultimaConsulta = 0;

  constructor({ casaRepository = new CasaRepository(), fetchFn = globalThis.fetch, config = env.geocoding } = {}) {
    this.casas = casaRepository;
    this.fetch = fetchFn;
    this.config = config;
  }

  async geocodificar(texto) {
    const clave = normalizar(texto);
    if (this.#cache.has(clave)) {
      return this.#cache.get(clave);
    }

    const resultado = (await this.#buscarEnCatalogo(texto.trim())) ?? (await this.#buscarEnNominatim(texto.trim()));
    this.#cache.set(clave, resultado);
    return resultado;
  }

  async #buscarEnCatalogo(texto) {
    const centro = esCodigoPostal(texto)
      ? await this.casas.findCentroPorCodigoPostal(texto)
      : await this.casas.findCentroPorCiudad(texto);
    return centro ? { ...centro, fuente: 'catalogo' } : null;
  }

  async #buscarEnNominatim(texto) {
    if (!this.config.habilitado) {
      return null;
    }

    const params = new URLSearchParams({ format: 'jsonv2', limit: '1', countrycodes: 'mx' });
    params.set(esCodigoPostal(texto) ? 'postalcode' : 'q', texto);

    await this.#esperarTurno();
    let respuesta;
    try {
      respuesta = await this.fetch(`${this.config.url}/search?${params}`, {
        headers: { 'User-Agent': this.config.userAgent, 'Accept-Language': 'es' },
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
    } catch (err) {
      throw this.#noDisponible(err.message);
    }
    if (!respuesta.ok) {
      throw this.#noDisponible(`HTTP ${respuesta.status}`);
    }

    const [lugar] = await respuesta.json();
    if (!lugar) {
      return null;
    }
    return { lat: Number(lugar.lat), lng: Number(lugar.lon), fuente: 'nominatim' };
  }

  /** Separa las consultas a Nominatim al menos INTERVALO_MS (aunque lleguen varias a la vez). */
  async #esperarTurno() {
    const ahora = Date.now();
    const espera = Math.max(0, this.#ultimaConsulta + GeocodingService.INTERVALO_MS - ahora);
    this.#ultimaConsulta = ahora + espera;
    if (espera > 0) {
      await new Promise((resolve) => setTimeout(resolve, espera));
    }
  }

  #noDisponible(motivo) {
    if (env.nodeEnv !== 'test') {
      console.warn(`Nominatim no respondió: ${motivo}`);
    }
    return new AppError(
      503,
      'GEOCODIFICACION_NO_DISPONIBLE',
      'No pudimos ubicar ese C.P. o ciudad en este momento. Intenta sin radio o más tarde.',
    );
  }
}

module.exports = GeocodingService;
