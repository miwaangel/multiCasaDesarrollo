const fs = require('fs');
const path = require('path');
const env = require('../config/env');

/**
 * Carpetas de uploads donde la API guarda archivos (se sirven como /uploads/<carpeta>/...).
 * Las fotos de los seeders (/uploads/seed/...) NO están aquí: se versionan en git y nunca se borran.
 */
const CARPETAS_SUBIDAS = Object.freeze(['casas', 'noticias']);

/** Ruta en disco de una carpeta de subidas (por ejemplo backend/uploads/casas). */
function dirDe(carpeta) {
  return path.join(env.uploadsDir, carpeta);
}

/** URL pública que se guarda en la BD para un archivo subido por multer. */
function urlDeArchivo(carpeta, nombreArchivo) {
  return `/uploads/${carpeta}/${nombreArchivo}`;
}

/**
 * Ruta en disco de una URL de imagen, SOLO si es un archivo subido por la API
 * (/uploads/casas/... o /uploads/noticias/...). Regresa null para cualquier otra URL
 * (seed, externas, vacías) o si intenta salirse de su carpeta.
 */
function rutaDeUrl(url) {
  if (typeof url !== 'string') {
    return null;
  }
  const carpeta = CARPETAS_SUBIDAS.find((c) => url.startsWith(`/uploads/${c}/`));
  if (!carpeta) {
    return null;
  }
  const dir = dirDe(carpeta);
  const ruta = path.resolve(dir, path.basename(url));
  return ruta.startsWith(dir + path.sep) ? ruta : null;
}

/** Borra archivos del disco; ignora los null y los que ya no existen. Nunca lanza error. */
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

module.exports = { CARPETAS_SUBIDAS, dirDe, urlDeArchivo, rutaDeUrl, eliminarArchivos };
