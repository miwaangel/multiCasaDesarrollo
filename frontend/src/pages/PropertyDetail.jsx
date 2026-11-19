import { useEffect, useState } from 'react'
import { Container } from 'react-bootstrap'
import { Link, useParams } from 'react-router-dom'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { jsPDF } from 'jspdf'
import api from '../services/api'
import { casasMock } from '../data/mockData'

export default function PropertyDetail() {
  const { id } = useParams()
  const [casa, setCasa] = useState(casasMock.find((item) => item.id === Number(id)) || casasMock[0])

  useEffect(() => {
    api.get(`/casas/${id}`)
      .then(({ data }) => setCasa(data.data || data))
      .catch(() => {})
  }, [id])

  const descargarPDF = () => {
    const pdf = new jsPDF()
    pdf.setFontSize(18)
    pdf.text('Ficha tecnica de la propiedad', 20, 20)
    pdf.setFontSize(12)
    pdf.text(`Titulo: ${casa.titulo}`, 20, 35)
    pdf.text(`Ubicacion: ${casa.ciudad}, C.P. ${casa.codigo_postal}`, 20, 45)
    pdf.text(`Precio: $${Number(casa.precio).toLocaleString('es-MX')}`, 20, 55)
    pdf.text(`Recamaras: ${casa.recamaras}`, 20, 65)
    pdf.text(`Banos: ${casa.banos}`, 20, 75)
    pdf.text(`Metros construidos: ${casa.metros_construidos} m2`, 20, 85)
    pdf.text(`Descripcion: ${casa.descripcion}`, 20, 95)
    pdf.save(`ficha-casa-${casa.id}.pdf`)
  }

  return (
    <Container fluid="lg" className="detail-page">
      <div className="detail-gallery">
        {[1, 2, 3].map((item) => <img key={item} src={casa.imagen_principal || '/images/header-1.svg'} alt={`${casa.titulo} vista ${item}`} />)}
      </div>
      <div className="detail-layout">
        <section>
          <p className="status-label">{casa.estatus === 'vendida' ? 'Vendida' : 'En venta'}</p>
          <h1>{casa.titulo}</h1>
          <p className="detail-location">{casa.ciudad}, C.P. {casa.codigo_postal}</p>
          <strong className="detail-price">${Number(casa.precio).toLocaleString('es-MX')}</strong>
          <p>{casa.descripcion}</p>
          <h2>Ficha técnica</h2>
          <dl className="technical-grid">
            <div><dt>Recámaras</dt><dd>{casa.recamaras}</dd></div>
            <div><dt>Baños</dt><dd>{casa.banos}</dd></div>
            <div><dt>Construcción</dt><dd>{casa.metros_construidos} m²</dd></div>
            <div><dt>Estatus</dt><dd>{casa.estatus}</dd></div>
          </dl>
          <div className="amenities"><div><h3>Interior</h3><ul><li>Cocina integral</li><li>Estancia amplia</li><li>Closets</li></ul></div><div><h3>Exterior</h3><ul><li>Jardín</li><li>Cochera</li><li>Área de servicio</li></ul></div></div>
          <h2>Formas de pago</h2>
          <ul><li>Contado</li><li>Crédito bancario</li><li>Financiamiento inmobiliario</li></ul>
        </section>
        <aside className="detail-actions">
          <button type="button" className="detail-button" onClick={descargarPDF}>Descargar ficha en PDF</button>
          <Link className="detail-button interest" to={`/contacto?casa=${casa.id}&asunto=Me interesa ${encodeURIComponent(casa.titulo)}`}>Me interesa</Link>
        </aside>
      </div>
      <MapContainer center={[Number(casa.latitud || 25.6866), Number(casa.longitud || -100.3161)]} zoom={14} scrollWheelZoom className="detail-map">
        <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={[Number(casa.latitud || 25.6866), Number(casa.longitud || -100.3161)]}><Popup>{casa.titulo}</Popup></Marker>
      </MapContainer>
    </Container>
  )
}
