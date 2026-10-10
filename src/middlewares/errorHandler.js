const HttpError = require("../utils/httpError");

const PG_FK_VIOLATION = "23503";
const PG_UNIQUE_VIOLATION = "23505";

function notFound(req, res, next) {
  if (req.path.startsWith("/api/")) return next(new HttpError(404, "Recurso no encontrado."));
  res.status(404).send("Página no encontrada.");
}

// eslint-disable-next-line no-unused-vars
function errorHandler(error, req, res, next) {
  let { status, message } = error;
  if (error.code === PG_UNIQUE_VIOLATION) [status, message] = [409, "Ya existe un registro con ese valor."];
  else if (error.code === PG_FK_VIOLATION) [status, message] = [409, "El registro está en uso o hace referencia a algo que no existe."];
  else if (error.type === "entity.parse.failed") [status, message] = [400, "JSON no válido."];

  if (!status) {
    console.error(error);
    [status, message] = [500, "Error interno del servidor."];
  }
  res.status(status).json({ error: message });
}

module.exports = { notFound, errorHandler };
