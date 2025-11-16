const express = require("express");
const router = express.Router();
const { crearDatos, obtenerDatos } = require("../controllers/dataController");
const autenticarToken = require("../middlewares/authMiddleware");

// Pasamos io como parámetro extra (lo inyectaremos desde server.js)
let io;
const setIo = (socketIo) => {
  io = socketIo;
};

router.post("/", autenticarToken, (req, res) => crearDatos(req, res, io));
router.get("/", autenticarToken, obtenerDatos);

module.exports = { router, setIo };