import { useEffect } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'

const CENTRO_INICIAL = [25.4232, -101.0053] // Saltillo

function AlHacerClic({ onElegir }) {
  useMapEvents({
    click: (event) => onElegir({
      lat: Number(event.latlng.lat.toFixed(6)),
      lng: Number(event.latlng.lng.toFixed(6)),
    }),
  })
  return null
}

function Centrar({ punto }) {
  const map = useMap()
  useEffect(() => {
    if (punto) map.setView(punto, Math.max(map.getZoom(), 14))
  }, [map, punto])
  return null
}

/** Mapa para elegir lat / lng con un clic (el administrador no tiene que saber coordenadas). */
export default function MapaSelector({ lat, lng, onElegir }) {
  const punto = lat !== '' && lng !== '' && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng))
    ? [Number(lat), Number(lng)]
    : null

  return (
    <MapContainer center={punto || CENTRO_INICIAL} zoom={punto ? 15 : 12} scrollWheelZoom className="admin-map">
      <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <AlHacerClic onElegir={onElegir} />
      <Centrar punto={punto} />
      {punto && <Marker position={punto} />}
    </MapContainer>
  )
}
