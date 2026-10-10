// Crea (o actualiza) la cuenta de administrador:
//   npm run admin:crear -- correo@dominio.com "Nombre"
// Si el correo ya existe, lo convierte en administrador y cambia su contraseña.
const { pool } = require("../src/config/db");
const Customer = require("../src/models/customer.model");
const { hashPassword } = require("../src/utils/password");

function askHidden(question) {
  return new Promise((resolve) => {
    const { stdin, stdout } = process;
    stdout.write(question);
    stdin.setRawMode?.(true); // sin eco: la contraseña no se ve al escribirla
    stdin.resume();
    stdin.setEncoding("utf8");
    let value = "";
    const onData = (chunk) => {
      for (const char of chunk) {
        if (char === "\r" || char === "\n") {
          stdin.setRawMode?.(false);
          stdin.pause();
          stdin.off("data", onData);
          stdout.write("\n");
          return resolve(value);
        }
        if (char === "\u0003") process.exit(130); // Ctrl+C
        if (char === "\u007f" || char === "\b") value = value.slice(0, -1);
        else value += char;
      }
    };
    stdin.on("data", onData);
  });
}

async function run() {
  const [email, name = "Administrador"] = process.argv.slice(2);
  if (!email?.includes("@")) throw new Error('Uso: npm run admin:crear -- correo@dominio.com "Nombre"');
  // Para automatizar (por ejemplo en el hosting) se puede pasar ADMIN_PASSWORD en lugar de teclearla.
  const password = process.env.ADMIN_PASSWORD || (await askHidden("Contraseña (mínimo 8 caracteres): "));
  if (password.length < 8) throw new Error("La contraseña debe tener al menos 8 caracteres.");
  const admin = await Customer.upsertAdmin({ name, email, passwordHash: await hashPassword(password) });
  console.log(`Administrador listo: ${admin.email}`);
}

run()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
