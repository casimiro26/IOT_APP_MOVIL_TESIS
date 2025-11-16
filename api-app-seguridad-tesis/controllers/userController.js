const User = require("../models/User");

const obtenerPerfil = async (req, res) => {
  try {
    const user = await User.findById(req.usuario.id).select(
      "nombreCompleto nombreUsuario correo"
    );
    if (!user) return res.status(404).json({ mensaje: "Usuario no encontrado" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ mensaje: "Error al obtener perfil: " + err.message });
  }
};

module.exports = { obtenerPerfil };