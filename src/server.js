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

const server = app.listen(port, () => console.log(`Caberti disponible en http://localhost:${port}`));

// Cierre ordenado cuando el hosting reinicia o detiene el proceso.
function shutdown() {
  server.close(() => db.pool.end().finally(() => process.exit(0)));
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
