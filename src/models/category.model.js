const db = require("../config/db");

// Las columnas están en español; los alias mantienen las claves JSON que usa el frontend.
const findAll = async () => (await db.query("SELECT id, nombre AS name FROM categorias ORDER BY id")).rows;

const create = async (name) =>
  (await db.query("INSERT INTO categorias (nombre) VALUES ($1) RETURNING id, nombre AS name", [name])).rows[0];

const update = async (id, name) =>
  (await db.query("UPDATE categorias SET nombre = $2 WHERE id = $1 RETURNING id, nombre AS name", [id, name])).rows[0];

const remove = async (id) => (await db.query("DELETE FROM categorias WHERE id = $1", [id])).rowCount > 0;

module.exports = { findAll, create, update, remove };
