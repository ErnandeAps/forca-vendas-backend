const express = require("express");
const router = express.Router();
const { dbPromise } = require("../db");

// 🔸 Listar todas as vendas
router.get("/", async (req, res) => {
  try {
    const [results] = await dbPromise.query("SELECT * FROM vendas");
    res.json(results);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// 🔸 Buscar uma venda por ID
router.get("/vendas/:id", async (req, res) => {
  try {
    const [results] = await dbPromise.query(
      "SELECT * FROM vendas WHERE id = ?",
      [req.params.id]
    );
    if (results.length === 0)
      return res.status(404).json({ msg: "Venda não encontrada" });
    res.json(results[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// 🔸 Criar nova venda
router.post("/", async (req, res) => {
  try {
    const { id_cliente, nome, data, total, formapag, tipo, st } = req.body;
    const sql =
      "INSERT INTO vendas (id_cliente, nome, data, total, formapag, tipo, st) VALUES (?, ?, ?, ?, ?, ?, ?)";
    const [result] = await dbPromise.query(sql, [
      id_cliente,
      nome,
      data,
      total,
      formapag,
      tipo,
      st,
    ]);
    res.status(201).json({
      id: result.insertId,
      id_cliente,
      nome,
      data,
      total,
      formapag,
      tipo,
      st,
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// 🔸 Criar novo item de venda
router.post("/itens", async (req, res) => {
  try {
    const { id_pedido, id_produto, produto, qtd, valor_unit, total } = req.body;
    const sql =
      "INSERT INTO vendasitens (id_pedido, id_produto, produto, qtd, valor_unit, total) VALUES (?, ?, ?, ?, ?, ?)";
    const [result] = await dbPromise.query(sql, [
      id_pedido,
      id_produto,
      produto,
      qtd,
      valor_unit,
      total,
    ]);
    res.status(201).json({
      id: result.insertId,
      id_pedido,
      id_produto,
      produto,
      qtd,
      valor_unit,
      total,
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// 🔸 Atualizar venda
router.put("/:id", async (req, res) => {
  try {
    const { cliente, valor, data } = req.body;
    const sql =
      "UPDATE vendas SET cliente = ?, valor = ?, data = ? WHERE id = ?";
    await dbPromise.query(sql, [cliente, valor, data, req.params.id]);
    res.json({ msg: "Venda atualizada com sucesso" });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// 🔸 Deletar venda
router.delete("/:id", async (req, res) => {
  try {
    await dbPromise.query("DELETE FROM vendas WHERE id = ?", [req.params.id]);
    res.json({ msg: "Venda excluída com sucesso" });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;
