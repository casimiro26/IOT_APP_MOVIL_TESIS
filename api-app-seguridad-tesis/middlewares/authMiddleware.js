const jwt = require("jsonwebtoken");
require("dotenv").config();

const autenticarToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ mensaje: "No se proporcionó token" });

  jwt.verify(token, process.env.JWT_SECRET, (err, usuario) => {
    if (err) return res.status(403).json({ mensaje: "Token inválido" });
    req.usuario = usuario;
    next();
  });
};

module.exports = autenticarToken;