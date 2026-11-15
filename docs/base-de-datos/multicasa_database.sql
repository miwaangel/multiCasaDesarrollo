-- =====================================================================
--  MULTICASA - Bienes Raíces
--  Modelo físico de la base de datos (MySQL 8)
--  Responsable: Angel
--
--  Convenciones:
--   - Tablas y columnas en snake_case (en Sequelize usar underscored: true
--     para trabajarlas como camelCase en el código: m2_terreno -> m2Terreno)
--   - Todas las tablas usan id INT AUTO_INCREMENT como llave primaria
--   - Tablas puente: casa_forma_pago, casa_amenidad
-- =====================================================================

DROP DATABASE IF EXISTS multicasa;
CREATE DATABASE multicasa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE multicasa;

-- ---------------------------------------------------------------------
-- 1. ADMINISTRADORES (un solo tipo de administrador)
-- ---------------------------------------------------------------------
CREATE TABLE administradores (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL,
    email           VARCHAR(150) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,          -- bcrypt
    activo          BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_administradores_email UNIQUE (email)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 2. CASAS (ficha técnica)
-- ---------------------------------------------------------------------
CREATE TABLE casas (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    -- Generales
    titulo            VARCHAR(150) NOT NULL,
    descripcion       TEXT NULL,
    tipo              ENUM('casa','departamento','terreno') NOT NULL DEFAULT 'casa',
    precio            DECIMAL(12,2) NOT NULL,           -- pesos MXN
    estatus           ENUM('venta','vendida') NOT NULL DEFAULT 'venta',
    destacada         BOOLEAN NOT NULL DEFAULT FALSE,   -- para slider / destacados del Inicio
    -- Ubicación
    direccion         VARCHAR(200) NOT NULL,
    colonia           VARCHAR(100) NOT NULL,
    ciudad            VARCHAR(100) NOT NULL,
    estado            VARCHAR(100) NOT NULL,
    codigo_postal     CHAR(5) NOT NULL,
    lat               DECIMAL(9,6) NOT NULL,            -- mapa y búsqueda por km
    lng               DECIMAL(9,6) NOT NULL,
    -- Características
    m2_terreno        DECIMAL(10,2) NULL,
    m2_construccion   DECIMAL(10,2) NULL,              -- NULL si es terreno
    recamaras         TINYINT UNSIGNED NOT NULL DEFAULT 0,
    banos             DECIMAL(3,1) NOT NULL DEFAULT 0,  -- permite medios baños: 2.5
    estacionamientos  TINYINT UNSIGNED NOT NULL DEFAULT 0,
    plantas           TINYINT UNSIGNED NOT NULL DEFAULT 1,
    orientacion       ENUM('norte','sur','oriente','poniente') NULL,
    -- Control
    fecha_venta       DATE NULL,                        -- se llena al marcarla como vendida
    creado_por        INT NULL,
    creado_en         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_casas_admin FOREIGN KEY (creado_por)
        REFERENCES administradores(id) ON DELETE SET NULL,
    CONSTRAINT chk_casas_precio CHECK (precio > 0),
    CONSTRAINT chk_casas_cp CHECK (codigo_postal REGEXP '^[0-9]{5}$'),
    CONSTRAINT chk_casas_lat CHECK (lat BETWEEN -90 AND 90),
    CONSTRAINT chk_casas_lng CHECK (lng BETWEEN -180 AND 180)
) ENGINE=InnoDB;

-- Índices para la búsqueda pública, el reporte y el dashboard
CREATE INDEX ix_casas_estatus_precio ON casas (estatus, precio);
CREATE INDEX ix_casas_codigo_postal  ON casas (codigo_postal);
CREATE INDEX ix_casas_ciudad_estado  ON casas (ciudad, estado);
CREATE INDEX ix_casas_ubicacion      ON casas (lat, lng);

-- ---------------------------------------------------------------------
-- 3. IMÁGENES DE CADA CASA (1 casa -> N imágenes)
-- ---------------------------------------------------------------------
CREATE TABLE imagenes_casa (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    casa_id     INT NOT NULL,
    url         VARCHAR(255) NOT NULL,                  -- ruta del archivo subido con multer
    orden       TINYINT UNSIGNED NOT NULL DEFAULT 0,
    es_portada  BOOLEAN NOT NULL DEFAULT FALSE,
    creado_en   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_imagenes_casa FOREIGN KEY (casa_id)
        REFERENCES casas(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX ix_imagenes_casa_orden ON imagenes_casa (casa_id, orden);

-- ---------------------------------------------------------------------
-- 4. FORMAS DE PAGO (catálogo) + requisitos para la página Requisitos
-- ---------------------------------------------------------------------
CREATE TABLE formas_pago (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    nombre       VARCHAR(60) NOT NULL,
    descripcion  VARCHAR(255) NULL,
    requisitos   TEXT NULL,                             -- lista separada por saltos de línea
    CONSTRAINT uq_formas_pago_nombre UNIQUE (nombre)
) ENGINE=InnoDB;

CREATE TABLE casa_forma_pago (
    casa_id        INT NOT NULL,
    forma_pago_id  INT NOT NULL,
    PRIMARY KEY (casa_id, forma_pago_id),
    CONSTRAINT fk_cfp_casa FOREIGN KEY (casa_id)
        REFERENCES casas(id) ON DELETE CASCADE,
    CONSTRAINT fk_cfp_forma_pago FOREIGN KEY (forma_pago_id)
        REFERENCES formas_pago(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 5. AMENIDADES (catálogo interior / exterior)
-- ---------------------------------------------------------------------
CREATE TABLE amenidades (
    id      INT AUTO_INCREMENT PRIMARY KEY,
    nombre  VARCHAR(80) NOT NULL,
    tipo    ENUM('interior','exterior') NOT NULL,
    CONSTRAINT uq_amenidades_nombre_tipo UNIQUE (nombre, tipo)
) ENGINE=InnoDB;

CREATE TABLE casa_amenidad (
    casa_id      INT NOT NULL,
    amenidad_id  INT NOT NULL,
    PRIMARY KEY (casa_id, amenidad_id),
    CONSTRAINT fk_ca_casa FOREIGN KEY (casa_id)
        REFERENCES casas(id) ON DELETE CASCADE,
    CONSTRAINT fk_ca_amenidad FOREIGN KEY (amenidad_id)
        REFERENCES amenidades(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 6. NOTICIAS DE ÚLTIMA HORA (barra lateral con scroll vertical)
-- ---------------------------------------------------------------------
CREATE TABLE noticias (
    id                 INT AUTO_INCREMENT PRIMARY KEY,
    titulo             VARCHAR(150) NOT NULL,
    resumen            VARCHAR(255) NOT NULL,           -- lo que se ve en la barra lateral
    contenido          TEXT NULL,                       -- lo que se ve en "Ver más..."
    imagen_url         VARCHAR(255) NULL,
    activa             BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_publicacion  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    creado_por         INT NULL,
    CONSTRAINT fk_noticias_admin FOREIGN KEY (creado_por)
        REFERENCES administradores(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX ix_noticias_activa_fecha ON noticias (activa, fecha_publicacion);

-- ---------------------------------------------------------------------
-- 7. VISITAS (contador de Visitas y Conectados)
--    Visitas    = COUNT(*)
--    Conectados = COUNT(DISTINCT visitante_hash) de los últimos 5 minutos
-- ---------------------------------------------------------------------
CREATE TABLE visitas (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    visitante_hash  CHAR(64) NOT NULL,                  -- SHA-256 de IP + user agent (no guardar la IP en claro)
    pagina          VARCHAR(150) NULL,
    fecha           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE INDEX ix_visitas_fecha ON visitas (fecha);

-- ---------------------------------------------------------------------
-- 8. MENSAJES DE CONTACTO (además se envían por correo)
-- ---------------------------------------------------------------------
CREATE TABLE mensajes_contacto (
    id        INT AUTO_INCREMENT PRIMARY KEY,
    nombre    VARCHAR(100) NOT NULL,
    email     VARCHAR(150) NOT NULL,
    telefono  VARCHAR(20) NULL,
    asunto    ENUM('informacion','vender','construir','mudanzas','seguros','otro') NOT NULL DEFAULT 'informacion',
    mensaje   TEXT NOT NULL,
    casa_id   INT NULL,                                 -- si viene del botón "Me interesa"
    leido     BOOLEAN NOT NULL DEFAULT FALSE,
    fecha     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mensajes_casa FOREIGN KEY (casa_id)
        REFERENCES casas(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================================
-- DATOS DE CATÁLOGO
-- =====================================================================

-- Admin de prueba  ->  email: admin@multicasa.com   password: Admin123!
-- (hash bcrypt de 10 rondas; cámbienlo antes de entregar)
INSERT INTO administradores (nombre, email, password_hash) VALUES
('Administrador', 'admin@multicasa.com', '$2b$10$OmkZRNp.8WmT6y4yPuePC.uYw5AaiqrS.xY3mqXcmOUMwaXg4YFDe');

INSERT INTO formas_pago (nombre, descripcion, requisitos) VALUES
('Contado', 'Pago total en una sola exhibición o en parcialidades directas.',
 'Identificación oficial vigente (INE o pasaporte)\nComprobante de domicilio reciente\nRFC / Constancia de situación fiscal\nAcreditación del origen de los recursos'),
('Crédito bancario', 'Crédito hipotecario con instituciones bancarias.',
 'Identificación oficial vigente\nComprobantes de ingresos de los últimos 3 meses\nEnganche de 10% a 20% del valor de la vivienda\nHistorial crediticio favorable\nAntigüedad laboral mínima de 1 año'),
('Infonavit', 'Crédito para trabajadores afiliados al IMSS.',
 'Relación laboral vigente con cotización al IMSS\nPuntos mínimos requeridos por Infonavit\nPrecalificación en Mi Cuenta Infonavit\nCurso "Saber para decidir"'),
('Fovissste', 'Crédito para trabajadores del Estado afiliados al ISSSTE.',
 'Ser trabajador en activo afiliado al ISSSTE\nCotización mínima de 18 meses\nRegistro en el sistema de puntaje del Fovissste\nIdentificación oficial vigente'),
('Cofinavit', 'Combinación de crédito Infonavit con crédito bancario.',
 'Requisitos de Infonavit y del banco participante\nComprobantes de ingresos\nPrecalificación en ambas instituciones');

INSERT INTO amenidades (nombre, tipo) VALUES
('Cocina integral', 'interior'),
('Cuarto de servicio', 'interior'),
('Clósets / vestidor', 'interior'),
('Aire acondicionado', 'interior'),
('Calefacción', 'interior'),
('Estudio', 'interior'),
('Cuarto de lavado', 'interior'),
('Chimenea', 'interior'),
('Jardín', 'exterior'),
('Alberca', 'exterior'),
('Terraza', 'exterior'),
('Asador', 'exterior'),
('Cochera techada', 'exterior'),
('Patio de servicio', 'exterior'),
('Seguridad 24/7', 'exterior'),
('Área de juegos', 'exterior'),
('Casa club / gimnasio', 'exterior');

-- =====================================================================
-- CONSULTAS DE REFERENCIA PARA EL BACKEND
-- =====================================================================

-- a) Búsqueda pública por C.P. + km (solo casas en venta).
--    @lat/@lng = coordenadas del C.P. que escribió el usuario (geocodificación).
-- SELECT c.*,
--        ST_Distance_Sphere(POINT(c.lng, c.lat), POINT(@lng, @lat)) / 1000 AS distancia_km
-- FROM casas c
-- WHERE c.estatus = 'venta'
--   AND c.precio BETWEEN @precio_min AND @precio_max
--   AND c.recamaras >= @recamaras
--   AND c.banos >= @banos
--   AND ST_Distance_Sphere(POINT(c.lng, c.lat), POINT(@lng, @lat)) <= @km * 1000
-- ORDER BY distancia_km;

-- b) Dashboard: casas por rango de precio
CREATE OR REPLACE VIEW v_casas_por_rango_precio AS
SELECT rango, orden, COUNT(*) AS total
FROM (
    SELECT CASE
             WHEN precio <  1000000 THEN 'Menos de $1 M'
             WHEN precio <  2000000 THEN '$1 M - $2 M'
             WHEN precio <  4000000 THEN '$2 M - $4 M'
             WHEN precio <  7000000 THEN '$4 M - $7 M'
             ELSE 'Más de $7 M'
           END AS rango,
           CASE
             WHEN precio <  1000000 THEN 1
             WHEN precio <  2000000 THEN 2
             WHEN precio <  4000000 THEN 3
             WHEN precio <  7000000 THEN 4
             ELSE 5
           END AS orden
    FROM casas
) t
GROUP BY rango, orden
ORDER BY orden;

-- c) Dashboard: vendidas vs en venta
CREATE OR REPLACE VIEW v_casas_por_estatus AS
SELECT estatus, COUNT(*) AS total
FROM casas
GROUP BY estatus;

-- d) Contador de la barra lateral
-- SELECT COUNT(*) AS visitas,
--        (SELECT COUNT(DISTINCT visitante_hash) FROM visitas
--          WHERE fecha >= NOW() - INTERVAL 5 MINUTE) AS conectados
-- FROM visitas;
