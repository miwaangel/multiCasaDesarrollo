import { Accordion } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import PaginaInfo from '../components/PaginaInfo'

const PREGUNTAS = [
  ['¿Cómo busco una casa por zona?', 'En el buscador de la barra lateral escribe un código postal de 5 dígitos o el nombre de la ciudad y elige un rango (2, 5, 10 o 20 km). Verás las casas dentro de ese radio, de la más cercana a la más lejana, y su ubicación en el mapa. Con "Sin rango" solo aparecen las de ese C.P. o esa ciudad.'],
  ['¿Los precios incluyen gastos de escrituración?', 'No. El precio publicado es el de la propiedad. Los gastos notariales, el avalúo y los impuestos de adquisición suelen sumar entre 5% y 8% del valor, según el estado y el tipo de crédito. Tu asesor te da el cálculo exacto antes de apartar.'],
  ['¿Puedo comprar con mi crédito Infonavit o Fovissste?', 'Sí. Consulta la página de Requisitos para ver los documentos de cada forma de pago. También puedes juntar tu crédito con el de tu pareja (Unamos Créditos) o combinarlo con un crédito bancario (Cofinavit).'],
  ['¿Cómo aparto una casa?', 'Después de la visita, firmas una carta de intención y entregas un apartado que se descuenta del precio. El apartado se respeta mientras se integra tu expediente de crédito o preparas el pago.'],
  ['¿Cuánto tarda la compra?', 'De contado, de 3 a 5 semanas. Con crédito, de 6 a 10 semanas, según el banco o instituto y qué tan completo esté tu expediente.'],
  ['¿Qué es la ficha técnica en PDF?', 'Es un documento con las fotos, medidas, amenidades, formas de pago y ubicación de la casa. Lo descargas desde la página de cada propiedad para compararla o compartirla.'],
  ['¿Cobran comisión al comprador?', 'No. La comisión la paga el vendedor. Al comprador solo le corresponden los gastos de escrituración y, si aplica, los del crédito.'],
  ['Quiero vender mi casa, ¿qué necesito?', 'Escrituras, identificación, boleta de predial y recibo de agua al corriente. Escríbenos desde el formulario de contacto con el asunto "Quiero vender mi casa" y un asesor te visita para darte una opinión de valor.'],
]

const TIPS = [
  ['Define tu presupuesto total', 'Suma enganche, gastos de escrituración y mudanza. Que la mensualidad no pase de 30% de tus ingresos.'],
  ['Visita a distintas horas', 'Ve de día y de noche, entre semana y en fin de semana: así conoces el tráfico, el ruido y la iluminación.'],
  ['Revisa los servicios', 'Abre llaves, prende la luz en cada cuarto, revisa la presión del agua, el calentador y la instalación de gas.'],
  ['Busca humedad y grietas', 'Revisa techos, esquinas y muros. Pregunta si la casa tiene impermeabilización reciente.'],
  ['Pide los documentos', 'Escrituras, predial y agua al corriente, y certificado de libertad de gravamen. Tu asesor los revisa contigo.'],
  ['Investiga la zona', 'Escuelas, hospitales, transporte, comercios y plusvalía. Pregunta a los vecinos por la seguridad y el mantenimiento.'],
]

/** Ayuda: preguntas frecuentes (#preguntas) y tips para antes de comprar (#tips). */
export default function Ayuda() {
  return (
    <PaginaInfo
      etiqueta="Centro de ayuda"
      titulo="Ayuda"
      intro="Respuestas a las dudas más comunes sobre comprar y vender con MultiCasa, y consejos para elegir bien tu casa."
      foto="/uploads/seed/casa-13-1.jpg"
      acciones={(
        <nav className="info-indice" aria-label="Secciones">
          <a href="#preguntas">Preguntas frecuentes</a>
          <a href="#tips">Tips para antes de comprar</a>
        </nav>
      )}
    >
      <section className="info-seccion" id="preguntas">
        <h2>Preguntas frecuentes</h2>
        <Accordion alwaysOpen>
          {PREGUNTAS.map(([pregunta, respuesta], i) => (
            <Accordion.Item eventKey={String(i)} key={pregunta}>
              <Accordion.Header>{pregunta}</Accordion.Header>
              <Accordion.Body>{respuesta}</Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
      </section>

      <section className="info-seccion" id="tips">
        <h2>Tips para antes de comprar</h2>
        <div className="info-grid">
          {TIPS.map(([titulo, texto], i) => (
            <article key={titulo}><span className="info-numero">{i + 1}</span><h3>{titulo}</h3><p>{texto}</p></article>
          ))}
        </div>
      </section>

      <section className="info-cta">
        <p>¿No encontraste tu respuesta?</p>
        <Link className="primary-link" to="/contacto">Escríbenos</Link>
      </section>
    </PaginaInfo>
  )
}
