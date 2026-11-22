const { Router } = require('express');
const AdminCasaController = require('../controllers/AdminCasaController');
const validar = require('../middlewares/validar');
const { subirImagenes } = require('../middlewares/upload');
const asyncHandler = require('../utils/asyncHandler');
const {
  reglaId,
  reglasImagen,
  reglasCrear,
  reglasActualizar,
  reglasEstatus,
  reglasListado,
} = require('../validators/casa.validators');

/**
 * CRUD de casas del panel de administración. Se monta en /api/admin/casas dentro de
 * admin.routes.js, así que todas las rutas ya exigen "Authorization: Bearer <token>".
 * Orden en POST/PUT: auth → multer (guarda imágenes) → validar campos → controller.
 *
 * @openapi
 * components:
 *   schemas:
 *     CasaMultipart:
 *       type: object
 *       description: >
 *         Campos de la casa en camelCase (todos como texto en multipart). En POST son obligatorios
 *         titulo, precio, direccion, colonia, ciudad, estado, codigoPostal, lat y lng; en PUT todos son opcionales.
 *       properties:
 *         titulo: { type: string, maxLength: 150, example: Casa con jardín en Los Pinos }
 *         descripcion: { type: string }
 *         tipo: { type: string, enum: [casa, departamento, terreno] }
 *         precio: { type: number, example: 1850000 }
 *         estatus: { type: string, enum: [venta, vendida] }
 *         destacada: { type: boolean }
 *         direccion: { type: string, example: Calle Nogal 123 }
 *         colonia: { type: string, example: Los Pinos }
 *         ciudad: { type: string, example: Saltillo }
 *         estado: { type: string, example: Coahuila }
 *         codigoPostal: { type: string, pattern: '^[0-9]{5}$', example: '25198' }
 *         lat: { type: number, example: 25.4321 }
 *         lng: { type: number, example: -100.9876 }
 *         m2Terreno: { type: number }
 *         m2Construccion: { type: number }
 *         recamaras: { type: integer, minimum: 0 }
 *         banos: { type: number, minimum: 0, example: 2.5 }
 *         estacionamientos: { type: integer, minimum: 0 }
 *         plantas: { type: integer, minimum: 0 }
 *         orientacion: { type: string, enum: [norte, sur, oriente, poniente] }
 *         amenidadIds: { type: array, items: { type: integer }, example: [1, 3, 9], description: 'También "1,3,9" o "[1,3,9]"' }
 *         formaPagoIds: { type: array, items: { type: integer }, example: [1, 2] }
 *         imagenes:
 *           type: array
 *           maxItems: 10
 *           items: { type: string, format: binary }
 *           description: jpg, png o webp de máximo 5 MB cada una. En el alta la primera es la portada.
 *
 * /api/admin/casas:
 *   get:
 *     tags: [Casas (admin)]
 *     summary: Todas las casas (venta y vendidas) con su portada, filtros y paginación
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: estatus, schema: { type: string, enum: [venta, vendida] } }
 *       - { in: query, name: busqueda, schema: { type: string }, description: Busca en título o colonia }
 *       - { in: query, name: pagina, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limite, schema: { type: integer, default: 10, maximum: 50 } }
 *     responses:
 *       200: { description: '{ "data": [ { ...casa, "portada": "/uploads/..." } ], "total": 20, "pagina": 1, "limite": 10 }' }
 *       401: { description: TOKEN_REQUERIDO / TOKEN_INVALIDO }
 *   post:
 *     tags: [Casas (admin)]
 *     summary: Alta de una casa con imágenes, amenidades y formas de pago (multipart/form-data)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema: { $ref: '#/components/schemas/CasaMultipart' }
 *           encoding:
 *             imagenes: { contentType: 'image/jpeg, image/png, image/webp' }
 *     responses:
 *       201: { description: '{ "data": { ...casa con imagenes, amenidades y formasPago } }' }
 *       400: { description: 'DATOS_INVALIDOS (con detalles por campo), ARCHIVO_INVALIDO o ARCHIVO_MUY_GRANDE' }
 *       401: { description: TOKEN_REQUERIDO / TOKEN_INVALIDO }
 *
 * /api/admin/casas/{id}:
 *   get:
 *     tags: [Casas (admin)]
 *     summary: Detalle completo de una casa (incluye vendidas)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses:
 *       200: { description: '{ "data": { ...casa, "imagenes": [...], "amenidades": [...], "formasPago": [...] } }' }
 *       404: { description: CASA_NO_ENCONTRADA }
 *   put:
 *     tags: [Casas (admin)]
 *     summary: Edita una casa. Las imágenes nuevas se AGREGAN; amenidadIds y formaPagoIds, si vienen, REEMPLAZAN
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema: { $ref: '#/components/schemas/CasaMultipart' }
 *     responses:
 *       200: { description: '{ "data": { ...casa actualizada } }' }
 *       400: { description: 'DATOS_INVALIDOS, ARCHIVO_INVALIDO o ARCHIVO_MUY_GRANDE' }
 *       404: { description: CASA_NO_ENCONTRADA }
 *   delete:
 *     tags: [Casas (admin)]
 *     summary: Borra la casa, sus imágenes (en cascada) y los archivos del disco
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses:
 *       204: { description: Borrada (sin cuerpo) }
 *       404: { description: CASA_NO_ENCONTRADA }
 *
 * /api/admin/casas/{id}/estatus:
 *   patch:
 *     tags: [Casas (admin)]
 *     summary: Marca la casa como vendida (fecha_venta = hoy, deja de ser destacada) o la regresa a venta
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [estatus]
 *             properties: { estatus: { type: string, enum: [venta, vendida] } }
 *     responses:
 *       200: { description: '{ "data": { ...casa, "estatus": "vendida", "fechaVenta": "2026-11-16", "destacada": false } }' }
 *       404: { description: CASA_NO_ENCONTRADA }
 *
 * /api/admin/casas/{id}/imagenes/{imagenId}:
 *   delete:
 *     tags: [Casas (admin)]
 *     summary: Borra una imagen y su archivo; si era la portada, la siguiente por orden pasa a serlo
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *       - { in: path, name: imagenId, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: '{ "data": { ...casa con sus imágenes restantes } }' }
 *       404: { description: CASA_NO_ENCONTRADA o IMAGEN_NO_ENCONTRADA }
 */
function adminCasaRoutes(controller = new AdminCasaController()) {
  const router = Router();
  router.get('/', validar(reglasListado), asyncHandler(controller.listar));
  router.post('/', subirImagenes, validar(reglasCrear), asyncHandler(controller.crear));
  router.get('/:id', validar(reglaId), asyncHandler(controller.obtener));
  router.put('/:id', subirImagenes, validar(reglasActualizar), asyncHandler(controller.actualizar));
  router.patch('/:id/estatus', validar(reglasEstatus), asyncHandler(controller.cambiarEstatus));
  router.delete('/:id', validar(reglaId), asyncHandler(controller.eliminar));
  router.delete('/:id/imagenes/:imagenId', validar(reglasImagen), asyncHandler(controller.eliminarImagen));
  return router;
}

module.exports = adminCasaRoutes;
