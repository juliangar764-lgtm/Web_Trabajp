const Customer = require("../models/customer.model");
const Session = require("../models/session.model");
const HttpError = require("../utils/httpError");
const { hashPassword, verifyPassword } = require("../utils/password");
const { badRequest, text } = require("../utils/validate");
const { getToken, setSessionCookie, clearSessionCookie } = require("../middlewares/auth");

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PG_UNIQUE_VIOLATION = "23505";

// Hash de relleno: así tardamos lo mismo cuando el correo no existe y no se puede averiguar qué correos hay.
const dummyHash = hashPassword("relleno-sin-uso");

function parseEmail(value) {
  const email = text(value, "El correo", { max: 254 }).toLowerCase();
  if (!EMAIL.test(email)) throw badRequest("Escribe un correo válido.");
  return email;
}

function parsePhone(value) {
  const phone = text(value, "El WhatsApp", { max: 30 });
  if (phone.replace(/\D/g, "").length < 10) throw badRequest("Escribe un número de WhatsApp de al menos 10 dígitos.");
  return phone;
}

function parsePassword(value) {
  const password = String(value ?? "");
  if (password.length < 8) throw badRequest("La contraseña debe tener al menos 8 caracteres.");
  if (password.length > 100) throw badRequest("La contraseña no puede superar 100 caracteres.");
  return password;
}

async function startSession(res, user) {
  setSessionCookie(res, await Session.create(user.id));
  Session.purgeExpired().catch(() => {}); // limpieza oportunista, no bloquea la respuesta
}

const register = async (req, res) => {
  const { name, email, phone, password } = {
    name: text(req.body.name, "El nombre"),
    email: parseEmail(req.body.email),
    phone: parsePhone(req.body.phone),
    password: parsePassword(req.body.password),
  };
  let user;
  try {
    user = await Customer.create({ name, email, phone, passwordHash: await hashPassword(password) });
  } catch (error) {
    if (error.code === PG_UNIQUE_VIOLATION) throw new HttpError(409, "Ya existe una cuenta con ese correo.");
    throw error;
  }
  await startSession(res, user);
  res.status(201).json({ user });
};

const login = async (req, res) => {
  const email = String(req.body.email ?? "").trim();
  const password = String(req.body.password ?? "");
  const account = email ? await Customer.findByEmailWithHash(email) : undefined;
  const valid = await verifyPassword(password, account?.passwordHash ?? (await dummyHash));
  if (!account || !valid) throw new HttpError(401, "Correo o contraseña incorrectos.");

  const { passwordHash, ...user } = account;
  await startSession(res, user);
  res.json({ user });
};

const logout = async (req, res) => {
  const token = getToken(req);
  if (token) await Session.remove(token);
  clearSessionCookie(res);
  res.status(204).end();
};

const me = (req, res) => res.json({ user: req.user });

module.exports = { register, login, logout, me };
