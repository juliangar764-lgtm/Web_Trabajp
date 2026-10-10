const { Router } = require("express");
const { servePage } = require("../controllers/page.controller");
const { loadUser, requireAdminPage } = require("../middlewares/auth");

const router = Router();

router.get("/", servePage());
// Todo el panel exige una sesión de administrador.
router.use("/admin", loadUser, requireAdminPage);
router.get("/admin", (req, res) => res.redirect("/admin/index.html"));
router.get("/admin/:page.html", servePage("admin"));
router.get("/:page.html", servePage());

module.exports = router;
