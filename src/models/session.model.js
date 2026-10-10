const { createHash, randomBytes } = require("node:crypto");
const db = require("../config/db");
const { sessionDays } = require("../config/env");

// En la base solo se guarda el hash del token: si la tabla se filtra, las sesiones no sirven.
const hashToken = (token) => createHash("sha256").update(token).digest("hex");

async function create(customerId) {
  const token = randomBytes(32).toString("base64url");
  await db.query(
    "INSERT INTO sesiones (token_hash, cliente_id, expira_en) VALUES ($1, $2, now() + make_interval(days => $3))",
    [hashToken(token), customerId, sessionDays],
  );
  return token;
}

async function findUserByToken(token) {
  const { rows } = await db.query(
    `SELECT c.id, c.nombre AS name, c.correo AS email, c.telefono AS phone, c.rol AS role
     FROM sesiones s JOIN clientes c ON c.id = s.cliente_id
     WHERE s.token_hash = $1 AND s.expira_en > now()`,
    [hashToken(token)],
  );
  return rows[0] ?? null;
}

const remove = (token) => db.query("DELETE FROM sesiones WHERE token_hash = $1", [hashToken(token)]);

const purgeExpired = () => db.query("DELETE FROM sesiones WHERE expira_en < now()");

module.exports = { create, findUserByToken, remove, purgeExpired };
