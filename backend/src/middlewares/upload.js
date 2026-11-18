const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const AppError = require('../utils/AppError');
const { DIR_CASAS, eliminarArchivos } = require('../utils/archivos');

const MAX_ARCHIVOS = 10;
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB por archivo
const TIPOS_PERMITIDOS = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
};

const storage = multer.diskStorage({
  destination(req, file, cb) {
    fs.mkdir(DIR_CASAS, { recursive: true }, (err) => cb(err, DIR_CASAS));
  },
  // casa-<timestamp>-<random>.<ext>: nunca se repite ni se usa el nombre que mandó el usuario
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `casa-${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
  },
});

// Revisa el tipo MIME y la extensión (las dos deben ser de imagen jpg, png o webp)
function fileFilter(req, file, cb) {
  const extensiones = TIPOS_PERMITIDOS[file.mimetype];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!extensiones || !extensiones.includes(ext)) {
    return cb(new AppError(400, 'ARCHIVO_INVALIDO', `"${file.originalname}" no es una imagen jpg, png o webp`));
  }
  return cb(null, true);
}

const subir = multer({ storage, fileFilter, limits: { fileSize: MAX_BYTES, files: MAX_ARCHIVOS } }).array(
  'imagenes',
  MAX_ARCHIVOS,
);

function traducirErrorMulter(err) {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return new AppError(400, 'ARCHIVO_MUY_GRANDE', 'Cada imagen debe pesar máximo 5 MB');
  }
  if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
    return new AppError(400, 'ARCHIVO_INVALIDO', `Se aceptan hasta ${MAX_ARCHIVOS} imágenes en el campo "imagenes"`);
  }
  return new AppError(400, 'ARCHIVO_INVALIDO', err.message);
}

/**
 * Recibe hasta 10 imágenes en el campo "imagenes" de un multipart/form-data.
 * Deja los archivos en req.files y los demás campos (como texto) en req.body.
 *   tipo no permitido → 400 ARCHIVO_INVALIDO
 *   más de 5 MB       → 400 ARCHIVO_MUY_GRANDE
 * Si la petición termina en error (por ejemplo, la validación de campos falla),
 * los archivos que se alcanzaron a guardar se borran del disco.
 */
function subirImagenes(req, res, next) {
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
}

module.exports = { subirImagenes, MAX_ARCHIVOS, MAX_BYTES };
