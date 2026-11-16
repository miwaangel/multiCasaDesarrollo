# MultiCasa

Aplicación web de bienes raíces: catálogo y búsqueda de casas con mapa (sitio público) y administración de casas, noticias y reportes (sitio privado para administradores).

| Capa | Tecnología |
|---|---|
| Front end | React (Vite) + React-Bootstrap |
| Back end | Node.js + Express (API REST) |
| ORM | Sequelize |
| Base de datos | MySQL |

## Estructura del repositorio

```
multiCasaDesarrollo/
├── backend/
│   ├── src/
│   │   ├── config/          # env.js (variables de entorno) y Database.js (Singleton)
│   │   ├── database/        # sequelize-cli: config.js, migrations/ y seeders/
│   │   ├── controllers/     # Reciben req/res, llaman al service y responden
│   │   ├── services/        # Lógica de negocio (no conocen Express)
│   │   ├── repositories/    # Acceso a datos con Sequelize (BaseRepository)
│   │   ├── models/          # Modelos de Sequelize y sus relaciones
│   │   ├── routes/          # Rutas de Express, montadas en /api
│   │   ├── middlewares/     # Auth, manejo de errores, 404
│   │   ├── utils/           # AppError, asyncHandler
│   │   ├── app.js           # Construye la app de Express (sin listen)
│   │   └── server.js        # Conecta la BD y levanta el servidor
│   ├── tests/               # Jest + Supertest
│   ├── uploads/             # Imágenes subidas (no se versionan)
│   └── .env.example
├── frontend/                # Proyecto React (Vite)
└── docs/                    # Documentación y diagrama de Gantt
```

## Documentación

- [Modelo físico de la base de datos](docs/base-de-datos/README.md): diagrama entidad-relación, tablas, índices, vistas y script SQL de referencia.

## Patrones de diseño

### 1. Arquitectura en capas: Controller → Service → Repository

Cada petición pasa por tres capas, cada una con una sola responsabilidad:

```
HTTP → routes → Controller → Service → Repository → Sequelize → MySQL
```

| Capa | Responsabilidad | No debe |
|---|---|---|
| **Controller** | Leer `req` (params, query, body), llamar al service y responder `{ data }` | Tener lógica de negocio ni consultar la BD |
| **Service** | Reglas de negocio (validar, calcular, coordinar varios repositorios) | Conocer `req`/`res` ni Express |
| **Repository** | Consultas a la BD con Sequelize | Tener reglas de negocio |

Todos los repositorios heredan de `BaseRepository`, que ya trae `findAll`, `findById`, `findByIdOrFail`, `findOne`, `count`, `create`, `update` y `delete`:

```js
class CasaRepository extends BaseRepository {
  constructor() {
    super(Casa);
  }

  findDestacadas() {
    return this.findAll({ where: { destacada: true, estatus: 'venta' } });
  }
}
```

Las dependencias se pasan por el constructor (`new CasaService(new CasaRepository())`), así en las pruebas se puede usar un repositorio falso.

### 2. Singleton: `Database`

`src/config/Database.js` garantiza una sola conexión (pool) de Sequelize en toda la app:

```js
const { sequelize } = Database.getInstance(); // siempre la misma instancia
```

`new Database()` lanza un error; siempre se usa `getInstance()`.

## Formato de respuestas de la API

```json
// Éxito
{ "data": { ... } }

// Error
{ "error": { "codigo": "NO_ENCONTRADO", "mensaje": "Casa con id 9 no existe" } }
```

En un service o repository basta con `throw AppError.notFound('...')` (o `badRequest`, `unauthorized`, `forbidden`); el middleware `errorHandler` arma la respuesta.

Si la validación de express-validator falla (middleware `validar`), el error trae además el detalle por campo:

```json
{ "error": { "codigo": "DATOS_INVALIDOS", "mensaje": "Revisa los datos enviados",
             "detalles": [{ "campo": "email", "mensaje": "El email no es válido" }] } }
```

## Autenticación de administradores (JWT)

| Endpoint | Qué hace |
|---|---|
| `POST /api/auth/login` | Recibe `{ email, password }` y regresa `{ data: { token, admin } }`. Error: `401 CREDENCIALES_INVALIDAS` |
| `GET /api/admin/perfil` | Datos del admin dueño del token |

- El token dura `JWT_EXPIRES_IN` (8h) y se firma con `JWT_SECRET` de tu `.env`. Genera tu propio secreto con:
  `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- El frontend lo manda en cada petición privada: `Authorization: Bearer <token>`.
- **Todas** las rutas montadas dentro de `src/routes/admin.routes.js` ya están protegidas (el middleware `auth` se aplica a todo el router). Para un módulo privado nuevo basta con agregar ahí `router.use('/casas', adminCasaRoutes());`. Errores: `401 TOKEN_REQUERIDO` (sin token) y `401 TOKEN_INVALIDO` (firma incorrecta o vencido).
- En el controller, el admin autenticado está en `req.admin` (`{ id, email }`).

## Cómo correr el backend

Requisitos: Node.js 18 o superior y MySQL 8.

```bash
cd backend
npm install
cp .env.example .env      # en Windows: copy .env.example .env
# editar .env con los datos de tu MySQL
npm run db:create         # crea la base de datos multicasa (utf8mb4)
npm run db:migrate        # crea las 10 tablas y las 2 vistas
npm run db:seed           # datos de prueba: admin, catálogos, 20 casas y 3 noticias
npm run dev               # http://localhost:3000/api/health
```

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor con recarga automática (nodemon) |
| `npm start` | Servidor normal |
| `npm test` | Pruebas con Jest + Supertest |
| `npm run db:create` | Crea la base de datos indicada en `DB_NAME` |
| `npm run db:migrate` | Ejecuta las migraciones pendientes |
| `npm run db:undo` | Revierte la última migración (`db:undo:all` revierte todas) |
| `npm run db:seed` | Carga los seeders (datos de catálogo y de prueba) |
| `npm run db:reset` | Revierte seeders y migraciones, vuelve a migrar y carga los seeders (deja la BD como recién instalada) |

Admin de prueba que crean los seeders: `admin@multicasa.com` con la contraseña de `SEED_ADMIN_PASSWORD` en tu `.env` (si está vacía, `Admin123!`). Las fotos de las casas de prueba están en `backend/uploads/seed/`.

La base de datos se crea **solo con las migraciones de Sequelize**. El script [`docs/base-de-datos/multicasa_database.sql`](docs/base-de-datos/multicasa_database.sql) es la referencia de diseño; si cambias una tabla, crea una migración nueva y actualiza también ese documento.

## Cómo agregar un módulo nuevo (ejemplo: casas)

1. `models/Casa.js` y registrarlo en `models/index.js`
2. `repositories/CasaRepository.js` (extiende `BaseRepository`)
3. `services/CasaService.js`
4. `controllers/CasaController.js`
5. `routes/casa.routes.js` y montarlo en `routes/index.js`
6. Pruebas en `tests/`

## Equipo

| Integrante | Área |
|---|---|
| Angel | Base de datos y API |
| Orlando | Back end |
| Alanis | Front end |
