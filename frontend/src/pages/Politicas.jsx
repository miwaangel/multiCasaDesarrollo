import { Link } from 'react-router-dom'
import PaginaInfo from '../components/PaginaInfo'

/** Políticas: calidad (#calidad), ISO 9001 (#iso) y aviso de privacidad (#privacidad). */
export default function Politicas() {
  return (
    <PaginaInfo
      etiqueta="Transparencia"
      titulo="Políticas"
      intro="Cómo trabajamos para darte un buen servicio y cómo cuidamos los datos que nos compartes."
      foto="/uploads/seed/casa-19-1.jpg"
      acciones={(
        <nav className="info-indice" aria-label="Secciones">
          <a href="#calidad">Política de calidad</a>
          <a href="#iso">ISO 9001</a>
          <a href="#privacidad">Aviso de privacidad</a>
        </nav>
      )}
    >
      <section className="info-seccion info-texto" id="calidad">
        <h2>Política de calidad</h2>
        <p>
          En Bienes Raíces MultiCasa nos comprometemos a que cada cliente compre, venda o construya su casa con
          información completa y verificada, en los tiempos acordados y con un trato cercano. Para lograrlo:
        </p>
        <ul className="info-lista">
          <li>Revisamos documentos, medidas y estado de cada propiedad antes de publicarla.</li>
          <li>Publicamos precios y características reales, y los actualizamos cuando cambian.</li>
          <li>Respondemos cada mensaje del formulario de contacto en menos de un día hábil.</li>
          <li>Medimos la satisfacción de nuestros clientes al cerrar cada operación y usamos sus comentarios para mejorar.</li>
          <li>Capacitamos a nuestros asesores en créditos, trámites notariales y atención al cliente.</li>
        </ul>
      </section>

      <section className="info-seccion info-texto" id="iso">
        <h2>Gestión de la calidad basada en ISO 9001</h2>
        <p>
          Nuestros procesos de captación de propiedades, atención a clientes y cierre de operaciones siguen los
          principios de la norma ISO 9001:2015 (sistemas de gestión de la calidad):
        </p>
        <ul className="info-lista">
          <li><strong>Enfoque al cliente:</strong> cada proceso empieza por lo que el cliente necesita.</li>
          <li><strong>Procesos documentados:</strong> listas de verificación para publicar, mostrar y vender una propiedad.</li>
          <li><strong>Decisiones con datos:</strong> reportes de casas vendidas y en venta, por rango de precio y por zona.</li>
          <li><strong>Mejora continua:</strong> revisamos cada mes las quejas y sugerencias y damos seguimiento a las acciones.</li>
        </ul>
      </section>

      <section className="info-seccion info-texto" id="privacidad">
        <h2>Aviso de privacidad</h2>
        <p>
          Bienes Raíces MultiCasa es responsable del tratamiento de los datos personales que nos proporcionas, de
          acuerdo con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.
        </p>
        <h3>Qué datos recabamos</h3>
        <ul className="info-lista">
          <li>Del formulario de contacto: nombre, correo electrónico, teléfono (opcional), asunto, mensaje y, si aplica, la casa que te interesa.</li>
          <li>Del contador de visitas: la página visitada y un identificador cifrado (hash) que no permite saber tu dirección IP. No guardamos tu IP.</li>
          <li>No usamos cookies de publicidad ni compartimos tus datos con terceros para fines comerciales.</li>
        </ul>
        <h3>Para qué los usamos</h3>
        <ul className="info-lista">
          <li>Responder tus mensajes y darte la información que pediste sobre propiedades o servicios.</li>
          <li>Darte seguimiento si decides comprar, vender o contratar alguno de nuestros servicios.</li>
          <li>Generar estadísticas generales de visitas al sitio (sin identificarte).</li>
        </ul>
        <h3>Tus derechos ARCO</h3>
        <p>
          Puedes pedir el Acceso, Rectificación, Cancelación u Oposición al uso de tus datos, o revocar tu
          consentimiento, enviando tu solicitud desde el <Link to="/contacto?asunto=otro">formulario de contacto</Link> con
          el asunto "Otro". Te responderemos en un plazo máximo de 20 días hábiles.
        </p>
        <p className="info-nota">Última actualización: noviembre de 2026.</p>
      </section>
    </PaginaInfo>
  )
}
