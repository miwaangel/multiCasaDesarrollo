const { Router } = require('express');
const AdminNoticiaController = require('../controllers/AdminNoticiaController');
const validar = require('../middlewares/validar');
const { subirImagenNoticia } = require('../middlewares/upload');
const asyncHandler = require('../utils/asyncHandler');
const { reglaId, reglasCrear, reglasActualizar, reglasListaAdmin } = require('../validators/noticia.validators');

/**
 * CRUD de noticias del panel de administración. Se monta en /api/admin/noticias dentro de
 * admin.routes.js, así que todas las rutas exigen "Authorization: Bearer <token>".
 * POST y PUT aceptan JSON o multipart/form-data (si se sube imagen).
 *
 * @openapi
 * components:
 *   schemas:
 *     NoticiaEntrada:
 *       type: object
 *       description: En POST son obligatorios titulo y resumen; en PUT todos son opcionales.
 *       properties:
 *         titulo: { type: string, maxLength: 150, example: Nuevo fraccionamiento en Ramos Arizpe }
 *         resumen: { type: string, maxLength: 255, example: Abrimos la preventa con descuentos especiales. }
 *         contenido: { type: string, example: 'Párrafo 1...\n\nPárrafo 2...' }
 *         activa: { type: boolean, example: true }
 *         imagen: { type: string, format: binary, description: 'Opcional (solo multipart). jpg, png o webp, máx. 5 MB' }
 *
 * /api/admin/noticias:
 *   get:
 *     tags: [Noticias (admin)]
 *     summary: Todas las noticias (activas e inactivas), paginadas
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: pagina, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limite, schema: { type: integer, default: 10, maximum: 50 } }
 *     responses:
 *       200: { description: '{ "data": [ ...noticias completas ], "total": 3, "pagina": 1, "limite": 10 }' }
 *       401: { description: TOKEN_REQUERIDO / TOKEN_INVALIDO }
 *   post:
 *     tags: [Noticias (admin)]
 *     summary: Alta de noticia (creadoPor = admin del token)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/NoticiaEntrada' }
 *         multipart/form-data:
 *           schema: { $ref: '#/components/schemas/NoticiaEntrada' }
 *     responses:
 *       201: { description: '{ "data": { "id": 4, "titulo": "...", "imagenUrl": "/uploads/noticias/noticia-...jpg", "creadoPor": 1, ... } }' }
 *       400: { description: DATOS_INVALIDOS, ARCHIVO_INVALIDO o ARCHIVO_MUY_GRANDE }
 *
 * /api/admin/noticias/{id}:
 *   get:
 *     tags: [Noticias (admin)]
 *     summary: Noticia completa (también inactivas)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses:
 *       200: { description: '{ "data": { ...noticia } }' }
 *       404: { description: NOTICIA_NO_ENCONTRADA }
 *   put:
 *     tags: [Noticias (admin)]
 *     summary: Edita la noticia (solo lo que se envía). "activa" la activa / desactiva; una imagen nueva reemplaza a la anterior
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/NoticiaEntrada' }
 *           example: { activa: false }
 *         multipart/form-data:
 *           schema: { $ref: '#/components/schemas/NoticiaEntrada' }
 *     responses:
 *       200: { description: '{ "data": { ...noticia actualizada } }' }
 *       400: { description: DATOS_INVALIDOS, ARCHIVO_INVALIDO o ARCHIVO_MUY_GRANDE }
 *       404: { description: NOTICIA_NO_ENCONTRADA }
 *   delete:
 *     tags: [Noticias (admin)]
 *     summary: Borra la noticia y el archivo de su imagen
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses:
 *       204: { description: Borrada (sin cuerpo) }
 *       404: { description: NOTICIA_NO_ENCONTRADA }
 */
function adminNoticiaRoutes(controller = new AdminNoticiaController()) {
  const router = Router();
  router.get('/', validar(reglasListaAdmin), asyncHandler(controller.listar));
  router.post('/', subirImagenNoticia, validar(reglasCrear), asyncHandler(controller.crear));
  router.get('/:id', validar(reglaId), asyncHandler(controller.obtener));
  router.put('/:id', subirImagenNoticia, validar(reglasActualizar), asyncHandler(controller.actualizar));
  router.delete('/:id', validar(reglaId), asyncHandler(controller.eliminar));
  return router;
}

module.exports = adminNoticiaRoutes;
