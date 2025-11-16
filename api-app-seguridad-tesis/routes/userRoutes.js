const express = require("express");
const router = express.Router();
const { obtenerPerfil } = require("../controllers/userController");
const autenticarToken = require("../middlewares/authMiddleware");

router.get("/me", autenticarToken, obtenerPerfil);

module.exports = router;