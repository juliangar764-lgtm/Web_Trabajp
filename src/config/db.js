const { Pool, types } = require("pg");

// Los ids son bigint; pg los devuelve como texto. Aquí caben de sobra en un Number.
types.setTypeParser(types.builtins.INT8, Number);

// Muchos hosting exigen SSL para PostgreSQL: define DATABASE_SSL=true en ese caso.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});

// Un error en una conexión inactiva no debe tumbar el proceso.
pool.on("error", (error) => console.error("Error en el pool de PostgreSQL:", error.message));

/** Ejecuta `work(client)` dentro de una transacción; hace rollback si falla. */
async function transaction(work) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { pool, query: (text, params) => pool.query(text, params), transaction };
