# Documento de pruebas — MultiCasa

Este documento describe cómo se probó **MultiCasa** (issue #30): pruebas automatizadas de la API con Jest + Supertest, cobertura de código y casos de prueba manuales del sitio.

## 1. Estrategia

| Nivel | Herramienta | Qué se prueba | Cómo se ejecuta |
|---|---|---|---|
| Unitarias | Jest | Servicios con repositorios simulados, validaciones de modelos, Singleton, Builder del PDF, optimización de imágenes | `npm test` en `backend/` |
| Integración (API) | Jest + Supertest | Cada endpoint contra una base MySQL real de pruebas, archivos en disco, tokens JWT | `npm test` en `backend/` |
| Documentación | Jest + swagger-parser | Que Swagger sea OpenAPI 3 válido y documente todos los endpoints | `npm test` en `backend/` |
| Sistema (manual) | Navegador | Flujos completos del sitio público y del panel de administrador | Sección 5 |
| Compatibilidad | Navegadores y celular | Diseño responsivo y funcionamiento en distintos navegadores | Sección 6 |

**Base de datos de pruebas.** Las pruebas de integración usan una base aparte, `multicasa_test`: antes de cada archivo de pruebas se borra, se vuelve a crear, se migra y se cargan los seeders (`tests/helpers/baseDePruebas.js`). La base de desarrollo `multicasa` nunca se toca.

**Servicios externos.** No se usa internet: Nominatim se simula o se apaga (`GEOCODING_HABILITADO` es `false` en pruebas) y el correo usa el transporte `jsonTransport` de nodemailer, que arma el mensaje sin enviarlo.

## 2. Cómo ejecutar las pruebas

Requisitos: MySQL encendido y `backend/.env` configurado (ver el [manual de instalación](../implementacion/README.md)).

```bash
cd backend
npm test                      # las 175 pruebas, una tras otra (--runInBand)
npx jest tests/casas.test.js  # un solo archivo
npm test -- --coverage        # con reporte de cobertura en backend/coverage/
```

## 3. Resultados de las pruebas automatizadas

Ejecución del 24/11/2026 en Windows 11, Node.js 24 y MariaDB de XAMPP:

```
Test Suites: 14 passed, 14 total
Tests:       175 passed, 175 total
```

| Archivo | Módulo | Pruebas | Resultado |
|---|---|---|---|
| `app.test.js` | Health, formato de errores, Singleton `Database`, `BaseRepository` | 7 | ✅ 7/7 |
| `models.test.js` | Validaciones de los modelos (CHECK del modelo físico), relaciones, `passwordHash` oculto | 12 | ✅ 12/12 |
| `auth.test.js` | Login JWT + bcrypt y middleware `auth` | 14 | ✅ 14/14 |
| `casas.test.js` | Detalle y destacadas, CRUD de admin con imágenes, transacciones, estatus, rutas protegidas | 29 | ✅ 29/29 |
| `busqueda.test.js` | Búsqueda por C.P. o ciudad + radio, precio, recámaras y baños; geocodificación con caché | 24 | ✅ 24/24 |
| `noticias.test.js` | Noticias públicas y CRUD de admin con imagen | 18 | ✅ 18/18 |
| `visitas.test.js` | Contador de visitas y conectados, privacidad (solo hash, nunca la IP) | 7 | ✅ 7/7 |
| `contacto.test.js` | Formulario de contacto: guardado, correo, "Me interesa", campo trampa anti-bots, validaciones | 17 | ✅ 17/17 |
| `pdf.test.js` | Ficha técnica en PDF (patrón Builder) | 8 | ✅ 8/8 |
| `reporte.test.js` | Reporte de casas en PDF y Excel (patrón Strategy) | 10 | ✅ 10/10 |
| `dashboard.test.js` | Rangos de precio y vendidas vs. en venta | 11 | ✅ 11/11 |
| `optimizarImagen.test.js` | Optimización de imágenes subidas (tamaño, formato JPEG, archivos falsos) | 6 | ✅ 6/6 |
| `docs.test.js` | Especificación OpenAPI y Swagger UI | 6 | ✅ 6/6 |
| `frontend.test.js` | El backend sirve el sitio compilado y no tapa la API ni las imágenes | 6 | ✅ 6/6 |
| **Total** | | **175** | **✅ 175/175** |

### 3.1 Cobertura de código

| Métrica | Cobertura |
|---|---|
| Líneas | 96.6 % |
| Sentencias | 96.4 % |
| Funciones | 96.4 % |
| Ramas (`if`/`else`) | 80.5 % |

### 3.2 Casos representativos

Una muestra de lo que verifican las pruebas, más allá del "camino feliz":

| ID | Caso | Entrada | Resultado esperado |
|---|---|---|---|
| PA-01 | Login con contraseña incorrecta | `POST /api/auth/login` con password erróneo | `401 CREDENCIALES_INVALIDAS`, mismo mensaje que si el email no existe |
| PA-02 | Token vencido | `GET /api/admin/perfil` con un JWT expirado | `401 TOKEN_INVALIDO` |
| PA-03 | Ruta de admin sin token | `POST /api/admin/casas` sin `Authorization` | `401` y no se guarda ningún archivo en disco |
| PA-04 | Alta de casa completa | multipart con 2 imágenes, amenidades y formas de pago | `201`, imágenes optimizadas en `uploads/casas/` |
| PA-05 | Falla dentro de la transacción | Error simulado al guardar | ROLLBACK: la casa no queda en la BD y se borran las imágenes |
| PA-06 | Imagen de más de 5 MB | multipart con archivo grande | `400 ARCHIVO_MUY_GRANDE` |
| PA-07 | Archivo de texto renombrado a `.jpg` | multipart | `400 ARCHIVO_INVALIDO`, nada queda en disco |
| PA-08 | Marcar casa como vendida | `PATCH /api/admin/casas/:id/estatus` | `fecha_venta` = hoy, deja de ser destacada y sale del sitio público |
| PA-09 | Búsqueda por ciudad + radio | `ubicacion=saltillo&radioKm=10` | Solo casas dentro del radio, ordenadas de la más cercana a la más lejana |
| PA-10 | Rango de precio invertido | `precioMin=3000000&precioMax=1000000` | `400 DATOS_INVALIDOS` en `precioMax` |
| PA-11 | Visitas repetidas | Misma página y visitante dos veces en menos de 10 s | Solo se cuenta una |
| PA-12 | Bot en el formulario de contacto | Campo trampa lleno | `201`, pero no se guarda ni se envía |
| PA-13 | El correo falla | SMTP con error | `201` con `correoEnviado: false`; el mensaje sí queda guardado |
| PA-14 | PDF de una casa vendida | `GET /api/casas/:id/pdf` | `404` (el sitio público solo muestra casas en venta) |
| PA-15 | Reporte en formato no válido | `formato=csv` | `400` |
| PA-16 | Endpoint sin documentar | Agregar una ruta sin `@openapi` | Falla `docs.test.js` |

## 4. Errores encontrados y corregidos

| # | Error | Causa | Corrección |
|---|---|---|---|
| 1 | En Windows, `/api/docs` aparecía sin endpoints | El glob de `swagger-jsdoc` no entiende rutas con `\` | Se convierte la ruta a `/` (PR #52) |
| 2 | En Windows, subir una imagen PNG o WebP respondía "no es una imagen válida" | `sharp` dejaba abierto el archivo original y Windows no permitía borrarlo (`EBUSY`) | `sharp.cache(false)` (PR #52) |
| 3 | La galería del detalle se encimaba sobre el título | Estilos del contenedor | PR #50 |

## 5. Casos de prueba manuales del sitio

Se ejecutan con el sistema corriendo (backend + frontend) y los datos de los seeders. En **Resultado** se marca ✅ o ❌ y en **Evidencia** se pega la captura de pantalla.

### 5.1 Sitio público

| ID | Pantalla | Pasos | Resultado esperado | Resultado | Evidencia |
|---|---|---|---|---|---|
| PM-01 | Layout | Abrir el Home y recargar varias veces | La imagen del header cambia al azar entre las 5 del diseño | | |
| PM-02 | Layout | Pasar el mouse por el menú superior y el lateral | Cambian de estilo (rollover / over state) | | |
| PM-03 | Home | Esperar en el banner | El slide show avanza solo con las casas destacadas | | |
| PM-04 | Home | Clic en "Ver Más..." de un servicio destacado | Abre la página de Servicios | | |
| PM-05 | Barra lateral | Observar "Información de última hora" | Las noticias suben con scroll vertical automático | | |
| PM-06 | Barra lateral | Revisar el contador; recargar en otra página | Muestra "Conectados" y "Visitas" con dígitos tipo odómetro; las visitas aumentan | | |
| PM-07 | Búsqueda | Ciudad "Saltillo", rango 10 km, Buscar | Resultados en tarjetas y un marcador por casa en el mapa | | |
| PM-08 | Búsqueda | C.P. de una casa de prueba, "Sin rango" | Solo casas de ese C.P. | | |
| PM-09 | Búsqueda | Precio de-a, 3 recámaras, 2 baños | Solo casas que cumplen los filtros | | |
| PM-10 | Búsqueda | Ubicación que no existe ("zzzz") | Mensaje de que no se encontró la ubicación, sin errores en pantalla | | |
| PM-11 | Búsqueda | Copiar la URL de resultados y abrirla en otra pestaña | Mismos filtros y mismos resultados | | |
| PM-12 | Detalle | Abrir una casa desde los resultados | Galería, ficha técnica, amenidades (interiores / exteriores), formas de pago y mapa | | |
| PM-13 | Detalle | Clic en "Descargar ficha en PDF" | Se descarga el PDF con datos y fotos de la casa | | |
| PM-14 | Detalle | Clic en "Me interesa" | Abre Contacto con el asunto y la casa ya seleccionados | | |
| PM-15 | Detalle | Recargar la página (F5) en el detalle | La página vuelve a cargar, no da 404 | | |
| PM-16 | Contacto | Enviar con campos vacíos o correo inválido | Mensajes de error en cada campo; no se envía | | |
| PM-17 | Contacto | Llenar todo bien y enviar | Mensaje de éxito; el registro aparece en la tabla `mensajes_contacto` | | |
| PM-18 | La Compañía | Abrir la página | Se ven el video de presentación y el audio de consejos, y los dos se reproducen | | |
| PM-19 | Informativas | Abrir Servicios, Requisitos, Ayuda y Políticas | Contenido real, sin lorem ipsum | | |
| PM-20 | Navegación | Abrir una ruta que no existe (`/xyz`) | Página "Página no encontrada" | | |

### 5.2 Panel de administrador

| ID | Pantalla | Pasos | Resultado esperado | Resultado | Evidencia |
|---|---|---|---|---|---|
| PM-21 | Login | Contraseña incorrecta | Mensaje "credenciales inválidas"; no entra | | |
| PM-22 | Login | `admin@multicasa.com` / `Admin123!` | Entra al panel | | |
| PM-23 | Rutas privadas | Sin sesión, abrir `/admin/panel` | Redirige al login | | |
| PM-24 | Casas | Alta de una casa con 2 imágenes (una PNG), amenidades y formas de pago | Aparece en la tabla con su portada; se ve en el sitio público | | |
| PM-25 | Casas | Editar precio y quitar una imagen | Cambios guardados; la imagen ya no aparece | | |
| PM-26 | Casas | Marcar una casa como vendida | Cambia su estatus y desaparece de búsquedas y destacadas | | |
| PM-27 | Casas | Eliminar una casa | Pide confirmación y desaparece de la tabla | | |
| PM-28 | Noticias | Alta de noticia con imagen | Aparece en "Información de última hora" | | |
| PM-29 | Noticias | Desactivar una noticia | Ya no aparece en el sitio público | | |
| PM-30 | Reporte | Descargar el reporte en PDF y en Excel | Se descargan los dos archivos con todas las casas y su estatus | | |
| PM-31 | Dashboard | Abrir el dashboard | Gráfica de casas por rango de precio y de vendidas vs. en venta | | |
| PM-32 | Dashboard | Marcar una casa como vendida y volver al dashboard | Las gráficas reflejan el cambio | | |
| PM-33 | Sesión | Cerrar sesión | Regresa al login; el panel ya no se puede abrir | | |

## 6. Pruebas de compatibilidad

| Navegador / dispositivo | Home | Búsqueda + mapa | Detalle + PDF | Panel admin | Observaciones |
|---|---|---|---|---|---|
| Chrome (Windows) | ✔ | ✔ | ✔ | ✔ | Funciona bien |
| Edge (Windows) | ✔ | ✔ | ✔ | ✔ | Funciona bien |
| Brave (Windows) | | | | | No se probó |
| Firefox (Windows) | ✔ | ✔ | ✔ | ✔ | Funciona bien |
| Safari (macOS / iPhone) | | | | | No se probó |
| Celular (Android, ~390 px) | | | | | La barra lateral baja debajo del contenido y el menú se vuelve hamburguesa |

## 7. Conclusión

Las 175 pruebas automatizadas pasan, con una cobertura del 96.6 % de las líneas del backend. Cubren todos los endpoints de la API, sus validaciones, la seguridad de las rutas de administrador y el manejo de archivos. Los casos manuales de las secciones 5 y 6 completan la verificación del sitio en el navegador.
