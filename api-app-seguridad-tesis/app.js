const express = require("express");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const { router: dataRoutes, setIo } = require("./routes/dataRoutes");

const app = express();

app.use(express.json());

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/datos", dataRoutes);

module.exports = { app, setIo };