const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const http = require("http");
const socketIo = require("socket.io");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Permite conexiones WebSocket desde cualquier origen (ajusta según necesidad)
    methods: ["GET", "POST"],
  },
});

app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Conectado a MongoDB"))
  .catch((err) => console.error("Error al conectar a MongoDB:", err.message));

const userSchema = new mongoose.Schema({
  nombreCompleto: { type: String, required: true },
  correo: { type: String, required: true, unique: true },
  nombreUsuario: { type: String, required: true, unique: true },
  contrasena: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

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

const Data = mongoose.model("Data", dataSchema);

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.model("Counter", counterSchema);

async function obtenerSiguienteSecuencia(nombre) {
  try {
    const contador = await Counter.findOneAndUpdate(
      { _id: nombre },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    return contador.seq;
  } catch (err) {
    throw new Error("Error al generar ID: " + err.message);
  }
}

function autenticarToken(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ mensaje: "No se proporcionó un token" });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, usuario) => {
    if (err) {
      return res.status(403).json({ mensaje: "Token inválido" });
    }
    req.usuario = usuario;
    next();
  });
}

app.post("/registrar", async (req, res) => {
  try {
    const { nombreCompleto, correo, nombreUsuario, contrasena } = req.body;
    if (!nombreCompleto || !correo || !nombreUsuario || !contrasena) {
      return res
        .status(400)
        .json({ mensaje: "Todos los campos son requeridos" });
    }
    const usuarioExistente = await User.findOne({
      $or: [{ correo }, { nombreUsuario }],
    });
    if (usuarioExistente) {
      return res.status(400).json({ mensaje: "El usuario ya existe" });
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
    res
      .status(500)
      .json({ mensaje: "Error al registrar usuario: " + err.message });
  }
});

app.post("/iniciar-sesion", async (req, res) => {
  try {
    const { nombreUsuario, contrasena } = req.body;
    if (!nombreUsuario || !contrasena) {
      return res
        .status(400)
        .json({ mensaje: "Faltan nombreUsuario o contrasena" });
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
    res
      .status(500)
      .json({ mensaje: "Error al iniciar sesión: " + err.message });
  }
});

app.post("/datos", autenticarToken, async (req, res) => {
  try {
    const { horasMonitoreadas, eventosTotales, eventosCriticos, movimiento } =
      req.body;
    if (
      horasMonitoreadas == null ||
      eventosTotales == null ||
      eventosCriticos == null ||
      !["sí", "no"].includes(movimiento)
    ) {
      return res
        .status(400)
        .json({ mensaje: "Faltan campos requeridos o movimiento inválido" });
    }
    const promedio = (eventosCriticos / eventosTotales) * 100 || 0;
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
    io.emit("nuevoDato", datos);
    res.status(201).json(datos);
  } catch (err) {
    res.status(500).json({ mensaje: "Error al guardar datos: " + err.message });
  }
});

app.get("/datos", autenticarToken, async (req, res) => {
  try {
    const { filtro } = req.query;
    let fechaInicio;
    const ahora = new Date();
    if (filtro === "hoy") {
      fechaInicio = new Date(
        ahora.getFullYear(),
        ahora.getMonth(),
        ahora.getDate()
      );
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
    if (fechaInicio) {
      consulta.marcaTiempo = { $gte: fechaInicio };
    }
    const datos = await Data.find(consulta).sort({ marcaTiempo: -1 });
    res.json(datos);
  } catch (err) {
    res.status(500).json({ mensaje: "Error al obtener datos: " + err.message });
  }
});

app.get('/user/me', autenticarToken, async (req, res) => {
  try {
    const user = await User.findById(req.usuario.id).select('nombreCompleto nombreUsuario correo');
    if (!user) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener datos del usuario: ' + err.message });
  }
});

io.on("connection", (socket) => {
  console.log("Cliente conectado");
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
        return socket.emit(
          "error",
          "Faltan campos requeridos o movimiento inválido"
        );
      }
      const promedio = (eventosCriticos / eventosTotales) * 100 || 0;
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
    console.log("Cliente desconectado");
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log(`Servidor ejecutándose en el puerto ${PORT}`)
);