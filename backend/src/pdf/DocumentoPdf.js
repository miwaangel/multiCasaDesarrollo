const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

/** Colores del sitio (frontend/src/App.css). */
const COLORES = Object.freeze({
  primario: '#1f5d70',
  secundario: '#315f70',
  acento: '#b87932',
  oscuro: '#18313d',
  precio: '#9b6428',
  texto: '#2d3a40',
  suave: '#66767c',
  linea: '#ddd4c3',
  fondo: '#f4f1e8',
});

const FORMATOS_IMAGEN = ['.jpg', '.jpeg', '.png']; // los que soporta pdfkit

/**
 * Patrón Builder sobre pdfkit: arma un PDF con la imagen de MultiCasa
 * (encabezado con logo, secciones, tablas y pie con número de página)
 * encadenando pasos, y al final se pide el Buffer.
 *
 *   const pdf = await new DocumentoPdf({ titulo: 'Ficha técnica' })
 *     .encabezado('Casa en Saltillo')
 *     .seccion('Características')
 *     .datos([['Recámaras', 3], ['Baños', 2]])
 *     .aBuffer();
 *
 * Lo usan la ficha técnica (issue #15) y el reporte de casas (issue #17).
 */
class DocumentoPdf {
  constructor({ titulo, autor = 'MultiCasa', horizontal = false } = {}) {
    this.titulo = titulo;
    this.doc = new PDFDocument({
      size: 'LETTER',
      layout: horizontal ? 'landscape' : 'portrait',
      margins: { top: 50, bottom: 60, left: 50, right: 50 },
      bufferPages: true, // para escribir "Página X de Y" al final
      info: { Title: titulo, Author: autor, Creator: 'MultiCasa API' },
    });
    this.doc.font('Helvetica').fontSize(10).fillColor(COLORES.texto);
  }

  get #ancho() {
    return this.doc.page.width - this.doc.page.margins.left - this.doc.page.margins.right;
  }

  get #izquierda() {
    return this.doc.page.margins.left;
  }

  /** Recorta el texto con "…" para que quepa en una línea de `ancho` puntos (con la fuente actual). */
  #recortar(texto, ancho) {
    const { doc } = this;
    let t = String(texto ?? '');
    if (doc.widthOfString(t) <= ancho) return t;
    while (t.length > 1 && doc.widthOfString(`${t}…`) > ancho) t = t.slice(0, -1);
    return `${t.trimEnd()}…`;
  }

  /** Agrega una página si lo que sigue (alto en puntos) ya no cabe. */
  #asegurarEspacio(alto) {
    if (this.doc.y + alto > this.doc.page.height - this.doc.page.margins.bottom) {
      this.doc.addPage();
    }
  }

  /** Logo (círculo con la M, como en el sitio), nombre, título del documento y subtítulo. */
  encabezado(subtitulo = '') {
    const { doc } = this;
    const x = this.#izquierda;
    const y = doc.page.margins.top;

    doc.rect(0, 0, doc.page.width, y + 46).fill(COLORES.oscuro);
    doc.rect(0, y + 46, doc.page.width, 4).fill(COLORES.acento);

    doc.circle(x + 18, y + 18, 18).fill(COLORES.primario);
    doc.circle(x + 18, y + 18, 18).lineWidth(1.5).stroke('#ffffff');
    doc.font('Times-Roman').fontSize(22).fillColor('#ffffff').text('M', x + 4, y + 7, { width: 28, align: 'center' });

    doc.font('Helvetica-Bold').fontSize(16).text('MULTI', x + 46, y + 4, { continued: true });
    doc.font('Helvetica').text('CASA');
    doc.fontSize(8).fillColor('#d8e2e6').text('Tu mejor opción en agencia de bienes raíces', x + 46, y + 23);

    doc.font('Helvetica-Bold').fontSize(12).fillColor('#ffffff')
      .text(this.titulo, x, y + 6, { width: this.#ancho, align: 'right' });
    if (subtitulo) {
      doc.font('Helvetica').fontSize(9).fillColor('#d8e2e6')
        .text(subtitulo, x, y + 24, { width: this.#ancho, align: 'right' });
    }

    doc.x = x;
    doc.y = y + 66;
    doc.font('Helvetica').fontSize(10).fillColor(COLORES.texto);
    return this;
  }

  /** Título grande con subtítulo y, opcionalmente, un dato destacado a la derecha (precio). */
  titular(texto, { subtitulo = '', destacado = '' } = {}) {
    const { doc } = this;
    const x = this.#izquierda;
    const anchoTexto = destacado ? this.#ancho * 0.65 : this.#ancho;
    const y = doc.y;

    doc.font('Helvetica-Bold').fontSize(18).fillColor(COLORES.oscuro).text(texto, x, y, { width: anchoTexto });
    const yFin = doc.y;
    if (destacado) {
      doc.font('Helvetica-Bold').fontSize(18).fillColor(COLORES.precio)
        .text(destacado, x + anchoTexto, y, { width: this.#ancho - anchoTexto, align: 'right' });
    }
    doc.y = Math.max(yFin, doc.y);
    if (subtitulo) {
      doc.font('Helvetica').fontSize(10).fillColor(COLORES.suave).text(subtitulo, x, doc.y + 2, { width: this.#ancho });
    }
    doc.moveDown(0.8);
    return this;
  }

  /** Etiqueta pequeña con fondo (por ejemplo "EN VENTA"). */
  etiqueta(texto, color = COLORES.secundario) {
    const { doc } = this;
    doc.font('Helvetica-Bold').fontSize(8);
    const ancho = doc.widthOfString(texto) + 14;
    doc.rect(this.#izquierda, doc.y, ancho, 16).fill(color);
    doc.fillColor('#ffffff').text(texto, this.#izquierda + 7, doc.y + 4, { lineBreak: false });
    doc.x = this.#izquierda;
    doc.y += 24;
    doc.font('Helvetica').fontSize(10).fillColor(COLORES.texto);
    return this;
  }

  /** Imagen de un archivo local (JPG / PNG). Si no existe o no es válida, se omite sin error. */
  imagen(ruta, { alto = 220 } = {}) {
    if (!ruta || !FORMATOS_IMAGEN.includes(path.extname(ruta).toLowerCase()) || !fs.existsSync(ruta)) {
      return this;
    }
    this.#asegurarEspacio(alto + 10);
    const y = this.doc.y;
    try {
      this.doc.image(ruta, this.#izquierda, y, { fit: [this.#ancho, alto], align: 'center', valign: 'center' });
      this.doc.y = y + alto + 12;
    } catch {
      this.doc.y = y; // archivo dañado: sin imagen
    }
    this.doc.x = this.#izquierda;
    return this;
  }

  /** Título de sección con línea de color. */
  seccion(texto) {
    const { doc } = this;
    this.#asegurarEspacio(50);
    doc.moveDown(0.4);
    doc.font('Helvetica-Bold').fontSize(12).fillColor(COLORES.primario).text(texto.toUpperCase(), this.#izquierda);
    const y = doc.y + 2;
    doc.moveTo(this.#izquierda, y).lineTo(this.#izquierda + this.#ancho, y).lineWidth(1).stroke(COLORES.acento);
    doc.y = y + 8;
    doc.font('Helvetica').fontSize(10).fillColor(COLORES.texto);
    return this;
  }

  parrafo(texto) {
    if (!texto) return this;
    this.doc.font('Helvetica').fontSize(10).fillColor(COLORES.texto)
      .text(texto, this.#izquierda, this.doc.y, { width: this.#ancho, align: 'justify', lineGap: 2 });
    this.doc.moveDown(0.6);
    return this;
  }

  /** Texto con enlace (se puede hacer clic en el PDF). */
  enlace(texto, url) {
    this.doc.font('Helvetica').fontSize(10).fillColor(COLORES.primario)
      .text(texto, this.#izquierda, this.doc.y, { link: url, underline: true });
    this.doc.fillColor(COLORES.texto).moveDown(0.6);
    return this;
  }

  /** Pares [etiqueta, valor] en una cuadrícula de `columnas` columnas. */
  datos(pares, { columnas = 2 } = {}) {
    const { doc } = this;
    const anchoCelda = this.#ancho / columnas;
    const altoFila = 30;

    pares.forEach(([etiqueta, valor], i) => {
      const columna = i % columnas;
      if (columna === 0) {
        this.#asegurarEspacio(altoFila);
        if (Math.floor(i / columnas) % 2 === 0) {
          doc.rect(this.#izquierda, doc.y, this.#ancho, altoFila).fill(COLORES.fondo);
        }
      }
      const x = this.#izquierda + columna * anchoCelda + 8;
      const y = doc.y;
      doc.font('Helvetica').fontSize(8).fillColor(COLORES.suave).text(etiqueta.toUpperCase(), x, y + 4, { width: anchoCelda - 16 });
      doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORES.texto);
      doc.text(this.#recortar(valor ?? '—', anchoCelda - 16), x, y + 15, { width: anchoCelda - 16, lineBreak: false });
      doc.y = y;
      if (columna === columnas - 1 || i === pares.length - 1) {
        doc.y = y + altoFila;
      }
    });

    doc.x = this.#izquierda;
    doc.moveDown(0.6);
    return this;
  }

  /** Lista con viñetas en `columnas` columnas. `vacio` si no hay elementos. */
  lista(elementos, { columnas = 1, vacio = 'Sin información' } = {}) {
    const { doc } = this;
    if (!elementos.length) {
      doc.font('Helvetica-Oblique').fontSize(10).fillColor(COLORES.suave).text(vacio, this.#izquierda);
      doc.moveDown(0.6);
      return this;
    }
    const anchoColumna = this.#ancho / columnas;
    const filas = Math.ceil(elementos.length / columnas);
    for (let f = 0; f < filas; f += 1) {
      this.#asegurarEspacio(16);
      const y = doc.y;
      let yMax = y;
      for (let c = 0; c < columnas; c += 1) {
        const elemento = elementos[f + c * filas];
        if (elemento === undefined) continue;
        const x = this.#izquierda + c * anchoColumna;
        doc.circle(x + 4, y + 5, 2).fill(COLORES.acento);
        doc.font('Helvetica').fontSize(10).fillColor(COLORES.texto).text(elemento, x + 12, y, { width: anchoColumna - 16 });
        yMax = Math.max(yMax, doc.y);
      }
      doc.y = yMax + 2;
    }
    doc.x = this.#izquierda;
    doc.moveDown(0.5);
    return this;
  }

  /** Bloque [{ titulo, texto }] (por ejemplo formas de pago con sus requisitos). */
  bloques(elementos, { vacio = 'Sin información' } = {}) {
    if (!elementos.length) return this.lista([], { vacio });
    const { doc } = this;
    for (const { titulo, texto } of elementos) {
      this.#asegurarEspacio(40);
      doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORES.secundario).text(titulo, this.#izquierda, doc.y, { width: this.#ancho });
      if (texto) {
        doc.font('Helvetica').fontSize(9).fillColor(COLORES.texto).text(texto, { width: this.#ancho, lineGap: 1 });
      }
      doc.moveDown(0.5);
    }
    return this;
  }

  /**
   * Tabla con encabezado que se repite en cada página.
   * columnas: [{ titulo, ancho (proporción), alinear: 'left' | 'right' | 'center' }]
   * filas: arreglos de textos; `colorFila(i)` opcional para resaltar filas.
   */
  tabla(columnas, filas, { colorFila = null } = {}) {
    const { doc } = this;
    const total = columnas.reduce((s, c) => s + (c.ancho ?? 1), 0);
    const anchos = columnas.map((c) => ((c.ancho ?? 1) / total) * this.#ancho);
    const altoFila = 20;

    const fila = (valores, { encabezado = false, fondo = null } = {}) => {
      const y = doc.y;
      if (fondo) doc.rect(this.#izquierda, y, this.#ancho, altoFila).fill(fondo);
      let x = this.#izquierda;
      valores.forEach((valor, i) => {
        doc.font(encabezado ? 'Helvetica-Bold' : 'Helvetica').fontSize(encabezado ? 7.5 : 9)
          .fillColor(encabezado ? '#ffffff' : COLORES.texto);
        doc.text(this.#recortar(valor, anchos[i] - 10), x + 5, y + 6, { width: anchos[i] - 10, align: columnas[i].alinear ?? 'left', lineBreak: false });
        x += anchos[i];
      });
      doc.y = y + altoFila;
    };
    const encabezado = () => fila(columnas.map((c) => c.titulo.toUpperCase()), { encabezado: true, fondo: COLORES.secundario });

    this.#asegurarEspacio(altoFila * 2);
    encabezado();
    filas.forEach((valores, i) => {
      if (doc.y + altoFila > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        encabezado();
      }
      fila(valores, { fondo: colorFila?.(i) ?? (i % 2 ? COLORES.fondo : null) });
    });
    doc.x = this.#izquierda;
    doc.moveDown(0.8);
    return this;
  }

  /** Pie en todas las páginas: datos de contacto, fecha de generación y "Página X de Y". */
  #pie() {
    const { doc } = this;
    const fecha = new Date().toLocaleString('es-MX', { timeZone: 'America/Monterrey', dateStyle: 'long', timeStyle: 'short' });
    const { start, count } = doc.bufferedPageRange();

    for (let i = start; i < start + count; i += 1) {
      doc.switchToPage(i);
      const margenInferior = doc.page.margins.bottom;
      doc.page.margins.bottom = 0; // escribir en el margen sin que pdfkit cree otra página
      const y = doc.page.height - 40;
      const x = doc.page.margins.left;
      const ancho = doc.page.width - doc.page.margins.left - doc.page.margins.right;

      doc.moveTo(x, y - 6).lineTo(x + ancho, y - 6).lineWidth(0.5).stroke(COLORES.linea);
      doc.font('Helvetica').fontSize(8).fillColor(COLORES.suave)
        .text(`Bienes Raíces MultiCasa · Generado el ${fecha}`, x, y, { width: ancho, lineBreak: false })
        .text(`Página ${i + 1} de ${count}`, x, y, { width: ancho, align: 'right', lineBreak: false });
      doc.page.margins.bottom = margenInferior;
    }
  }

  /** Termina el documento y regresa el PDF completo. */
  aBuffer() {
    this.#pie();
    return new Promise((resolve, reject) => {
      const partes = [];
      this.doc.on('data', (parte) => partes.push(parte));
      this.doc.on('end', () => resolve(Buffer.concat(partes)));
      this.doc.on('error', reject);
      this.doc.end();
    });
  }
}

module.exports = { DocumentoPdf, COLORES };
