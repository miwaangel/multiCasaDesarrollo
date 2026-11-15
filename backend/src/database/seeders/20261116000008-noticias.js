'use strict';

/** 3 noticias activas para la barra lateral (basadas en el diseño). */
const noticias = [
  {
    id: 1,
    titulo: 'Nuevo convenio a casas ecológicas',
    resumen:
      'Multicasa firmó un convenio para ofrecer descuentos en viviendas con paneles solares, calentadores solares y ahorradores de agua.',
    contenido:
      'A partir de este mes, las casas de nuestro catálogo que cuenten con paneles solares, calentador solar y dispositivos ahorradores de agua tendrán un descuento especial en gastos de escrituración. El convenio se firmó con desarrolladores de Saltillo, Ramos Arizpe y el área metropolitana de Monterrey.\n\nAdemás, quienes adquieran una vivienda ecológica con crédito Infonavit pueden sumar el programa Hipoteca Verde, que amplía el monto del crédito para cubrir estas ecotecnologías. Pregunta a tu asesor qué casas califican y cuánto podrías ahorrar en luz y agua cada bimestre.',
    imagen_url: null,
    activa: true,
    fecha_publicacion: '2026-11-03 09:00:00',
    creado_por: 1,
  },
  {
    id: 2,
    titulo: 'Planes de descuento para trabajadores del ISSSTE',
    resumen:
      'Si cotizas en el ISSSTE, ahora puedes obtener descuentos y apoyo en trámites al comprar tu casa con crédito Fovissste.',
    contenido:
      'Los trabajadores del Estado afiliados al ISSSTE que compren una vivienda con crédito Fovissste a través de Multicasa recibirán asesoría gratuita durante todo el trámite y un descuento en la comisión de venta. La promoción aplica en casas y departamentos marcados con la forma de pago Fovissste.\n\nPara participar necesitas estar en activo, tener al menos 18 meses de cotización y registrarte en el sistema de puntaje del Fovissste. Consulta la sección de Requisitos o escríbenos desde el formulario de contacto para revisar tu caso.',
    imagen_url: null,
    activa: true,
    fecha_publicacion: '2026-11-07 10:30:00',
    creado_por: 1,
  },
  {
    id: 3,
    titulo: 'Cómo pagar tu mensualidad si te encuentras en el extranjero',
    resumen:
      'Si vives o trabajas fuera de México, te explicamos las opciones para pagar tu mensualidad sin contratiempos.',
    contenido:
      'Si compraste tu casa con nosotros y ahora te encuentras fuera del país, puedes seguir pagando tu mensualidad mediante transferencia internacional a la cuenta CLABE de tu contrato, desde la banca en línea de tu banco en México o a través de servicios de envío de dinero que depositan directamente a cuentas mexicanas.\n\nTe recomendamos programar tus pagos con al menos tres días hábiles de anticipación para evitar recargos y guardar siempre tu comprobante. Si necesitas cambiar la fecha de pago o tienes dudas sobre el tipo de cambio, comunícate con nosotros y te ayudaremos a elegir la opción más conveniente.',
    imagen_url: null,
    activa: true,
    fecha_publicacion: '2026-11-12 08:15:00',
    creado_por: 1,
  },
];

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('noticias', noticias);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('noticias', { id: noticias.map((n) => n.id) });
  },
};
