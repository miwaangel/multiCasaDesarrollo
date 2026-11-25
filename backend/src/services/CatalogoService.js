const AmenidadRepository = require('../repositories/AmenidadRepository');
const FormaPagoRepository = require('../repositories/FormaPagoRepository');

/** Catálogos públicos: formas de pago (página Requisitos) y amenidades (formularios y filtros). */
class CatalogoService {
  constructor({ amenidadRepository = new AmenidadRepository(), formaPagoRepository = new FormaPagoRepository() } = {}) {
    this.amenidades = amenidadRepository;
    this.formasPago = formaPagoRepository;
  }

  async listarFormasPago() {
    return (await this.formasPago.findCatalogo()).map((f) => f.toJSON());
  }

  /** Lista de amenidades; con agrupar = true regresa { interior: [...], exterior: [...] }. */
  async listarAmenidades({ agrupar = false } = {}) {
    const amenidades = (await this.amenidades.findCatalogo()).map((a) => a.toJSON());
    if (!agrupar) {
      return amenidades;
    }
    return {
      interior: amenidades.filter((a) => a.tipo === 'interior'),
      exterior: amenidades.filter((a) => a.tipo === 'exterior'),
    };
  }
}

module.exports = CatalogoService;
