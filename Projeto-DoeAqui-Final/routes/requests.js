const express = require("express");
const auth = require("../middleware/auth");

const router = express.Router();

router.use(auth);

router.post("/", async (req, res, next) => {
  try {
    const { donationId, message } = req.body;

    if (!donationId || !message?.trim()) {
      return res.status(400).json({
        error: "Doação e mensagem são obrigatórias."
      });
    }

    const [donations] = await req.app.locals.db.execute(
      `SELECT id, owner_id, status
       FROM donations
       WHERE id = ?`,
      [donationId]
    );

    const donation = donations[0];

    if (!donation || donation.status !== "DISPONIVEL") {
      return res.status(404).json({ error: "Doação indisponível." });
    }

    if (donation.owner_id === req.user.id) {
      return res.status(400).json({
        error: "Você não pode solicitar sua própria doação."
      });
    }

    try {
      const [result] = await req.app.locals.db.execute(
        `INSERT INTO donation_requests
         (donation_id, requester_id, message)
         VALUES (?, ?, ?)`,
        [donationId, req.user.id, message.trim().slice(0, 500)]
      );

      res.status(201).json({
        id: result.insertId,
        message: "Solicitação enviada."
      });
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
          error: "Você já solicitou esta doação."
        });
      }

      throw error;
    }
  } catch (error) {
    next(error);
  }
});

router.get("/recebidas", async (req, res, next) => {
  try {
    const [rows] = await req.app.locals.db.execute(
      `SELECT
         r.id, r.message, r.status, r.created_at,
         d.id AS donation_id, d.title,
         u.name AS requester_name,
         u.email AS requester_email,
         u.phone AS requester_phone
       FROM donation_requests r
       JOIN donations d ON d.id = r.donation_id
       JOIN users u ON u.id = r.requester_id
       WHERE d.owner_id = ?
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );

    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get("/enviadas", async (req, res, next) => {
  try {
    const [rows] = await req.app.locals.db.execute(
      `SELECT
         r.id, r.message, r.status, r.created_at,
         d.id AS donation_id, d.title, d.city, d.state,
         u.name AS owner_name
       FROM donation_requests r
       JOIN donations d ON d.id = r.donation_id
       JOIN users u ON u.id = d.owner_id
       WHERE r.requester_id = ?
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );

    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  const connection = await req.app.locals.db.getConnection();

  try {
    const { status } = req.body;

    if (!["ACEITA", "RECUSADA"].includes(status)) {
      return res.status(400).json({ error: "Status inválido." });
    }

    await connection.beginTransaction();

    const [rows] = await connection.execute(
      `SELECT r.id, r.donation_id, r.status, d.owner_id
       FROM donation_requests r
       JOIN donations d ON d.id = r.donation_id
       WHERE r.id = ?
       FOR UPDATE`,
      [req.params.id]
    );

    const request = rows[0];

    if (!request || request.owner_id !== req.user.id) {
      await connection.rollback();
      return res.status(404).json({
        error: "Solicitação não encontrada ou sem permissão."
      });
    }

    if (request.status !== "PENDENTE") {
      await connection.rollback();
      return res.status(409).json({
        error: "Esta solicitação já foi respondida."
      });
    }

    await connection.execute(
      "UPDATE donation_requests SET status = ? WHERE id = ?",
      [status, req.params.id]
    );

    if (status === "ACEITA") {
      await connection.execute(
        `UPDATE donations
         SET status = 'RESERVADA'
         WHERE id = ?`,
        [request.donation_id]
      );

      await connection.execute(
        `UPDATE donation_requests
         SET status = 'RECUSADA'
         WHERE donation_id = ?
           AND id <> ?
           AND status = 'PENDENTE'`,
        [request.donation_id, req.params.id]
      );
    }

    await connection.commit();
    res.json({ message: "Solicitação atualizada." });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

module.exports = router;
