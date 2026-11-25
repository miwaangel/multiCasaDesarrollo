const crypto = require('crypto');
const env = require('../config/env');
const VisitaRepository = require('../repositories/VisitaRepository');

const VENTANA_REPETIDA_MS = 10 * 1000; // misma página del mismo visitante en < 10 s = misma carga
const VENTANA_CONECTADOS_MS = 5 * 60 * 1000; // conectados = visitantes de los últimos 5 minutos

/**
 * Contador de Visitas y Conectados.
 * Nunca se guarda la IP: se guarda SHA-256(IP + user-agent + VISITAS_SALT), que sirve para
 * saber si dos visitas son del mismo visitante pero no permite saber quién es.
 */
class VisitaService {
  #enCurso = new Map();

  constructor({ repository = new VisitaRepository(), salt = env.visitasSalt } = {}) {
    this.repository = repository;
    this.salt = salt;
  }

  /** Huella anónima del visitante: 64 caracteres hexadecimales. */
  hashVisitante(ip, userAgent) {
    return crypto
      .createHash('sha256')
      .update(`${ip}|${userAgent}|${this.salt}`)
      .digest('hex');
  }

  /**
   * Registra la visita, salvo que el mismo visitante haya registrado la misma página
   * en los últimos 10 segundos (React en modo estricto monta los componentes dos veces).
   * Regresa { registrada: true | false }.
   */
  async registrar({ ip, userAgent = '', pagina = null }) {
    const visitanteHash = this.hashVisitante(ip, userAgent);

    return this.#enFila(`${visitanteHash}|${pagina ?? ''}`, async () => {
      const hace10s = new Date(Date.now() - VENTANA_REPETIDA_MS);
      if (await this.repository.existeReciente(visitanteHash, pagina, hace10s)) {
        return { registrada: false };
      }
      await this.repository.registrar({ visitanteHash, pagina });
      return { registrada: true };
    });
  }

  /** { visitas: total de registros, conectados: visitantes distintos en los últimos 5 minutos } */
  async resumen() {
    const hace5min = new Date(Date.now() - VENTANA_CONECTADOS_MS);
    const [visitas, conectados] = await Promise.all([
      this.repository.contarVisitas(),
      this.repository.contarConectados(hace5min),
    ]);
    return { visitas, conectados };
  }

  /**
   * Las dos peticiones del modo estricto llegan casi al mismo tiempo: si las dos revisaran
   * "¿ya existe?" antes de que alguna guarde, se contarían las dos. Aquí las peticiones con la
   * misma clave (visitante + página) se atienden una tras otra, nunca en paralelo.
   */
  async #enFila(clave, trabajo) {
    const anterior = this.#enCurso.get(clave) ?? Promise.resolve();
    const actual = anterior.catch(() => {}).then(trabajo);
    this.#enCurso.set(clave, actual);
    try {
      return await actual;
    } finally {
      if (this.#enCurso.get(clave) === actual) {
        this.#enCurso.delete(clave);
      }
    }
  }
}

module.exports = VisitaService;
