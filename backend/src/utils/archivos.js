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

/** Carpeta uploads del repo (ahí están las fotos de los seeders aunque UPLOADS_DIR apunte a otro lado). */
const UPLOADS_REPO = path.resolve(__dirname, '../../uploads');

/**
 * Ruta en disco para LEER cualquier imagen servida en /uploads/... (subidas o de los seeders),
 * por ejemplo para meterla en un PDF. null si no existe o si intenta salirse de uploads.
 * A diferencia de rutaDeUrl, no sirve para borrar.
 */
function rutaDeLectura(url) {
  if (typeof url !== 'string' || !url.startsWith('/uploads/')) {
    return null;
  }
  const relativa = url.slice('/uploads/'.length);
  for (const base of new Set([path.resolve(env.uploadsDir), UPLOADS_REPO])) {
    const ruta = path.resolve(base, relativa);
    if (ruta.startsWith(base + path.sep) && fs.existsSync(ruta)) {
      return ruta;
    }
  }
  return null;
}

module.exports = { CARPETAS_SUBIDAS, UPLOADS_REPO, dirDe, urlDeArchivo, rutaDeUrl, rutaDeLectura, eliminarArchivos };
