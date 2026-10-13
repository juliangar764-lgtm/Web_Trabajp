const Customer = require("../models/customer.model");
const Order = require("../models/order.model");
const HttpError = require("../utils/httpError");
const { parseId } = require("../utils/validate");

const list = async (req, res) => res.json(await Customer.findAllWithStats());

/** Datos de un cliente y todos sus pedidos, para el panel. */
const get = async (req, res) => {
  const id = parseId(req.params.id);
  const customer = await Customer.findWithStats(id);
  if (!customer) throw new HttpError(404, "Cliente no encontrado.");
  res.json({ customer, orders: await Order.findByCustomerId(id) });
};

module.exports = { list, get };
