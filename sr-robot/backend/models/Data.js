const mongoose = require("mongoose");

const dataSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  idUsuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  marcaTiempo: { type: Date, default: Date.now },
  horasMonitoreadas: { type: Number, required: true },
  eventosTotales: { type: Number, required: true },
  eventosCriticos: { type: Number, required: true },
  movimiento: { type: String, enum: ["sí", "no"], required: true },
  promedio: { type: Number },
});

module.exports = mongoose.model("Data", dataSchema);