const express = require("express");
const router = express.Router();
const { registrar, iniciarSesion } = require("../controllers/authController");

router.post("/registrar", registrar);
router.post("/iniciar-sesion", iniciarSesion);

module.exports = router;