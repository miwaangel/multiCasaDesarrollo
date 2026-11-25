import { Link } from 'react-router-dom'
import { urlArchivo } from '../services/api'
import PaginaInfo from '../components/PaginaInfo'

/** Cada servicio tiene su sección (/servicios#construir) y un botón al formulario con el asunto elegido. */
const SERVICIOS = [
  {
    id: 'compra',
    titulo: 'Compra',
    foto: '/uploads/seed/casa-16-1.jpg',
    texto: 'Te ayudamos a encontrar la casa que se ajusta a tu presupuesto y a tu forma de pago, y te acompañamos hasta escriturar.',
    incluye: ['Búsqueda por ubicación, precio, recámaras y baños', 'Visitas agendadas con un asesor', 'Revisión de escrituras, predial y servicios al corriente', 'Orientación con Infonavit, Fovissste o crédito bancario', 'Acompañamiento en la firma ante notario'],
    boton: { texto: 'Buscar propiedades', link: '/buscar' },
  },
  {
    id: 'venta',
    titulo: 'Venta',
    foto: '/uploads/seed/casa-11-1.jpg',
    texto: 'Vendemos tu propiedad al mejor precio de mercado y nos encargamos de la publicación, las visitas y los trámites.',
    incluye: ['Opinión de valor con base en ventas de la zona', 'Fotografías y ficha técnica de la propiedad', 'Publicación en nuestro sitio con ubicación en el mapa', 'Filtro de compradores y atención de visitas', 'Revisión de documentos y apoyo en la escrituración'],
    boton: { texto: 'Quiero vender mi casa', link: '/contacto?asunto=vender' },
  },
  {
    id: 'construir',
    titulo: 'Construir',
    foto: '/uploads/seed/casa-08-1.jpg',
    texto: '¿Tienes terreno o quieres comprar uno para construir? Te ponemos en contacto con arquitectos y constructoras de confianza.',
    incluye: ['Asesoría para elegir terreno (uso de suelo, servicios, pendiente)', 'Anteproyecto y presupuesto con constructoras aliadas', 'Gestión de licencia de construcción', 'Opciones de crédito para construcción o ampliación', 'Supervisión de avance de obra'],
    boton: { texto: 'Solicitar información', link: '/contacto?asunto=construir' },
  },
  {
    id: 'mudanzas',
    titulo: 'Mudanzas',
    foto: '/uploads/seed/casa-04-2.jpg',
    texto: 'Cuando ya tienes tus llaves, coordinamos tu mudanza con empresas de transporte que trabajan con nosotros.',
    incluye: ['Cotización sin costo con 2 o 3 empresas', 'Empaque y embalaje de muebles y artículos frágiles', 'Mudanzas locales y foráneas', 'Seguro de carga durante el traslado', 'Apoyo para contratar luz, agua, gas e internet en tu nueva casa'],
    boton: { texto: 'Solicitar información', link: '/contacto?asunto=mudanzas' },
  },
  {
    id: 'seguros',
    titulo: 'Seguros',
    foto: '/uploads/seed/casa-14-1.jpg',
    texto: 'Protege tu patrimonio. Comparamos opciones de aseguradoras para tu casa y tu crédito.',
    incluye: ['Seguro de hogar: incendio, sismo, inundación y robo', 'Responsabilidad civil familiar', 'Seguro de vida y daños ligado a tu crédito hipotecario', 'Comparativo de coberturas y deducibles', 'Apoyo para reportar un siniestro'],
    boton: { texto: 'Solicitar información', link: '/contacto?asunto=seguros' },
  },
]

export default function Servicios() {
  return (
    <PaginaInfo
      etiqueta="Lo que hacemos"
      titulo="Servicios"
      intro="Todo lo que necesitas alrededor de tu casa en un mismo lugar: comprar, vender, construir, mudarte y asegurar tu patrimonio."
      foto="/uploads/seed/casa-01-1.jpg"
      acciones={(
        <nav className="info-indice" aria-label="Servicios">
          {SERVICIOS.map((s) => <a key={s.id} href={`#${s.id}`}>{s.titulo}</a>)}
        </nav>
      )}
    >
      {SERVICIOS.map((s, i) => (
        <section key={s.id} id={s.id} className={`info-servicio${i % 2 ? ' invertido' : ''}`}>
          <img src={urlArchivo(s.foto)} alt="" loading="lazy" decoding="async" />
          <div>
            <h2>{s.titulo}</h2>
            <p>{s.texto}</p>
            <h3>Qué incluye</h3>
            <ul>{s.incluye.map((item) => <li key={item}>{item}</li>)}</ul>
            <Link className="primary-link" to={s.boton.link}>{s.boton.texto}</Link>
          </div>
        </section>
      ))}
    </PaginaInfo>
  )
}
