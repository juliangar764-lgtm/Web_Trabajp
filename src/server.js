const fs = require("node:fs");
const path = require("node:path");
const app = require("./app");
const db = require("./config/db");
const { port, whatsappNumber } = require("./config/env");

if (!process.env.DATABASE_URL) {
  console.error("Falta la variable de entorno DATABASE_URL.");
  process.exit(1);
}
if (!whatsappNumber) {
  console.warn("Aviso: WHATSAPP_NUMBER no está definido o no es válido; los enlaces de WhatsApp quedarán desactivados.");
}

let server;

// El esquema es idempotente: aplicarlo al arrancar crea las tablas o columnas que falten sin tocar
// los datos. Así un despliegue con cambios en la base no depende de ejecutar database/init.js a mano.
async function start() {
  await db.query(fs.readFileSync(path.join(__dirname, "..", "database", "schema.sql"), "utf8"));
  server = app.listen(port, () => console.log(`CabertiStack disponible en http://localhost:${port}`));
}
start().catch((error) => {
  console.error("No se pudo preparar la base de datos:", error.message);
  process.exit(1);
});

// Cierre ordenado cuando el hosting reinicia o detiene el proceso.
function shutdown() {
  if (!server) process.exit(0);
  server.close(() => db.pool.end().finally(() => process.exit(0)));
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
