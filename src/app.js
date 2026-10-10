const path = require("node:path");
const express = require("express");
const { isProduction, trustProxy } = require("./config/env");
const db = require("./config/db");
const apiRoutes = require("./routes/api.routes");
const pageRoutes = require("./routes/page.routes");
const { loadUser } = require("./middlewares/auth");
const { securityHeaders, sameOriginOnly } = require("./middlewares/security");
const { notFound, errorHandler } = require("./middlewares/errorHandler");

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", trustProxy); // necesario tras el proxy del hosting para la IP real y las cookies seguras
app.use(securityHeaders);

// Comprobación de salud para el hosting (no requiere sesión).
app.get("/health", async (req, res) => {
  await db.query("SELECT 1");
  res.json({ ok: true });
});

app.use(express.static(path.join(__dirname, "..", "public"), { maxAge: isProduction ? "1d" : 0 }));
app.use("/api", sameOriginOnly, express.json({ limit: "100kb" }), loadUser, apiRoutes);
app.use(pageRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
