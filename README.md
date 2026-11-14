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
│   ├── db/                  # Script SQL de la BD (multicasa_database.sql)
│   ├── src/
│   │   ├── config/          # env.js (variables de entorno) y Database.js (Singleton)
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

## Cómo correr el backend

Requisitos: Node.js 18 o superior y MySQL 8.

```bash
cd backend
npm install
cp .env.example .env      # en Windows: copy .env.example .env
# editar .env con los datos de tu MySQL
mysql -u root -p < db/multicasa_database.sql
npm run dev               # http://localhost:3000/api/health
```

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor con recarga automática (nodemon) |
| `npm start` | Servidor normal |
| `npm test` | Pruebas con Jest + Supertest |

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
