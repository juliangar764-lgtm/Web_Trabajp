const HttpError = require("../utils/httpError");
const { isProduction } = require("../config/env");

const CSP = [
  "default-src 'self'",
  "img-src 'self' data:",
  "style-src 'self'",
  "script-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

function securityHeaders(req, res, next) {
  res.set({
    "Content-Security-Policy": CSP,
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  });
  if (isProduction) res.set("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
  next();
}

/** Rechaza peticiones que cambian datos desde otro sitio (defensa extra contra CSRF). */
function sameOriginOnly(req, res, next) {
  const unsafe = !["GET", "HEAD", "OPTIONS"].includes(req.method);
  const origin = req.get("origin");
  if (unsafe && origin) {
    let host;
    try {
      host = new URL(origin).host;
    } catch {
      host = null;
    }
    if (host !== req.get("host")) throw new HttpError(403, "Origen no permitido.");
  }
  next();
}

/** Limitador simple en memoria por IP (suficiente para una sola instancia). */
function rateLimit({ max, windowMs, message }) {
  const hits = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) if (entry.reset <= now) hits.delete(key);
  }, windowMs).unref();

  return (req, res, next) => {
    const now = Date.now();
    const entry = hits.get(req.ip) ?? { count: 0, reset: now + windowMs };
    entry.count += 1;
    hits.set(req.ip, entry);
    if (entry.count > max) {
      res.set("Retry-After", String(Math.ceil((entry.reset - now) / 1000)));
      throw new HttpError(429, message);
    }
    next();
  };
}

module.exports = { securityHeaders, sameOriginOnly, rateLimit };
