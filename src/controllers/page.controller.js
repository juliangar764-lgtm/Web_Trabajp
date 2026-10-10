const fs = require("node:fs");
const path = require("node:path");

const VIEWS_DIR = path.join(__dirname, "..", "views");
const PAGE_NAME = /^[a-z]+$/;

/** Devuelve el controlador que sirve la vista `<dir>/<page>.html`; `dir` vacío es el sitio público. */
const servePage = (dir = "") => (req, res, next) => {
  const page = req.params.page ?? "index";
  const file = path.join(VIEWS_DIR, dir, `${page}.html`);
  if (!PAGE_NAME.test(page) || !fs.existsSync(file)) return next();
  res.sendFile(file);
};

module.exports = { servePage };
