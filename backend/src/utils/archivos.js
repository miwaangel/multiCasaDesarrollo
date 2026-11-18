const fs = require('fs');
const path = require('path');
const env = require('../config/env');

/** Carpeta donde multer guarda las imágenes de casas (se sirve como /uploads/casas/...). */
const DIR_CASAS = path.join(env.uploadsDir, 'casas');

/** URL pública que se guarda en imagenes_casa.url para un archivo subido por multer. */
function urlDeArchivo(nombreArchivo) {
  return `/uploads/casas/${nombreArchivo}`;
}

/**
 * Ruta en disco de una URL de imagen, SOLO si es un archivo subido por la API
 * (/uploads/casas/...). Las fotos de los seeders (/uploads/seed/...) se versionan en git
 * y no se borran nunca. Regresa null si la URL no apunta dentro de uploads/casas.
 */
function rutaDeUrl(url) {
  if (typeof url !== 'string' || !url.startsWith('/uploads/casas/')) {
    return null;
  }
  const ruta = path.resolve(DIR_CASAS, path.basename(url));
  return ruta.startsWith(DIR_CASAS + path.sep) ? ruta : null;
}

/** Borra archivos del disco; ignora los que ya no existen. Nunca lanza error. */
async function eliminarArchivos(rutas) {
  await Promise.all(
    rutas.filter(Boolean).map((ruta) =>
      fs.promises.unlink(ruta).catch((err) => {
        if (err.code !== 'ENOENT') {
          console.error(`No se pudo borrar ${ruta}: ${err.message}`);
        }
      }),
    ),
  );
}

module.exports = { DIR_CASAS, urlDeArchivo, rutaDeUrl, eliminarArchivos };
