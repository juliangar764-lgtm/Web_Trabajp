const Category = require("../models/category.model");
const HttpError = require("../utils/httpError");
const { parseId, text } = require("../utils/validate");

const list = async (req, res) => res.json(await Category.findAll());

const create = async (req, res) => {
  res.status(201).json(await Category.create(text(req.body.name, "El nombre", { max: 80 })));
};

const update = async (req, res) => {
  const category = await Category.update(parseId(req.params.id), text(req.body.name, "El nombre", { max: 80 }));
  if (!category) throw new HttpError(404, "Categoría no encontrada.");
  res.json(category);
};

const remove = async (req, res) => {
  if (!(await Category.remove(parseId(req.params.id)))) throw new HttpError(404, "Categoría no encontrada.");
  res.status(204).end();
};

module.exports = { list, create, update, remove };
