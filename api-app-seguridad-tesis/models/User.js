const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  nombreCompleto: { type: String, required: true },
  correo: { type: String, required: true, unique: true },
  nombreUsuario: { type: String, required: true, unique: true },
  contrasena: { type: String, required: true },
});

module.exports = mongoose.model("User", userSchema);