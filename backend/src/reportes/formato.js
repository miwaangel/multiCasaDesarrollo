/** Formatos de texto compartidos por los reportes. */
const ESTATUS = Object.freeze({ venta: 'En venta', vendida: 'Vendida' });
const TIPOS = Object.freeze({ casa: 'Casa', departamento: 'Departamento', terreno: 'Terreno' });

const dinero = (valor) => `$${Number(valor).toLocaleString('es-MX', { maximumFractionDigits: 0 })}`;

/** 'YYYY-MM-DD' (DATEONLY) → 'DD/MM/YYYY'. Vacío si no hay fecha. */
const fecha = (valor) => {
  if (!valor) return '';
  const [a, m, d] = String(valor).slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
};

module.exports = { ESTATUS, TIPOS, dinero, fecha };
