const db = require("../config/db");

async function findById(id) {
  return (await db.query("SELECT tipo, datos FROM imagenes_producto WHERE id = $1", [id])).rows[0];
}

/** Guarda la fotografía y la deja como primera imagen del producto. */
async function addToProduct(productId, type, data) {
  return db.transaction(async (client) => {
    const { rows } = await client.query(
      "INSERT INTO imagenes_producto (producto_id, tipo, datos) SELECT id, $2, $3 FROM productos WHERE id = $1 RETURNING id",
      [productId, type, data],
    );
    if (!rows.length) return null;
    const url = `/api/images/${rows[0].id}`;
    await client.query("UPDATE productos SET imagenes = ARRAY[$2]::text[] || imagenes WHERE id = $1", [productId, url]);
    return url;
  });
}

module.exports = { findById, addToProduct };
