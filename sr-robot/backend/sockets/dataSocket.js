const Data = require("../models/Data");
const obtenerSiguienteSecuencia = require("../utils/counter");

const configurarSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("Cliente WebSocket conectado");

    socket.on("enviarDatos", async (msg) => {
      try {
        const {
          idUsuario,
          horasMonitoreadas,
          eventosTotales,
          eventosCriticos,
          movimiento,
        } = msg;

        if (
          !idUsuario ||
          horasMonitoreadas == null ||
          eventosTotales == null ||
          eventosCriticos == null ||
          !["sí", "no"].includes(movimiento)
        ) {
          return socket.emit("error", "Datos inválidos");
        }

        const promedio = eventosTotales ? (eventosCriticos / eventosTotales) * 100 : 0;
        const id = await obtenerSiguienteSecuencia("idDatos");

        const datos = new Data({
          id,
          idUsuario,
          horasMonitoreadas,
          eventosTotales,
          eventosCriticos,
          movimiento,
          promedio,
        });

        await datos.save();
        io.emit("nuevoDato", datos);
        socket.emit("datoGuardado", datos);
      } catch (err) {
        socket.emit("error", "Error al guardar datos: " + err.message);
      }
    });

    socket.on("disconnect", () => {
      console.log("Cliente WebSocket desconectado");
    });
  });
};

module.exports = configurarSocket;