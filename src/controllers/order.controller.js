const Order = require("../models/order.model");
const HttpError = require("../utils/httpError");
const { badRequest, parseId, text, integer, money } = require("../utils/validate");

const list = async (req, res) => {
  const { status } = req.query;
  if (status && !Order.STATUSES.includes(status)) throw badRequest("Estado no válido.");
  res.json(await Order.findAll({ status }));
};

const listMine = async (req, res) => res.json(await Order.findByCustomerId(req.user.id));

// Un cliente solo ve sus pedidos; para los demás responde 404 y no revela que el pedido existe.
const get = async (req, res) => {
  const order = await Order.findById(parseId(req.params.id));
  if (!order || (req.user.role !== "admin" && order.customerId !== req.user.id)) {
    throw new HttpError(404, "Pedido no encontrado.");
  }
  res.json(order);
};

const create = async (req, res) => {
  const { items, delivery } = req.body;
  if (!Array.isArray(items) || !items.length) throw badRequest("El pedido no tiene artículos.");
  if (!["domicilio", "recoger"].includes(delivery)) throw badRequest("Tipo de entrega no válido.");
  const order = await Order.create({
    customerId: req.user.role === "admin" ? null : req.user.id, // un pedido hecho desde el panel no pertenece a la cuenta del administrador
    customer: text(req.body.customer || req.user.name, "El nombre"),
    phone: text(req.body.phone || req.user.phone, "El teléfono", { max: 30, required: false }),
    address: text(req.body.address, "La dirección", { max: 255, required: false }),
    delivery,
    notes: text(req.body.notes, "Las notas", { max: 500, required: false }),
    items: items.map((item) => ({
      productId: parseId(item.productId),
      qty: integer(item.qty, "La cantidad", { min: 1 }),
      custom: text(item.custom, "La personalización", { max: 300, required: false }),
    })),
  });
  res.status(201).json(order);
};

const updateStatus = async (req, res) => {
  const { status } = req.body;
  if (!Order.STATUSES.includes(status)) throw badRequest("Estado no válido.");
  const shipping =
    req.body.shipping == null || req.body.shipping === ""
      ? null
      : money(req.body.shipping, "El costo de envío", { allowZero: true });
  res.json(await Order.updateStatus(parseId(req.params.id), { status, shipping }));
};

module.exports = { list, listMine, get, create, updateStatus };
