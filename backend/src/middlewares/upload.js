const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const AppError = require('../utils/AppError');
const { dirDe, eliminarArchivos } = require('../utils/archivos');

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB por archivo
const TIPOS_PERMITIDOS = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
};

// Revisa el tipo MIME y la extensión (las dos deben ser de imagen jpg, png o webp)
function fileFilter(req, file, cb) {
  const extensiones = TIPOS_PERMITIDOS[file.mimetype];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!extensiones || !extensiones.includes(ext)) {
    return cb(new AppError(400, 'ARCHIVO_INVALIDO', `"${file.originalname}" no es una imagen jpg, png o webp`));
  }
  return cb(null, true);
}

/**
 * Crea un middleware de multer para recibir imágenes en multipart/form-data.
 *   carpeta     → backend/uploads/<carpeta>/ (se sirve en /uploads/<carpeta>/...)
 *   prefijo     → nombre único <prefijo>-<timestamp>-<random>.<ext>
 *   campo       → nombre del campo de archivo en el formulario
 *   maxArchivos → cuántos archivos acepta ese campo
 * Deja los archivos en req.files (siempre un arreglo) y los demás campos en req.body.
 *   tipo no permitido o demasiados archivos → 400 ARCHIVO_INVALIDO
 *   más de 5 MB                             → 400 ARCHIVO_MUY_GRANDE
 * Si la petición termina en error (por ejemplo, la validación de campos falla),
 * los archivos que se alcanzaron a guardar se borran del disco.
 */
function crearSubida({ carpeta, prefijo, campo, maxArchivos }) {
  const dir = dirDe(carpeta);

  const storage = multer.diskStorage({
    destination(req, file, cb) {
      fs.mkdir(dir, { recursive: true }, (err) => cb(err, dir));
    },
    // Nunca se repite ni se usa el nombre que mandó el usuario
    filename(req, file, cb) {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${prefijo}-${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
    },
  });

  const subir = multer({ storage, fileFilter, limits: { fileSize: MAX_BYTES, files: maxArchivos } }).array(
    campo,
    maxArchivos,
  );

  function traducirErrorMulter(err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return new AppError(400, 'ARCHIVO_MUY_GRANDE', 'Cada imagen debe pesar máximo 5 MB');
    }
    if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
      const cuantas = maxArchivos === 1 ? 'una sola imagen' : `hasta ${maxArchivos} imágenes`;
      return new AppError(400, 'ARCHIVO_INVALIDO', `Se acepta ${cuantas} en el campo "${campo}"`);
    }
    return new AppError(400, 'ARCHIVO_INVALIDO', err.message);
  }

  return function subirArchivos(req, res, next) {
    subir(req, res, (err) => {
      res.on('finish', () => {
        if (res.statusCode >= 400 && req.files?.length) {
          eliminarArchivos(req.files.map((f) => f.path));
        }
      });

      if (!err) {
        req.files = req.files || [];
        return next();
      }
      return next(err instanceof multer.MulterError ? traducirErrorMulter(err) : err);
    });
  };
}

/** Casas: hasta 10 imágenes en el campo "imagenes" → uploads/casas/ */
const subirImagenes = crearSubida({ carpeta: 'casas', prefijo: 'casa', campo: 'imagenes', maxArchivos: 10 });

/** Noticias: una imagen opcional en el campo "imagen" → uploads/noticias/ */
const subirImagenNoticia = crearSubida({ carpeta: 'noticias', prefijo: 'noticia', campo: 'imagen', maxArchivos: 1 });

module.exports = { crearSubida, subirImagenes, subirImagenNoticia, MAX_BYTES };
