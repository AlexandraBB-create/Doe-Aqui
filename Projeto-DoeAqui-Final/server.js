require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const mysql = require("mysql2/promise");

const authRoutes = require("./routes/auth");
const donationRoutes = require("./routes/donations");
const requestRoutes = require("./routes/requests");

const requiredVariables = [
  "DB_HOST",
  "DB_USER",
  "DB_NAME",
  "JWT_SECRET"
];

for (const variable of requiredVariables) {
  if (!process.env[variable]) {
    throw new Error(`Variável de ambiente ausente: ${variable}`);
  }
}

const app = express();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  charset: "utf8mb4"
});

app.locals.db = pool;

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", async (req, res, next) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok" });
  } catch (error) {
    next(error);
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/doacoes", donationRoutes);
app.use("/api/solicitacoes", requestRoutes);

app.use("/api", (req, res) => {
  res.status(404).json({ error: "Rota não encontrada." });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(error.status || 500).json({
    error: error.status ? error.message : "Erro interno do servidor."
  });
});

const port = Number(process.env.PORT || 3000);

app.listen(port, () => {
  console.log(`DoaAqui disponível em http://localhost:${port}`);
});
