const Product = require("../models/product.model");
const HttpError = require("../utils/httpError");
const { badRequest, parseId, text, integer, money } = require("../utils/validate");

// Fotos del catálogo original o subidas desde el panel (/api/images/:id).
const IMAGE_PATH = /^(assets\/productos\/\d{2}\.jpg|\/api\/images\/\d+)$/;

function parseProduct(body) {
  const price = money(body.price, "El precio");
  const sale = body.sale == null || body.sale === "" ? null : money(body.sale, "La promoción");
  if (sale !== null && sale >= price) throw badRequest("La promoción debe ser menor que el precio normal.");
  const images = body.images ?? [];
  if (!Array.isArray(images) || !images.every((path) => IMAGE_PATH.test(path))) {
    throw badRequest("Las imágenes no son válidas.");
  }
  return {
    name: text(body.name, "El nombre"),
    categoryId: parseId(body.categoryId),
    price,
    sale,
    min: integer(body.min ?? 0, "El mínimo"),
    custom: Boolean(body.custom),
    featured: Boolean(body.featured),
    active: body.active === undefined ? true : Boolean(body.active),
    description: text(body.description, "La descripción", { max: 1000, required: false }),
    images,
  };
}

// El catálogo público solo muestra productos activos; el panel (?all=1) los ve todos.
const isAdmin = (req) => req.user?.role === "admin";

const list = async (req, res) => {
  const all = req.query.all === "1";
  if (all && !isAdmin(req)) throw new HttpError(403, "No tienes permiso para esta acción.");
  res.json(await Product.findAll({ onlyActive: !all }));
};

const get = async (req, res) => {
  const product = await Product.findById(parseId(req.params.id));
  if (!product || (!product.active && !isAdmin(req))) throw new HttpError(404, "Producto no encontrado.");
  res.json(product);
};

const create = async (req, res) => res.status(201).json(await Product.create(parseProduct(req.body)));

const update = async (req, res) => {
  const product = await Product.update(parseId(req.params.id), parseProduct(req.body));
  if (!product) throw new HttpError(404, "Producto no encontrado.");
  res.json(product);
};

module.exports = { list, get, create, update };
