const Session = require("../models/session.model");
const { isProduction, sessionDays } = require("../config/env");
const HttpError = require("../utils/httpError");

const COOKIE_NAME = "caberti_sid";

function readCookie(header = "", name) {
  for (const part of header.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return null;
}

const getToken = (req) => readCookie(req.headers.cookie, COOKIE_NAME);

function setSessionCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true, // inaccesible para JavaScript de la página
    sameSite: "lax",
    secure: isProduction, // solo por HTTPS en producción
    maxAge: sessionDays * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

const clearSessionCookie = (res) => res.clearCookie(COOKIE_NAME, { path: "/" });

/** Deja el usuario de la sesión (o null) en `req.user`. */
async function loadUser(req, res, next) {
  const token = getToken(req);
  req.user = token ? await Session.findUserByToken(token) : null;
  next();
}

function requireLogin(req, res, next) {
  if (!req.user) throw new HttpError(401, "Inicia sesión para continuar.");
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user) throw new HttpError(401, "Inicia sesión para continuar.");
  if (req.user.role !== "admin") throw new HttpError(403, "No tienes permiso para esta acción.");
  next();
}

/** Para páginas del panel: en lugar de un error JSON, manda al formulario de acceso. */
function requireAdminPage(req, res, next) {
  if (req.user?.role === "admin") return next();
  res.redirect(`/acceso.html?siguiente=${encodeURIComponent(req.originalUrl)}`);
}

module.exports = {
  getToken,
  setSessionCookie,
  clearSessionCookie,
  loadUser,
  requireLogin,
  requireAdmin,
  requireAdminPage,
};
