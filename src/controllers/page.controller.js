const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { isProduction } = require("../config/env");

const VIEWS_DIR = path.join(__dirname, "..", "views");
const PUBLIC_DIR = path.join(__dirname, "..", "..", "public");
const PAGE_NAME = /^[a-z]+$/;

// Huella del CSS y JavaScript publicados. Va en sus direcciones (`?v=...`) para que, tras un
// despliegue, el navegador descargue los archivos nuevos en lugar de usar los que tenía guardados.
const ASSET_VERSION = (() => {
  const hash = crypto.createHash("sha256");
  for (const dir of ["css", "js"]) {
    for (const name of fs.readdirSync(path.join(PUBLIC_DIR, dir)).sort()) {
      hash.update(name).update(fs.readFileSync(path.join(PUBLIC_DIR, dir, name)));
    }
  }
  return hash.digest("hex").slice(0, 10);
})();
const ASSET_URL = /((?:href|src)="(?:\.\.\/)?(?:css|js)\/[\w.-]+\.(?:css|js))"/g;

const pages = new Map(); // HTML ya preparado; en desarrollo se vuelve a leer en cada petición

function readPage(file) {
  if (isProduction && pages.has(file)) return pages.get(file);
  const html = fs.readFileSync(file, "utf8").replace(ASSET_URL, `$1?v=${ASSET_VERSION}"`);
  pages.set(file, html);
  return html;
}

/** Devuelve el controlador que sirve la vista `<dir>/<page>.html`; `dir` vacío es el sitio público. */
const servePage = (dir = "") => (req, res, next) => {
  const page = req.params.page ?? "index";
  const file = path.join(VIEWS_DIR, dir, `${page}.html`);
  if (!PAGE_NAME.test(page) || !fs.existsSync(file)) return next();
  // La página siempre se comprueba con el servidor; así recoge la huella nueva en cuanto se despliega.
  res.set("Cache-Control", "no-cache").type("html").send(readPage(file));
};

module.exports = { servePage };
