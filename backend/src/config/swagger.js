const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const { version } = require('../../package.json');

/**
 * Documentación de la API (issue #18).
 *
 * La especificación OpenAPI 3 se arma con los comentarios `@openapi` de cada archivo de
 * rutas (src/routes/*.js): cada quien documenta su endpoint junto al código.
 * Aquí solo va lo general: datos de la API, orden de las secciones y esquemas comunes.
 *
 *   /api/docs       → Swagger UI (probar endpoints desde el navegador)
 *   /api/docs.json  → especificación en JSON (para Postman, Insomnia, etc.)
 */
const definicion = {
  openapi: '3.0.3',
  info: {
    title: 'API MultiCasa',
    version,
    description: [
      'API REST de **Bienes Raíces MultiCasa**: catálogo y búsqueda de casas (sitio público) y',
      'administración de casas, noticias y reportes (sitio privado).',
      '',
      '**Formato de respuesta**',
      '- Éxito: `{ "data": ... }`',
      '- Error: `{ "error": { "codigo": "NO_ENCONTRADO", "mensaje": "...", "detalles": [ { "campo", "mensaje" } ] } }`',
      '',
      '**Rutas de administrador** (`/api/admin/...`): primero haz login en `POST /api/auth/login`,',
      'copia el `token` de la respuesta y pégalo en el botón **Authorize** (arriba a la derecha).',
    ].join('\n'),
  },
  servers: [{ url: '/', description: 'Este servidor' }],
  // Orden en que aparecen las secciones en Swagger UI
  tags: [
    { name: 'Casas (público)', description: 'Destacadas, búsqueda, detalle y ficha en PDF (solo casas en venta)' },
    { name: 'Catálogos', description: 'Amenidades y formas de pago para formularios y filtros' },
    { name: 'Noticias (público)', description: 'Noticias de última hora de la barra lateral' },
    { name: 'Visitas', description: 'Contador de visitas y conectados' },
    { name: 'Contacto', description: 'Formulario de contacto (guarda y envía por correo)' },
    { name: 'Autenticación', description: 'Login de administradores (JWT)' },
    { name: 'Casas (admin)', description: 'CRUD de casas con imágenes, amenidades y formas de pago' },
    { name: 'Noticias (admin)', description: 'CRUD de noticias' },
    { name: 'Dashboard', description: 'Datos para las gráficas del panel' },
    { name: 'Reportes', description: 'Reporte de casas en PDF o Excel' },
    { name: 'Sistema', description: 'Estado del servidor' },
  ],
  components: {
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              codigo: { type: 'string', example: 'DATOS_INVALIDOS' },
              mensaje: { type: 'string', example: 'Revisa los datos enviados' },
              detalles: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: { campo: { type: 'string', example: 'email' }, mensaje: { type: 'string', example: 'El correo no es válido' } },
                },
              },
            },
          },
        },
      },
    },
  },
};

const especificacion = swaggerJsdoc({
  definition: definicion,
  apis: [path.join(__dirname, '../routes/*.js')],
  failOnErrors: true, // un comentario @openapi mal escrito truena al arrancar, no en silencio
});

/** Opciones de Swagger UI. */
const opcionesUi = {
  customSiteTitle: 'API MultiCasa',
  customCss: '.swagger-ui .topbar { background: #18313d } .swagger-ui .info .title { color: #1f5d70 }',
  swaggerOptions: {
    persistAuthorization: true, // el token se conserva al recargar la página
    docExpansion: 'none',
    operationsSorter: 'method',
    tryItOutEnabled: true,
  },
};

module.exports = { especificacion, opcionesUi };
