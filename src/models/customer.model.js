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

module.exports = { PUBLIC_COLUMNS, create, findByEmailWithHash, upsertAdmin };
