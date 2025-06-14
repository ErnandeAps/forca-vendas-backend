const express = require("express");
const router = express.Router();
const { dbPromise } = require("../db");
const mercadopago = require("mercadopago");

// ✅ Configuração do Mercado Pago (modo teste)
mercadopago.configure({
  access_token:
    "TEST-4319705132328627-061002-0c2c998902e04c43a5e012f0da050111-525676884",
});

// ✅ Rota para criar preferência de pagamento
router.post("/", async (req, res) => {
  const { telefone, tipoEntrega, itens, clienteNome } = req.body;

  try {
    const total = itens.reduce((soma, item) => {
      const preco = parseFloat(item.preco.toString().replace(",", "."));
      return soma + item.quantidade * preco;
    }, 0);

    const [itensCarrinho] = await dbPromise.query(
      "SELECT * FROM carrinho WHERE celular = ?",
      [telefone]
    );

    const [vendaResult] = await dbPromise.query(
      `INSERT INTO vendas (celular, nome, tipo_entrega, total, data)
       VALUES (?, ?, ?, ?, NOW())`,
      [telefone, clienteNome, tipoEntrega, total]
    );

    const idVenda = vendaResult.insertId;

    for (const item of itensCarrinho) {
      await dbPromise.query(
        `INSERT INTO vendasitens (id_venda, id_produto, produto, valor, qtd, total)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          idVenda,
          item.id_produto,
          item.produto,
          item.valor,
          item.qtd,
          item.total,
        ]
      );
    }

    await dbPromise.query("DELETE FROM carrinho WHERE celular = ?", [telefone]);

    const preference = {
      external_reference: idVenda.toString(),
      items: [
        {
          title: `Pedido nº ${idVenda} - New Word Pets`,
          quantity: 1,
          unit_price: total,
          currency_id: "BRL",
        },
      ],
      payer: {
        name: clienteNome || "Cliente App",
      },
      notification_url:
        "https://a127-2804-14d-be81-8d21-e5ab-bfd8-fa82-aaa0.ngrok-free.app/webhook",
      back_urls: {
        success:
          "https://a127-2804-14d-be81-8d21-e5ab-bfd8-fa82-aaa0.ngrok-free.app/pagamento/sucesso",
        failure:
          "https://a127-2804-14d-be81-8d21-e5ab-bfd8-fa82-aaa0.ngrok-free.app/pagamento/falha",
        pending:
          "https://a127-2804-14d-be81-8d21-e5ab-bfd8-fa82-aaa0.ngrok-free.app/pagamento/pendente",
      },
      auto_return: "approved",
    };

    const result = await mercadopago.preferences.create(preference);

    // 🔁 Retorna init_point e id para usar no Checkout Bricks
    res.json({
      init_point: result.body.init_point,
      idPreferencia: result.body.id,
    });
  } catch (error) {
    console.error("Erro ao criar preferência:", error);
    res.status(500).json({ error: "Erro ao criar pagamento" });
  }
});

// ✅ Rota para exibir o Checkout Bricks via WebView no app
router.get("/pagamento/:id", (req, res) => {
  const { id } = req.params;
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <title>Pagamento</title>
      <script src="https://sdk.mercadopago.com/js/v2"></script>
      <style>
        body { display: flex; justify-content: center; padding: 40px; }
      </style>
    </head>
    <body>
      <div id="wallet_container"></div>
      <script>
        const mp = new MercadoPago("TEST-cd30747f-0c1a-43e6-9761-6df98b0c78a2", {
          locale: "pt-BR"
        });

        mp.bricks().create("wallet", "wallet_container", {
          initialization: {
            preferenceId: "${id}"
          }
        });
      </script>
    </body>
    </html>
  `);
});

// ✅ Webhook do Mercado Pago
router.post("/webhook", (req, res) => {
  console.log("🔔 Webhook recebido:", req.body);
  res.sendStatus(200);
});

// ✅ Páginas de retorno (testes)
router.get("/pagamento/sucesso", (req, res) => {
  res.send("✅ Pagamento aprovado com sucesso!");
});
router.get("/pagamento/falha", (req, res) => {
  res.send("❌ Ocorreu um erro no pagamento.");
});
router.get("/pagamento/pendente", (req, res) => {
  res.send("⏳ Seu pagamento está pendente de aprovação.");
});

module.exports = router;
