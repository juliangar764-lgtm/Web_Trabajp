// Configuración leída de variables de entorno (en el hosting se definen en su panel).
const isProduction = process.env.NODE_ENV === "production";

// Solo dígitos con lada del país, p. ej. 529621234567. Si no es válido, se ignora.
const whatsappDigits = String(process.env.WHATSAPP_NUMBER ?? "").replace(/\D/g, "");

module.exports = {
  isProduction,
  port: Number(process.env.PORT) || 3000,
  // Número de proxies de confianza delante de la app (1 en Render, Railway, Nginx, etc.).
  trustProxy: Number(process.env.TRUST_PROXY ?? (isProduction ? 1 : 0)),
  sessionDays: Number(process.env.SESSION_DAYS) || 7,
  whatsappNumber: /^\d{10,15}$/.test(whatsappDigits) ? whatsappDigits : null,
};
