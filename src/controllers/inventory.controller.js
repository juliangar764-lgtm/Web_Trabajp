const Inventory = require("../models/inventory.model");
const { MAX_QUANTITY, badRequest, parseId, text } = require("../utils/validate");

const listMovements = async (req, res) => res.json(await Inventory.findMovements());

const createMovement = async (req, res) => {
  const delta = Number(req.body.delta);
  if (!Number.isInteger(delta) || delta === 0) throw badRequest("La cantidad debe ser un entero distinto de cero.");
  if (Math.abs(delta) > MAX_QUANTITY) throw badRequest(`La cantidad no puede ser mayor que ${MAX_QUANTITY}.`);
  const stock = await Inventory.registerMovement({
    productId: parseId(req.body.productId),
    delta,
    reason: text(req.body.reason, "El motivo", { max: 200 }),
    user: req.user.name,
  });
  res.status(201).json({ stock });
};

module.exports = { listMovements, createMovement };
