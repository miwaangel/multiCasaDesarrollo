const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');

/** Tamaño máximo (lado mayor) y calidad de las imágenes que se guardan. */
const OPCIONES = Object.freeze({ maxLado: 1600, calidad: 80 });

/**
 * Optimiza una imagen recién subida (la "optimización de imágenes" de la rúbrica, hecha en el servidor):
 * - la gira según su EXIF (fotos de celular) y quita los metadatos (ubicación GPS, modelo de cámara);
 * - si mide más de 1600 px por lado la reduce, sin agrandar las pequeñas;
 * - la guarda como JPEG progresivo (mozjpeg, calidad 80). Las PNG con transparencia van sobre fondo blanco.
 * Se usa JPEG y no WebP porque pdfkit (ficha técnica en PDF) solo lee JPEG y PNG.
 *
 * Recibe el archivo que dejó multer y regresa sus datos nuevos { path, filename, size, mimetype }.
 * Si el archivo no es una imagen real (aunque tenga extensión .jpg) lanza un error.
 */
async function optimizarImagen(archivo, { maxLado, calidad } = OPCIONES) {
  const { dir, name } = path.parse(archivo.path);
  const destino = path.join(dir, `${name}.jpg`);
  const temporal = `${destino}.tmp`;

  let info;
  try {
    info = await sharp(archivo.path, { failOn: 'error' })
      .rotate()
      .resize({ width: maxLado, height: maxLado, fit: 'inside', withoutEnlargement: true })
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: calidad, mozjpeg: true, progressive: true })
      .toFile(temporal);
  } catch (err) {
    await fs.rm(temporal, { force: true });
    throw err;
  }

  if (archivo.path !== destino) {
    await fs.rm(archivo.path, { force: true });
  }
  await fs.rename(temporal, destino);

  return { path: destino, filename: path.basename(destino), size: info.size, mimetype: 'image/jpeg' };
}

module.exports = { optimizarImagen, OPCIONES };
