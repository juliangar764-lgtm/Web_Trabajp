const HttpError = require("./httpError");

const badRequest = (message) => new HttpError(400, message);

// Topes que caben en las columnas de la base: integer para cantidades y numeric(10,2) para importes.
const MAX_QUANTITY = 999999;
const MAX_MONEY = 99999999.99;

function parseId(value) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) throw badRequest("Identificador no válido.");
  return id;
}

function text(value, label, { max = 120, required = true } = {}) {
  const clean = String(value ?? "").trim();
  if (required && !clean) throw badRequest(`${label} es obligatorio.`);
  if (clean.length > max) throw badRequest(`${label} no puede superar ${max} caracteres.`);
  return clean;
}

function integer(value, label, { min = 0, max = MAX_QUANTITY } = {}) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min) throw badRequest(`${label} debe ser un entero de ${min} o más.`);
  if (n > max) throw badRequest(`${label} no puede ser mayor que ${max}.`);
  return n;
}

function money(value, label, { allowZero = false } = {}) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > MAX_MONEY || (!allowZero && n === 0)) throw badRequest(`${label} no es válido.`);
  return Math.round(n * 100) / 100;
}

module.exports = { MAX_QUANTITY, badRequest, parseId, text, integer, money };
