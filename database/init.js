// Crea las tablas de la base de datos.
//   --reset  borra TODAS las tablas del proyecto (incluidas las cuentas de clientes y las antiguas en inglés)
//   --seed   carga el catálogo inicial (reemplaza los datos existentes)
const fs = require("node:fs");
const path = require("node:path");
const { pool } = require("../src/config/db");

const OLD_TABLES = ["order_items", "orders", "inventory_movements", "products", "categories"];
const TABLES = [
  "imagenes_producto",
  "detalle_pedido",
  "pedidos",
  "movimientos_inventario",
  "productos",
  "categorias",
  "sesiones",
  "clientes",
];

async function run() {
  const reset = process.argv.includes("--reset");
  if (reset) {
    await pool.query(`DROP TABLE IF EXISTS ${[...OLD_TABLES, ...TABLES].join(", ")} CASCADE`);
    console.log("Tablas anteriores eliminadas");
  }
  const files = ["schema.sql", ...(process.argv.includes("--seed") ? ["seed.sql"] : [])];
  for (const file of files) {
    await pool.query(fs.readFileSync(path.join(__dirname, file), "utf8"));
    console.log(`Ejecutado ${file}`);
  }
}

run()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
