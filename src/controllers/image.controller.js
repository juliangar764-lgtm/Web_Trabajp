const Image = require("../models/image.model");
const Product = require("../models/product.model");
const HttpError = require("../utils/httpError");
const { badRequest, parseId } = require("../utils/validate");

const TYPES = ["image/jpeg", "image/png", "image/webp"];

// No basta con el Content-Type que declara el cliente: se comprueba la firma real del archivo.
const SIGNATURES = {
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/png": (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  "image/webp": (b) => b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP",
};

const upload = async (req, res) => {
  const id = parseId(req.params.id);
  const type = req.get("content-type")?.split(";")[0];
  const data = req.body;
  if (!TYPES.includes(type) || !Buffer.isBuffer(data) || !data.length) {
    throw badRequest("Elige una imagen JPG, PNG o WebP de hasta 1 MB.");
  }
  if (!SIGNATURES[type](data)) throw badRequest("El archivo no es una imagen válida.");
  if (!(await Image.addToProduct(id, type, data))) throw new HttpError(404, "Producto no encontrado.");
  res.status(201).json(await Product.findById(id));
};

const serve = async (req, res) => {
  const image = await Image.findById(parseId(req.params.id));
  if (!image) throw new HttpError(404, "Imagen no encontrada.");
  res.set({ "Content-Type": image.tipo, "Cache-Control": "public, max-age=31536000, immutable" });
  res.send(image.datos);
};

module.exports = { upload, serve };
