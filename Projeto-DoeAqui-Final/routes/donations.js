const express = require("express");
const auth = require("../middleware/auth");

const router = express.Router();

const allowedTypes = ["BEM", "SERVICO"];
const allowedDelivery = ["RETIRADA", "ENTREGA", "COMBINAR"];
const allowedStatus = [
  "DISPONIVEL",
  "RESERVADA",
  "CONCLUIDA",
  "CANCELADA"
];

router.get("/", async (req, res, next) => {
  try {
    const { search = "", type = "", category = "", city = "" } = req.query;

    let sql = `
      SELECT
        d.id, d.type, d.title, d.description, d.category,
        d.city, d.state, d.image_url, d.delivery_method,
        d.status, d.created_at,
        u.id AS owner_id, u.name AS owner_name
      FROM donations d
      JOIN users u ON u.id = d.owner_id
      WHERE d.status = 'DISPONIVEL'
    `;

    const values = [];

    if (search.trim()) {
      sql += ` AND (d.title LIKE ? OR d.description LIKE ?)`;
      const term = `%${search.trim()}%`;
      values.push(term, term);
    }

    if (allowedTypes.includes(type)) {
      sql += " AND d.type = ?";
      values.push(type);
    }

    if (category.trim()) {
      sql += " AND d.category = ?";
      values.push(category.trim());
    }

    if (city.trim()) {
      sql += " AND d.city LIKE ?";
      values.push(`%${city.trim()}%`);
    }

    sql += " ORDER BY d.created_at DESC LIMIT 100";

    const [rows] = await req.app.locals.db.execute(sql, values);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get("/minhas", auth, async (req, res, next) => {
  try {
    const [rows] = await req.app.locals.db.execute(
      `SELECT *
       FROM donations
       WHERE owner_id = ?
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.post("/", auth, async (req, res, next) => {
  try {
    const {
      type,
      title,
      description,
      category,
      city,
      state,
      imageUrl,
      deliveryMethod = "COMBINAR"
    } = req.body;

    if (
      !allowedTypes.includes(type) ||
      !title ||
      !description ||
      !category ||
      !city ||
      !state
    ) {
      return res.status(400).json({
        error: "Preencha corretamente os campos obrigatórios."
      });
    }

    if (!allowedDelivery.includes(deliveryMethod)) {
      return res.status(400).json({
        error: "Forma de entrega inválida."
      });
    }

    const [result] = await req.app.locals.db.execute(
      `INSERT INTO donations
       (owner_id, type, title, description, category, city, state,
        image_url, delivery_method)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        type,
        title.trim(),
        description.trim(),
        category.trim(),
        city.trim(),
        state.trim().toUpperCase().slice(0, 2),
        imageUrl?.trim() || null,
        deliveryMethod
      ]
    );

    res.status(201).json({
      id: result.insertId,
      message: "Doação publicada."
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/status", auth, async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ error: "Status inválido." });
    }

    const [result] = await req.app.locals.db.execute(
      `UPDATE donations
       SET status = ?
       WHERE id = ? AND owner_id = ?`,
      [status, req.params.id, req.user.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        error: "Doação não encontrada ou sem permissão."
      });
    }

    res.json({ message: "Status atualizado." });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", auth, async (req, res, next) => {
  try {
    const [result] = await req.app.locals.db.execute(
      "DELETE FROM donations WHERE id = ? AND owner_id = ?",
      [req.params.id, req.user.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        error: "Doação não encontrada ou sem permissão."
      });
    }

    res.json({ message: "Doação excluída." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
