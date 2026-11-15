# Fotos de los seeders

Imágenes de las 20 casas de prueba que cargan los seeders (`backend/src/database/seeders/`).
Esta carpeta **sí** se sube al repositorio; el resto de `backend/uploads/` (fotos que suben los administradores) no.

## Nombres

Dos imágenes por casa, donde `XX` es el id de la casa con dos dígitos (`01` a `20`):

| Archivo | Uso |
|---|---|
| `casa-XX-1.jpg` | Portada (`es_portada = true`, `orden = 1`) |
| `casa-XX-2.jpg` | Segunda imagen (`orden = 2`) |

La API las sirve en `/uploads/seed/casa-XX-N.jpg`, que es la `url` guardada en `imagenes_casa`.

## Para reemplazar una foto

Guarda la nueva imagen con el **mismo nombre** (JPG, máximo ~1280 px por lado para que la página cargue rápido). No hace falta volver a correr los seeders.

Las fotos son de [Unsplash](https://unsplash.com) (licencia libre). Las de los terrenos (`casa-08-*` y `casa-12-*`) son recortes de jardines; conviene cambiarlas por fotos de lotes reales cuando se tengan.
