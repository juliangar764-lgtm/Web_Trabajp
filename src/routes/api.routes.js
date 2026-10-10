const express = require("express");
const { Router } = express;
const { whatsappNumber } = require("../config/env");
const { requireLogin, requireAdmin } = require("../middlewares/auth");
const { rateLimit } = require("../middlewares/security");
const auth = require("../controllers/auth.controller");
const categories = require("../controllers/category.controller");
const products = require("../controllers/product.controller");
const images = require("../controllers/image.controller");
const inventory = require("../controllers/inventory.controller");
const orders = require("../controllers/order.controller");

const router = Router();

// Datos públicos de configuración (el número de WhatsApp vive en una variable de entorno).
router.get("/config", (req, res) => res.json({ whatsappNumber }));

// Cuenta y sesión. Registro e inicio de sesión llevan límite de intentos por IP.
const authLimit = rateLimit({
  max: 20,
  windowMs: 15 * 60 * 1000,
  message: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.",
});
router.post("/auth/register", authLimit, auth.register);
router.post("/auth/login", authLimit, auth.login);
router.post("/auth/logout", auth.logout);
router.get("/auth/me", auth.me);

// Catálogo: lectura pública, escritura solo del administrador.
router.get("/categories", categories.list);
router.post("/categories", requireAdmin, categories.create);
router.route("/categories/:id").all(requireAdmin).put(categories.update).delete(categories.remove);

router.get("/products", products.list);
router.post("/products", requireAdmin, products.create);
router.get("/products/:id", products.get);
router.put("/products/:id", requireAdmin, products.update);
router.post(
  "/products/:id/images",
  requireAdmin,
  express.raw({ type: ["image/jpeg", "image/png", "image/webp"], limit: "1mb" }),
  images.upload,
);
router.get("/images/:id", images.serve);

router.use("/inventory", requireAdmin);
router.route("/inventory/movements").get(inventory.listMovements).post(inventory.createMovement);

// Pedidos: el cliente registrado crea y consulta los suyos; el administrador gestiona todos.
router.post("/orders", requireLogin, orders.create);
router.get("/orders", requireAdmin, orders.list);
router.get("/orders/mine", requireLogin, orders.listMine);
router.get("/orders/:id", requireLogin, orders.get);
router.patch("/orders/:id/status", requireAdmin, orders.updateStatus);

module.exports = router;
