const db = require("../config/db");
const HttpError = require("../utils/httpError");
const { applyMovement } = require("./inventory.model");

const STATUSES = ["Pendiente", "Confirmado", "En preparación", "Entregado", "Cancelado"];
// En estos estados el pedido ya reservó existencias.
const STOCK_STATUSES = ["Confirmado", "En preparación", "Entregado"];

// Las columnas están en español; los alias mantienen las claves JSON que usa el frontend.
const ORDER_COLUMNS = `id, cliente_id AS "customerId", cliente AS customer, telefono AS phone, direccion AS address,
  entrega AS delivery, notas AS notes, estado AS status, envio::float8 AS shipping,
  aplicado AS applied, creado_en AS date`;

async function attachItems(orders) {
  if (!orders.length) return orders;
  const { rows } = await db.query(
    `SELECT d.pedido_id AS "orderId", d.producto_id AS "productId", d.nombre AS name,
            d.cantidad AS qty, d.precio::float8 AS price, d.personalizacion AS custom, p.imagenes AS images
     FROM detalle_pedido d JOIN productos p ON p.id = d.producto_id
     WHERE d.pedido_id = ANY($1) ORDER BY d.id`,
    [orders.map((o) => o.id)],
  );
  orders.forEach((o) => (o.items = rows.filter((i) => i.orderId === o.id)));
  return orders;
}

async function findAll({ status } = {}) {
  const { rows } = await db.query(
    `SELECT ${ORDER_COLUMNS} FROM pedidos WHERE ($1::text IS NULL OR estado = $1) ORDER BY id DESC`,
    [status ?? null],
  );
  return attachItems(rows);
}

async function findByCustomerId(customerId) {
  const { rows } = await db.query(`SELECT ${ORDER_COLUMNS} FROM pedidos WHERE cliente_id = $1 ORDER BY id DESC`, [
    customerId,
  ]);
  return attachItems(rows);
}

async function findById(id) {
  const { rows } = await db.query(`SELECT ${ORDER_COLUMNS} FROM pedidos WHERE id = $1`, [id]);
  return (await attachItems(rows))[0];
}

/** Crea un pedido. Nombre y precio se toman de la base de datos, no del cliente. */
async function create({ customerId, customer, phone, address, delivery, notes, items }) {
  const id = await db.transaction(async (client) => {
    // Revisión rápida de existencias por producto; la reserva real ocurre al confirmar el pedido.
    const wanted = new Map();
    for (const { productId, qty } of items) wanted.set(productId, (wanted.get(productId) ?? 0) + qty);
    for (const [productId, qty] of wanted) {
      const product = (await client.query("SELECT existencias FROM productos WHERE id = $1 AND activo", [productId]))
        .rows[0];
      if (!product) throw new HttpError(400, `El producto ${productId} no está disponible.`);
      if (product.existencias < qty) {
        throw new HttpError(409, "Hay un producto sin existencias suficientes. Revisa tu pedido.");
      }
    }
    const { rows } = await client.query(
      `INSERT INTO pedidos (cliente_id, cliente, telefono, direccion, entrega, notas)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [customerId, customer, phone, address, delivery, notes],
    );
    for (const item of items) {
      const product = (
        await client.query(
          "SELECT nombre, COALESCE(oferta, precio) AS precio FROM productos WHERE id = $1 AND activo",
          [item.productId],
        )
      ).rows[0];
      if (!product) throw new HttpError(400, `El producto ${item.productId} no está disponible.`);
      await client.query(
        `INSERT INTO detalle_pedido (pedido_id, producto_id, nombre, cantidad, precio, personalizacion)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [rows[0].id, item.productId, product.nombre, item.qty, product.precio, item.custom],
      );
    }
    return rows[0].id;
  });
  return findById(id);
}

/** Cambia estado y envío; descuenta o devuelve existencias según corresponda. */
async function updateStatus(id, { status, shipping }) {
  await db.transaction(async (client) => {
    const order = (await client.query("SELECT aplicado AS applied FROM pedidos WHERE id = $1 FOR UPDATE", [id])).rows[0];
    if (!order) throw new HttpError(404, "Pedido no encontrado.");

    const shouldApply = STOCK_STATUSES.includes(status);
    if (shouldApply && shipping === null) {
      throw new HttpError(400, "Confirma el costo de envío. Usa 0 si la entrega no tiene costo.");
    }
    if (shouldApply !== order.applied) {
      const { rows: items } = await client.query(
        `SELECT producto_id AS "productId", SUM(cantidad)::int AS qty
         FROM detalle_pedido WHERE pedido_id = $1 GROUP BY producto_id ORDER BY producto_id`,
        [id],
      );
      // Orden fijo por producto: evita bloqueos cruzados (deadlocks) entre pedidos simultáneos.
      for (const { productId, qty } of items) {
        await applyMovement(client, {
          productId,
          delta: shouldApply ? -qty : qty,
          reason: `${shouldApply ? "Pedido" : "Devolución del pedido"} #CB-${id}`,
        });
      }
    }
    await client.query("UPDATE pedidos SET estado = $2, envio = $3, aplicado = $4 WHERE id = $1", [
      id,
      status,
      shipping,
      shouldApply,
    ]);
  });
  return findById(id);
}

module.exports = { STATUSES, findAll, findByCustomerId, findById, create, updateStatus };
