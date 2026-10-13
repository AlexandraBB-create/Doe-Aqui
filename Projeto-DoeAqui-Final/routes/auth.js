const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const router = express.Router();

function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

router.post("/cadastro", async (req, res, next) => {
  try {
    const { name, email, password, phone, city, state } = req.body;

    if (!name || !email || !password || !city || !state) {
      return res.status(400).json({
        error: "Nome, e-mail, senha, cidade e estado são obrigatórios."
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "A senha deve ter ao menos 6 caracteres."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedState = state.trim().toUpperCase().slice(0, 2);

    const [existing] = await req.app.locals.db.execute(
      "SELECT id FROM users WHERE email = ?",
      [normalizedEmail]
    );

    if (existing.length) {
      return res.status(409).json({ error: "E-mail já cadastrado." });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [result] = await req.app.locals.db.execute(
      `INSERT INTO users
       (name, email, password_hash, phone, city, state)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        normalizedEmail,
        passwordHash,
        phone?.trim() || null,
        city.trim(),
        normalizedState
      ]
    );

    const user = {
      id: result.insertId,
      name: name.trim(),
      email: normalizedEmail
    };

    res.status(201).json({
      token: createToken(user),
      user
    });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "E-mail e senha são obrigatórios."
      });
    }

    const [rows] = await req.app.locals.db.execute(
      `SELECT id, name, email, password_hash
       FROM users
       WHERE email = ?`,
      [email.trim().toLowerCase()]
    );

    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "E-mail ou senha incorretos." });
    }

    res.json({
      token: createToken(user),
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
