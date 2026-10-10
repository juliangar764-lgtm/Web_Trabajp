const db = require("../config/db");
const HttpError = require("../utils/httpError");

// Las columnas están en español; los alias mantienen las claves JSON que usa el frontend.
async function findMovements(limit = 100) {
  const { rows } = await db.query(
    `SELECT m.id, m.producto_id AS "productId", p.nombre AS name, m.cantidad AS delta,
            m.motivo AS reason, m.creado_en AS date, m.usuario AS "user"
     FROM movimientos_inventario m JOIN productos p ON p.id = m.producto_id
     ORDER BY m.creado_en DESC, m.id DESC LIMIT $1`,
    [limit],
  );
  return rows;
}

/**
 * Ajusta las existencias y registra el movimiento. Recibe un `client` para poder
 * participar en una transacción mayor (por ejemplo, al confirmar un pedido).
 */
async function applyMovement(client, { productId, delta, reason, user = "Administrador" }) {
  const { rows } = await client.query(
    "UPDATE productos SET existencias = existencias + $2 WHERE id = $1 AND existencias + $2 >= 0 RETURNING existencias AS stock",
    [productId, delta],
  );
  if (!rows.length) throw new HttpError(409, "Existencias insuficientes o producto inexistente.");
  await client.query(
    "INSERT INTO movimientos_inventario (producto_id, cantidad, motivo, usuario) VALUES ($1,$2,$3,$4)",
    [productId, delta, reason, user],
  );
  return rows[0].stock;
}

const registerMovement = (movement) => db.transaction((client) => applyMovement(client, movement));

module.exports = { findMovements, applyMovement, registerMovement };
