const db = require("../config/db");

// Las columnas están en español; los alias mantienen las claves JSON que usa el frontend.
const PUBLIC_COLUMNS = "id, nombre AS name, correo AS email, telefono AS phone, rol AS role";

async function create({ name, email, phone, passwordHash, role = "cliente" }) {
  const { rows } = await db.query(
    `INSERT INTO clientes (nombre, correo, telefono, contrasena_hash, rol)
     VALUES ($1, lower($2), $3, $4, $5) RETURNING ${PUBLIC_COLUMNS}`,
    [name, email, phone, passwordHash, role],
  );
  return rows[0];
}

/** Incluye el hash: solo para validar el inicio de sesión, nunca para responder al cliente. */
async function findByEmailWithHash(email) {
  const { rows } = await db.query(
    `SELECT ${PUBLIC_COLUMNS}, contrasena_hash AS "passwordHash" FROM clientes WHERE lower(correo) = lower($1)`,
    [email],
  );
  return rows[0];
}

/** Crea la cuenta o, si el correo ya existe, la convierte en admin y cambia su contraseña. */
async function upsertAdmin({ name, email, passwordHash }) {
  const { rows } = await db.query(
    `INSERT INTO clientes (nombre, correo, contrasena_hash, rol)
     VALUES ($1, lower($2), $3, 'admin')
     ON CONFLICT (lower(correo)) DO UPDATE SET contrasena_hash = EXCLUDED.contrasena_hash, rol = 'admin'
     RETURNING ${PUBLIC_COLUMNS}`,
    [name, email, passwordHash],
  );
  return rows[0];
}

// Cuentas de clientes con su número de pedidos y lo comprado. Solo cuentan como compra los
// pedidos que ya descontaron existencias (confirmados, en preparación o entregados), con su envío.
const WITH_STATS = `
  SELECT c.id, c.nombre AS name, c.correo AS email, c.telefono AS phone, c.creado_en AS "createdAt",
         COUNT(p.id)::int AS orders,
         COALESCE(SUM(CASE WHEN p.aplicado THEN t.total + COALESCE(p.envio, 0) END), 0)::float8 AS spent
  FROM clientes c
  LEFT JOIN pedidos p ON p.cliente_id = c.id
  LEFT JOIN LATERAL (
    SELECT COALESCE(SUM(d.cantidad * d.precio), 0) AS total FROM detalle_pedido d WHERE d.pedido_id = p.id
  ) t ON true
  WHERE c.rol = 'cliente'`;

const findAllWithStats = async () => (await db.query(`${WITH_STATS} GROUP BY c.id ORDER BY lower(c.nombre), c.id`)).rows;

const findWithStats = async (id) => (await db.query(`${WITH_STATS} AND c.id = $1 GROUP BY c.id`, [id])).rows[0];

module.exports = { PUBLIC_COLUMNS, create, findByEmailWithHash, upsertAdmin, findAllWithStats, findWithStats };
