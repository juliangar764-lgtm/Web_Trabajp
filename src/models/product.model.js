const db = require("../config/db");

// Las columnas están en español; los alias mantienen las claves JSON que usa el frontend.
const SELECT = `
  SELECT p.id, p.nombre AS name, c.nombre AS category, p.categoria_id AS "categoryId",
         p.precio::float8 AS price, p.oferta::float8 AS sale, p.existencias AS stock, p.minimo AS min,
         p.personalizable AS custom, p.destacado AS featured, p.activo AS active,
         p.descripcion AS description, p.imagenes AS images
  FROM productos p JOIN categorias c ON c.id = p.categoria_id`;

async function findAll({ onlyActive = false } = {}) {
  const where = onlyActive ? "WHERE p.activo" : "";
  return (await db.query(`${SELECT} ${where} ORDER BY p.id`)).rows;
}

async function findById(id) {
  return (await db.query(`${SELECT} WHERE p.id = $1`, [id])).rows[0];
}

// Las existencias solo cambian mediante movimientos de inventario (inventory.model).
async function create(p) {
  const { rows } = await db.query(
    `INSERT INTO productos (nombre, categoria_id, precio, oferta, minimo, personalizable, destacado, activo, descripcion, imagenes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
    [p.name, p.categoryId, p.price, p.sale, p.min, p.custom, p.featured, p.active, p.description, p.images],
  );
  return findById(rows[0].id);
}

async function update(id, p) {
  const { rowCount } = await db.query(
    `UPDATE productos SET nombre=$2, categoria_id=$3, precio=$4, oferta=$5, minimo=$6,
            personalizable=$7, destacado=$8, activo=$9, descripcion=$10, imagenes=$11
     WHERE id = $1`,
    [id, p.name, p.categoryId, p.price, p.sale, p.min, p.custom, p.featured, p.active, p.description, p.images],
  );
  return rowCount ? findById(id) : undefined;
}

module.exports = { findAll, findById, create, update };
