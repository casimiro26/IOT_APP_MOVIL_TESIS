const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

dotenv.config();

const app = express();
const server = http.createServer(app);

// Configuración de CORS
app.use(
  cors({
    origin: [
      "http://localhost:8081",
      /^exp:\/\/.*/, // Permite cualquier origen que comience con exp:// (para Expo Go)
      "https://your-app.onrender.com", // Reemplaza con el dominio de tu frontend si está desplegado
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:8081",
      /^exp:\/\/.*/,
      "https://your-app.onrender.com", // Reemplaza con el dominio de tu frontend si está desplegado
    ],
    methods: ["GET", "POST"],
  },
});

app.use(express.json());

// Conexión a MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Conectado a MongoDB"))
  .catch((err) => console.error("Error al conectar a MongoDB:", err.message));

// Esquema de Usuario
const userSchema = new mongoose.Schema({
  nombreCompleto: { type: String, required: true },
  correo: { type: String, required: true, unique: true },
  nombreUsuario: { type: String, required: true, unique: true },
  contrasena: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

// Esquema de Datos (existente)
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

// Esquema de Evento (nuevo, para monitoring_events)
const eventSchema = new mongoose.Schema({
  user_id: { type: String, required: true }, // Usamos String para el ObjectId como string
  event_type: { type: String, required: true },
  event_value: { type: Number, required: true },
  status: { type: String, required: true },
  description: { type: String },
  created_at: { type: Date, default: Date.now },
});

const Event = mongoose.model("Event", eventSchema);

// Esquema de Contador (para generar IDs únicos)
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.model("Counter", counterSchema);

// Función para obtener el siguiente ID secuencial
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

// Middleware para autenticar token
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

// Endpoint para registrar usuario
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
    res
      .status(500)
      .json({ mensaje: "Error al registrar usuario: " + err.message });
  }
});

// Endpoint para iniciar sesión
app.post("/iniciar-sesion", async (req, res) => {
  try {
    const { nombreUsuario, contrasena } = req.body;
    console.log("Solicitud recibida:", { nombreUsuario, contrasena });
    if (!nombreUsuario || !contrasena) {
      return res
        .status(400)
        .json({ mensaje: "Faltan nombreUsuario o contrasena" });
    }
    const usuario = await User.findOne({
      $or: [{ nombreUsuario }, { correo: nombreUsuario }],
    });
    console.log("Usuario encontrado:", usuario);
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
    console.error("Error en /iniciar-sesion:", err);
    res
      .status(500)
      .json({ mensaje: "Error al iniciar sesión: " + err.message });
  }
});

// Endpoint para guardar datos (existente)
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

// Endpoint para obtener datos (existente)
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

// Endpoint para obtener datos del usuario
app.get("/user/me", autenticarToken, async (req, res) => {
  try {
    const user = await User.findById(req.usuario.id).select(
      "nombreCompleto nombreUsuario correo"
    );
    if (!user) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }
    res.json(user);
  } catch (err) {
    res
      .status(500)
      .json({ mensaje: "Error al obtener datos del usuario: " + err.message });
  }
});

// Endpoint para obtener eventos
app.get("/eventos", autenticarToken, async (req, res) => {
  try {
    const eventos = await Event.find({ user_id: req.usuario.id }).sort({
      created_at: -1,
    });
    res.json({ eventos });
  } catch (error) {
    console.error("Error al cargar eventos:", error);
    res.status(500).json({ mensaje: "Error al cargar eventos" });
  }
});

// Endpoint para crear un nuevo evento
app.post("/eventos/crear", autenticarToken, async (req, res) => {
  try {
    const { user_id, event_type, event_value, status, description, created_at } =
      req.body;
    if (!user_id || !event_type || !event_value || !status) {
      return res
        .status(400)
        .json({ mensaje: "Faltan campos requeridos" });
    }
    if (user_id !== req.usuario.id) {
      return res.status(403).json({ mensaje: "No autorizado" });
    }

    const evento = new Event({
      user_id,
      event_type,
      event_value,
      status,
      description,
      created_at: created_at || new Date(),
    });

    await evento.save();
    io.emit("nuevoEvento", evento); // Emitir evento por Socket.IO
    res.json({ mensaje: "Evento creado" });
  } catch (error) {
    console.error("Error al crear evento:", error);
    res.status(500).json({ mensaje: "Error al crear evento" });
  }
});

// Socket.IO
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