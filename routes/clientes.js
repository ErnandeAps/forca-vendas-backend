const express = require("express");
const router = express.Router();
const { dbPromise } = require("../db");

// 🔹 Buscar cliente por ID ou Celular
router.get("/:param", async (req, res) => {
  const { param } = req.params;
  const isCelular = /^\d{9,15}$/.test(param); // Ex: 84998715995

  try {
    const query = isCelular
      ? "SELECT * FROM clientes WHERE telefone = ?"
      : "SELECT * FROM clientes WHERE id = ?";
    const [results] = await dbPromise.query(query, [param]);

    if (results.length === 0) {
      return res.status(404).send("Cliente não encontrado");
    }

    res.json(results[0]);
  } catch (err) {
    console.error("Erro ao buscar cliente:", err);
    res.status(500).send("Erro ao buscar cliente");
  }
});

// 🔹 Listar todos os clientes
router.get("/", async (req, res) => {
  try {
    const [results] = await dbPromise.query("SELECT * FROM clientes");
    res.json(results);
  } catch (err) {
    console.error("Erro ao listar clientes:", err);
    res.status(500).send("Erro ao listar clientes");
  }
});

// 🔹 Adicionar novo cliente
router.post("/", async (req, res) => {
  const cliente = req.body;
  try {
    const [result] = await dbPromise.query(
      "INSERT INTO clientes SET ?",
      cliente
    );
    res.json({ id: result.insertId, ...cliente });
  } catch (err) {
    console.error("Erro ao adicionar cliente:", err);
    res.status(500).send("Erro ao adicionar cliente");
  }
});

// 🔹 Atualizar cliente
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const cliente = req.body;
  try {
    await dbPromise.query("UPDATE clientes SET ? WHERE id = ?", [cliente, id]);
    res.json({ id, ...cliente });
  } catch (err) {
    console.error("Erro ao atualizar cliente:", err);
    res.status(500).send("Erro ao atualizar cliente");
  }
});

// 🔹 Excluir cliente
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await dbPromise.query("DELETE FROM clientes WHERE id = ?", [id]);
    res.send("Cliente deletado com sucesso");
  } catch (err) {
    console.error("Erro ao deletar cliente:", err);
    res.status(500).send("Erro ao deletar cliente");
  }
});

module.exports = router;
