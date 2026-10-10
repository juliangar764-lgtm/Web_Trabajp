const HttpError = require("./httpError");

const badRequest = (message) => new HttpError(400, message);

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw badRequest("Identificador no válido.");
  return id;
}

function text(value, label, { max = 120, required = true } = {}) {
  const clean = String(value ?? "").trim();
  if (required && !clean) throw badRequest(`${label} es obligatorio.`);
  if (clean.length > max) throw badRequest(`${label} no puede superar ${max} caracteres.`);
  return clean;
}

function integer(value, label, { min = 0 } = {}) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min) throw badRequest(`${label} debe ser un entero de ${min} o más.`);
  return n;
}

function money(value, label, { allowZero = false } = {}) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || (!allowZero && n === 0)) throw badRequest(`${label} no es válido.`);
  return Math.round(n * 100) / 100;
}

module.exports = { badRequest, parseId, text, integer, money };
