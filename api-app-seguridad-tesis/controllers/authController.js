const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config();

const registrar = async (req, res) => {
  try {
    const { nombreCompleto, correo, nombreUsuario, contrasena } = req.body;
    if (!nombreCompleto || !correo || !nombreUsuario || !contrasena) {
      return res.status(400).json({ mensaje: "Todos los campos son requeridos" });
    }

    const usuarioExistente = await User.findOne({
      $or: [{ correo }, { nombreUsuario }],
    });
    if (usuarioExistente) {
      return res.status(400).json({ mensaje: "Inicia Sesión Causa" });
    }

    const contrasenaEncriptada = await bcrypt.hash(contrasena, 10);
    const usuario = new User({
      nombreCompleto,
      correo,
      nombreUsuario,
      contrasena: contrasenaEncriptada,
    });
    await usuario.save();

    res.status(201).json({ mensaje: "Usuario registrado" });
  } catch (err) {
    res.status(500).json({ mensaje: "Error al registrar usuario: " + err.message });
  }
};

const iniciarSesion = async (req, res) => {
  try {
    const { nombreUsuario, contrasena } = req.body;
    if (!nombreUsuario || !contrasena) {
      return res.status(400).json({ mensaje: "Faltan credenciales" });
    }

    const usuario = await User.findOne({ nombreUsuario });
    if (!usuario || !(await bcrypt.compare(contrasena, usuario.contrasena))) {
      return res.status(400).json({ mensaje: "Credenciales inválidas" });
    }

    const token = jwt.sign(
      { id: usuario._id, nombreUsuario: usuario.nombreUsuario },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ mensaje: "Error al iniciar sesión: " + err.message });
  }
};

module.exports = { registrar, iniciarSesion };