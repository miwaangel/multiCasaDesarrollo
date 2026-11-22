import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import PaginaInfo from '../components/PaginaInfo'

const DOCUMENTOS_GENERALES = [
  'Identificación oficial vigente (INE o pasaporte) de los compradores',
  'CURP y RFC (Constancia de Situación Fiscal)',
  'Comprobante de domicilio reciente (no mayor a 3 meses)',
  'Acta de nacimiento y, si aplica, acta de matrimonio',
  'Recursos para el enganche, avalúo y gastos notariales (aprox. 5% a 8% del valor)',
]

/** Requisitos: documentos generales y los de cada forma de pago (GET /api/formas-pago). */
export default function Requisitos() {
  const [formas, setFormas] = useState({ lista: [], cargando: true, error: '' })

  useEffect(() => {
    api.get('/formas-pago')
      .then(({ data }) => setFormas({ lista: data.data, cargando: false, error: '' }))
      .catch((error) => setFormas({ lista: [], cargando: false, error: error.message }))
  }, [])

  return (
    <PaginaInfo
      etiqueta="Antes de comprar"
      titulo="Requisitos"
      intro="Estos son los documentos que te pedirán según la forma en que vas a pagar tu casa. Tu asesor revisa contigo la lista antes de apartar la propiedad."
      foto="/uploads/seed/casa-09-1.jpg"
    >
      <section className="info-seccion" id="generales">
        <h2>Documentos para cualquier compra</h2>
        <ul className="info-lista">{DOCUMENTOS_GENERALES.map((d) => <li key={d}>{d}</li>)}</ul>
      </section>

      <section className="info-seccion" id="formas-de-pago">
        <h2>Según tu forma de pago</h2>
        {formas.cargando && <p role="status">Cargando formas de pago...</p>}
        {formas.error && <p className="form-status" role="alert">{formas.error}</p>}
        <div className="info-grid">
          {formas.lista.map((forma) => (
            <article key={forma.id} id={`pago-${forma.id}`}>
              <h3>{forma.nombre}</h3>
              <p>{forma.descripcion}</p>
              {forma.requisitos && (
                <>
                  <h4>Requisitos</h4>
                  <ul className="info-lista">
                    {forma.requisitos.split('\n').map((r) => r.trim()).filter(Boolean).map((r) => <li key={r}>{r}</li>)}
                  </ul>
                </>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="info-cta">
        <p>¿No sabes cuál te conviene o si ya cumples los requisitos?</p>
        <Link className="primary-link" to="/contacto?asunto=informacion">Pide una asesoría sin costo</Link>
      </section>
    </PaginaInfo>
  )
}
