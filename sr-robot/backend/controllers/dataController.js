const Data = require("../models/Data");
const obtenerSiguienteSecuencia = require("../utils/counter");

const crearDatos = async (req, res, io) => {
  try {
    const { horasMonitoreadas, eventosTotales, eventosCriticos, movimiento } = req.body;

    if (
      horasMonitoreadas == null ||
      eventosTotales == null ||
      eventosCriticos == null ||
      !["sí", "no"].includes(movimiento)
    ) {
      return res.status(400).json({ mensaje: "Datos inválidos" });
    }

    const promedio = eventosTotales ? (eventosCriticos / eventosTotales) * 100 : 0;
    const id = await obtenerSiguienteSecuencia("idDatos");

    const datos = new Data({
      id,
      idUsuario: req.usuario.id,
      horasMonitoreadas,
      eventosTotales,
      eventosCriticos,
      movimiento,
      promedio,
    });

    await datos.save();
    io.emit("nuevoDato", datos); // Emitir a todos los clientes
    res.status(201).json(datos);
  } catch (err) {
    res.status(500).json({ mensaje: "Error al guardar datos: " + err.message });
  }
};

const obtenerDatos = async (req, res) => {
  try {
    const { filtro } = req.query;
    let fechaInicio;
    const ahora = new Date();

    if (filtro === "hoy") {
      fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    } else if (filtro === "semana") {
      const dia = ahora.getDay();
      fechaInicio = new Date(
        ahora.getFullYear(),
        ahora.getMonth(),
        ahora.getDate() - dia + (dia === 0 ? -6 : 1)
      );
    } else if (filtro === "mes") {
      fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    }

    const consulta = { idUsuario: req.usuario.id };
    if (fechaInicio) consulta.marcaTiempo = { $gte: fechaInicio };

    const datos = await Data.find(consulta).sort({ marcaTiempo: -1 });
    res.json(datos);
  } catch (err) {
    res.status(500).json({ mensaje: "Error al obtener datos: " + err.message });
  }
};

module.exports = { crearDatos, obtenerDatos };