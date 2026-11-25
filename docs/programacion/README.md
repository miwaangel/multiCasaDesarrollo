# Documento de programación — MultiCasa

Este documento explica cómo se programó **MultiCasa**: herramientas, convenciones de trabajo y la parte que desarrolló cada integrante del equipo, con fragmentos del código real.

| Integrante | Usuario de GitHub | Área |
|---|---|---|
| Angel | `miwaangel` | Base de datos y API (modelos, login, CRUD de casas, dashboard, noticias y visitas) |
| Orlando | `Tusked-D` | Backend (estructura, búsqueda, contacto, PDF, reporte, Swagger), integración y multimedia |
| Alanis | `Angel-Alanis` | Frontend en React (layout del PSD, pantallas públicas y panel de administrador) |

## 1. Herramientas y tecnologías

| Área | Herramienta | Versión |
|---|---|---|
| Lenguaje | JavaScript (ES2022) | — |
| Entorno | Node.js | 20+ |
| Backend | Express | 4.22 |
| ORM | Sequelize + mysql2 | 6.37 |
| Base de datos | MySQL / MariaDB (XAMPP) | 8 / 10.6+ |
| Validación | express-validator | 7.3 |
| Seguridad | jsonwebtoken, bcryptjs | 9.0 / 3.0 |
| Archivos e imágenes | multer, sharp | 2.5 / 0.34 |
| PDF y Excel | pdfkit, exceljs | 0.17 / 4.4 |
| Correo | nodemailer | 7.0 |
| Documentación de la API | swagger-jsdoc, swagger-ui-express | 6.3 / 5.0 |
| Pruebas | Jest, Supertest | 30.5 / 7.3 |
| Frontend | React, Vite | 19.3 / 8.3 |
| UI | React-Bootstrap, Bootstrap | 2.10 / 5.3 |
| Rutas | react-router-dom | 7.18 |
| Mapas | Leaflet, react-leaflet | 1.9 / 5.0 |
| Gráficas | Recharts | 3.11 |
| Cliente HTTP | Axios | 1.21 |
| Control de versiones | Git + GitHub (issues, ramas y pull requests) | — |
| Editor | Visual Studio Code | — |

## 2. Forma de trabajo

### 2.1 Flujo con Git y GitHub

1. Cada tarea del [diagrama de Gantt](../Multicasa_Gantt.xlsx) es un **issue** en GitHub con su responsable (#1 a #33).
2. Por cada issue se crea una rama desde `develop`: `feature/<número>-<nombre>`, por ejemplo `feature/13-busqueda`, o `fix/<nombre>` para correcciones.
3. Los commits siguen el formato `tipo: [issue] descripción`, por ejemplo `feat: [13] búsqueda por C.P. o ciudad + radio en km (Closes #13)`. `Closes #13` cierra el issue al hacer merge.
4. Se abre un **pull request** hacia `develop`, otro integrante lo revisa y se hace merge.
5. Al terminar, `develop` se pasa a `main`, que es la versión que se entrega.

### 2.2 Convenciones de código

| Elemento | Convención | Ejemplo |
|---|---|---|
| Clases | PascalCase, un archivo por clase | `CasaService.js`, `class CasaService` |
| Variables y funciones | camelCase en español | `findByIdOrFail`, `reemplazarAmenidades` |
| Tablas y columnas | snake_case | `imagenes_casa`, `fecha_venta` |
| Componentes de React | PascalCase, uno por archivo | `SearchSidebar.jsx` |
| Respuestas de la API | `{ data }` en éxito, `{ error: { codigo, mensaje } }` en error | `404 CASA_NO_ENCONTRADA` |
| Variables de entorno | Solo se leen en `backend/src/config/env.js` | `env.jwt.secret` |
| Errores | `throw AppError.notFound(...)`; el middleware `errorHandler` arma la respuesta | — |

### 2.3 Programación orientada a objetos

Todo el backend está hecho con clases (47 en total): la aplicación (`App`), la conexión (`Database`), los modelos (`class Casa extends Model`), los repositorios (`class CasaRepository extends BaseRepository`), los servicios, los controladores, los generadores de PDF y reportes, y los errores (`class AppError extends Error`). Se usan:

- **Encapsulamiento:** campos y métodos privados con `#`, por ejemplo `Database.#instance` o `CasaRepository.#distanciaEnMetros()`.
- **Herencia:** `BaseRepository` (abstracta) → `CasaRepository`, `NoticiaRepository`...
- **Polimorfismo:** `ReportePdf` y `ReporteExcel` tienen el mismo método `generar()` y el servicio los usa sin saber cuál es.
- **Composición e inyección de dependencias:** los servicios reciben sus repositorios en el constructor.

## 3. Parte de Angel — Base de datos y API

Issues #6, #7, #8, #9, #10, #11 y #12.

### 3.1 Modelo físico, migraciones y seeders (#6, #7, #8)

- El modelo físico (10 tablas y 2 vistas) está documentado en [`docs/base-de-datos`](../base-de-datos/README.md).
- La base se crea con **11 migraciones** de Sequelize (`backend/src/database/migrations`): administradores, casas, imágenes, formas de pago, amenidades, tablas puente, noticias, visitas, mensajes de contacto y vistas del dashboard.
- Los **seeders** cargan el administrador de prueba, los catálogos, 20 casas reales de Saltillo, Ramos Arizpe y Monterrey con coordenadas y 2 fotos cada una, y 3 noticias.
- Los modelos son clases que heredan de `Model` y repiten los CHECK de la base para dar mensajes claros:

```js
class Casa extends Model {
  static initModel(sequelize) {
    return this.init(
      {
        titulo: {
          type: DataTypes.STRING(150),
          allowNull: false,
          validate: { notEmpty: { msg: 'El título es obligatorio' } },
        },
        tipo: {
          type: DataTypes.ENUM('casa', 'departamento', 'terreno'),
          allowNull: false,
          defaultValue: 'casa',
        },
        // ...
```

### 3.2 Conexión Singleton

`backend/src/config/Database.js` garantiza una sola conexión (pool) para toda la aplicación:

```js
class Database {
  static #instance = null;

  constructor() {
    if (Database.#instance) {
      throw new Error('Database es un Singleton: usa Database.getInstance()');
    }
    this.#sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, { /* ... */ });
  }

  static getInstance() {
    if (!Database.#instance) {
      Database.#instance = new Database();
    }
    return Database.#instance;
  }
}
```

### 3.3 Login de administradores con JWT y bcrypt (#9)

`backend/src/services/AuthService.js` compara la contraseña con bcrypt y firma un token de 8 horas. Si el correo no existe, compara contra un hash de relleno para que la respuesta tarde lo mismo y no revele qué correos existen:

```js
async login(email, password) {
  const admin = await this.repository.findByEmailConPassword(email);
  const passwordCorrecto = await bcrypt.compare(password, admin ? admin.passwordHash : HASH_DE_RELLENO);

  if (!admin || !admin.activo || !passwordCorrecto) {
    throw AppError.unauthorized('Email o contraseña incorrectos', 'CREDENCIALES_INVALIDAS');
  }

  const token = jwt.sign({ id: admin.id, email: admin.email }, this.#secreto(), {
    algorithm: 'HS256',
    expiresIn: this.config.expiresIn,
  });
  return { token, admin: { id: admin.id, nombre: admin.nombre, email: admin.email } };
}
```

El middleware `backend/src/middlewares/auth.js` protege todo `/api/admin`: lee el header `Authorization: Bearer <token>`, lo verifica y deja al administrador en `req.admin`.

### 3.4 CRUD de casas con imágenes (#10)

- Alta, edición, cambio de estatus y baja en `AdminCasaController` y `CasaService`.
- Las imágenes llegan como `multipart/form-data` (multer), se optimizan con `sharp` y se guardan en `uploads/casas/`.
- La alta es una **transacción**: si algo falla, MySQL deshace todo y el servicio borra del disco las imágenes recién subidas:

```js
async crear(datos, archivos, adminId) {
  const { amenidadIds, formaPagoIds, ...campos } = datos;
  try {
    await this.#validarCatalogos(amenidadIds, formaPagoIds);

    const casaId = await this.casas.transaccion(async (t) => {
      const casa = await this.casas.create(
        { ...campos, ...this.#reglasDeEstatus(campos), creadoPor: adminId },
        { transaction: t },
      );
      await this.imagenes.agregar(casa.id, archivos.map((a) => urlDeArchivo('casas', a.filename)), t);
      if (amenidadIds) await this.casas.reemplazarAmenidades(casa, amenidadIds, t);
      if (formaPagoIds) await this.casas.reemplazarFormasPago(casa, formaPagoIds, t);
      return casa.id;
    });

    return this.obtenerAdmin(casaId);
  } catch (err) {
    // ROLLBACK ya deshizo la BD; ahora se quitan del disco las imágenes que subió esta petición
    await eliminarArchivos(archivos.map((a) => a.path));
    throw err;
  }
}
```

- Al marcar una casa como vendida (`PATCH /api/admin/casas/:id/estatus`) se guarda `fecha_venta`, deja de ser destacada y desaparece del sitio público.

### 3.5 Dashboard (#11)

`DashboardRepository` lee dos **vistas de MySQL** (creadas en una migración): casas por rango de precio y casas por estatus. `DashboardService` completa con 0 los rangos sin casas para que la gráfica siempre muestre los 5.

### 3.6 Noticias y contador de visitas (#12)

- CRUD de noticias con imagen opcional y noticias públicas para la barra lateral.
- `POST /api/visitas` registra cada página visitada. Para proteger la privacidad **no se guarda la IP**, solo un hash `SHA-256(IP + navegador + VISITAS_SALT)`. Si el mismo visitante recarga la misma página en menos de 10 segundos, no se cuenta dos veces.
- `GET /api/visitas/resumen` regresa el total de visitas y los "conectados" (visitantes distintos de los últimos 5 minutos).

## 4. Parte de Orlando — Backend, integración y multimedia

Issues #4, #13, #14, #15, #16, #17, #18, #28 y #29.

### 4.1 Estructura del repositorio y patrón Controller → Service → Repository (#4)

Orlando creó la estructura de carpetas y la clase abstracta `BaseRepository`, de la que heredan todos los repositorios:

```js
class BaseRepository {
  constructor(model) {
    if (new.target === BaseRepository) {
      throw new Error('BaseRepository es abstracta: crea una clase que la extienda');
    }
    this.model = model;
  }

  async findByIdOrFail(id, options = {}) {
    const registro = await this.findById(id, options);
    if (!registro) {
      throw AppError.notFound(`${this.model.name} con id ${id} no existe`);
    }
    return registro;
  }
  // findAll, findById, findOne, count, create, update, delete...
}
```

### 4.2 Búsqueda por C.P. o ciudad + radio en km (#13)

1. `GeocodingService` convierte el C.P. o la ciudad en coordenadas. Primero busca en las casas de la base de datos; si no la encuentra, consulta **Nominatim (OpenStreetMap)** y guarda el resultado en caché.
2. `CasaRepository` calcula la distancia de cada casa al centro con la función de MySQL **`ST_Distance_Sphere`**, filtra las que quedan dentro del radio y las ordena de la más cercana a la más lejana.

```js
async buscar({ ubicacion, radioKm, ...filtros } = {}) {
  let centro = null;
  const criterios = { ...filtros };

  if (ubicacion && radioKm) {
    centro = await this.geocoding.geocodificar(ubicacion);
    if (!centro) {
      throw AppError.notFound(`No encontramos "${ubicacion}". ...`, 'UBICACION_NO_ENCONTRADA');
    }
    Object.assign(criterios, { centro, radioKm });
  } else if (ubicacion) {
    // "Sin rango": solo casas de ese C.P. o de esa ciudad
    criterios[/^\d{5}$/.test(ubicacion) ? 'codigoPostal' : 'ciudad'] = ubicacion;
  }

  const casas = await this.casas.buscar(criterios);
  return { casas: casas.map((casa) => this.#tarjeta(casa, { publica: true })), centro: centro && { ...centro, radioKm } };
}
```

### 4.3 Formulario de contacto por correo (#14)

`ContactoService` guarda el mensaje en `mensajes_contacto` y lo envía con **nodemailer** (`MailService`) al correo de la inmobiliaria, con "Responder a" apuntando al cliente. Si el correo falla, el mensaje ya quedó guardado. Un campo trampa invisible descarta los envíos de bots.

### 4.4 Ficha técnica en PDF — patrón Builder (#15)

`backend/src/pdf/DocumentoPdf.js` envuelve a pdfkit con métodos que se encadenan. `FichaPdfService` arma la ficha de una casa así:

```js
const documento = new DocumentoPdf({ titulo: 'Ficha técnica' })
  .encabezado(`Propiedad #${casa.id}`)
  .titular(casa.titulo, { subtitulo: ficha.ubicacion, destacado: dinero(casa.precio) })
  .etiqueta(`${TIPOS[casa.tipo] ?? casa.tipo} en venta`.toUpperCase())
  .imagen(rutaDeLectura(ficha.portada))
  .seccion('Características')
  .datos(ficha.caracteristicas, { columnas: 3 })
  .seccion('Descripción')
  .parrafo(casa.descripcion)
  .seccion('Amenidades interiores')
  .lista(ficha.interiores, { columnas: 2, vacio: 'Sin amenidades interiores registradas' })
  .seccion('Amenidades exteriores')
  .lista(ficha.exteriores, { columnas: 2, vacio: 'Sin amenidades exteriores registradas' })
  .seccion('Formas de pago aceptadas')
  .bloques(ficha.formasPago, { vacio: 'Consulta las formas de pago con un asesor' })
```

### 4.5 Reporte de todas las casas — patrón Strategy (#17)

Cada formato es una clase con el mismo método `generar()`. El servicio elige la estrategia según el parámetro `formato`:

```js
const FORMATOS = Object.freeze({ pdf: ReportePdf, xlsx: ReporteExcel });

async reporteCasas({ formato = 'pdf', estatus, generadoPor = 'administrador' } = {}) {
  const Estrategia = FORMATOS[formato];
  const casas = await this.casas.findParaReporte({ estatus });
  const resumen = ReporteService.resumen(casas);

  const archivo = await new Estrategia().generar({ casas, resumen, generadoPor, filtro: estatus });
  const hoy = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Monterrey' });

  return {
    archivo,
    contentType: Estrategia.contentType,
    nombreArchivo: `reporte-casas${estatus ? `-${estatus}` : ''}-${hoy}.${Estrategia.extension}`,
  };
}
```

El reporte incluye **todas** las casas (en venta y vendidas) con su estatus, y un resumen con totales y valores. El Excel trae una hoja de resumen con fórmulas.

### 4.6 Documentación de la API con Swagger (#18)

Cada ruta tiene un comentario `@openapi` junto a su código. `swagger-jsdoc` los junta en una especificación OpenAPI 3 que se ve en **`/api/docs`**, donde se puede probar cada endpoint. La prueba `docs.test.js` falla si algún endpoint queda sin documentar.

### 4.7 Integración, páginas informativas y multimedia (#16, #28, #29)

- Conectó el panel de administrador, el Home, la barra lateral y el dashboard con la API real (#29).
- Escribió el contenido real de Servicios, Requisitos, Ayuda y Políticas (#16).
- Agregó el **video** de presentación (2:04 min) y el **audio** con 5 consejos en La Compañía (#28), y optimizó las imágenes (sharp: máximo 1600 px y JPEG progresivo) y el audio.

## 5. Parte de Alanis — Frontend

Issues #19 a #27.

### 5.1 Proyecto React y layout del PSD (#19)

- Proyecto con **Vite + React + React-Bootstrap**.
- `App.jsx` reproduce el diseño del PSD: header con una de **5 imágenes elegida al azar** al cargar, menú superior con rollover, links "Inicio · Buscar · Admin.", footer con links activos y las rutas de todas las páginas.

```jsx
const [headerImage] = useState(() => headerImages[Math.floor(Math.random() * headerImages.length)])
```

- `services/api.js` es el cliente de Axios: agrega el token a cada petición privada y, si el token vence, cierra la sesión y regresa al login.

### 5.2 Home, barra lateral y resultados con mapa (#20, #21, #22)

- **Home:** slider (`Carousel`) con las casas destacadas de la API, sección Bienvenido y Servicios destacados.
- **Barra lateral (`SearchSidebar`):** buscador "Encuentra tu futura propiedad" (C.P. o ciudad, rango de 2 a 20 km, precio de-a, recámaras y baños), noticias con scroll vertical automático y contador de Conectados y Visitas con dígitos tipo odómetro.
- **Resultados:** tarjetas y mapa de **Leaflet** con un marcador por casa y el círculo del radio de búsqueda. Los filtros viajan en la URL, así que una búsqueda se puede compartir.

```jsx
<MapContainer center={CENTRO_INICIAL} zoom={11} scrollWheelZoom className="results-map">
  <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
  {centro && (
    <Circle center={[centro.lat, centro.lng]} radius={centro.radioKm * 1000} />
  )}
  {casas.map((casa) => (
    <Marker key={casa.id} position={[casa.lat, casa.lng]}>
      <Popup><Link to={`/casas/${casa.id}`}>Ver detalles</Link></Popup>
    </Marker>
  ))}
</MapContainer>
```

### 5.3 Detalle de casa (#23)

Galería de imágenes, ficha técnica, amenidades separadas en interiores y exteriores, formas de pago con requisitos, botón para descargar la ficha en PDF, botón "Me interesa" que abre Contacto con la casa ya seleccionada, y mapa de ubicación.

### 5.4 Login y panel de administrador (#24)

- Pantalla de login que guarda el token, y rutas privadas que regresan al login si no hay sesión.
- Tabla de casas con estatus, editar, eliminar y marcar como vendida.
- `CasaFormModal`: formulario de alta y edición con ficha técnica, imágenes, amenidades, formas de pago, casa destacada y un mapa (`MapaSelector`) para elegir la ubicación con un clic.
- `NoticiasAdmin`: alta, edición, activación y baja de noticias.
- Botones para descargar el reporte en PDF o Excel.

### 5.5 Contacto, dashboard y responsivo (#25, #26, #27)

- **Contacto:** formulario con validación por campo, prellenado desde la URL (`?asunto=` y `?casa=`).
- **Dashboard:** gráfica de barras de casas por rango de precio y gráfica de pastel de vendidas vs. en venta con **Recharts**.
- **Responsivo:** con media queries, en pantallas angostas la barra lateral baja debajo del contenido, el menú se vuelve hamburguesa y las rejillas pasan a una columna.

## 6. Recorrido de una petición completa

Ejemplo: el visitante abre el detalle de la casa 3.

1. React Router muestra `PropertyDetail`, que llama `api.get('/casas/3')`.
2. Express recibe `GET /api/casas/3` → `casa.routes.js` valida que el id sea un número (`validar`).
3. `CasaController.detalle` llama a `CasaService.obtenerPublica(3)`.
4. El servicio pide la casa a `CasaRepository` con sus imágenes, amenidades y formas de pago. Si no existe o está vendida, lanza `AppError.notFound` → `404 CASA_NO_ENCONTRADA`.
5. El controlador responde `200 { data: casa }`.
6. React pinta la galería, la ficha y el mapa.

## 7. Cómo agregar un módulo nuevo

1. Migración en `backend/src/database/migrations` y modelo en `backend/src/models` (registrarlo en `models/index.js`).
2. Repositorio que herede de `BaseRepository`.
3. Servicio con las reglas de negocio.
4. Controlador.
5. Rutas con sus validadores y su comentario `@openapi`; montarlas en `routes/index.js` (o en `admin.routes.js` si es privado).
6. Pruebas en `backend/tests`.
7. Página o componente en `frontend/src` que use `services/api.js`.
