const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const mercadopago = require("mercadopago");
const { dbPromise } = require("./db");

// Rotas do projeto
const clientesRoutes = require("./routes/clientes");
const vendasRoutes = require("./routes/vendas");
const produtosRoutes = require("./routes/produtos");
const carrinhoRoutes = require("./routes/carrinho");
const promocoesRoutes = require("./routes/promocoes");
const lojasRoutes = require("./routes/lojas");
const pixRoutes = require("./routes/pix");
const checkoutRoutes = require("./routes/checkout");

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

// Servir imagens
app.use("/imagens", express.static(path.join(__dirname, "imagens")));

// 📸 Upload de imagem (com Multer)
// Configuração do armazenamento de arquivos do multer
const storage = multer.diskStorage({
  // Define a pasta de destino onde o arquivo será salvo
  destination: function (req, file, cb) {
    const cnpj = req.params.cnpj; // Obtém o CNPJ da URL (ex: /imagens/:cnpj/produtos)
    const pasta = path.join(__dirname, "imagens", cnpj, "produtos"); // Caminho completo da pasta de destino

    fs.mkdirSync(pasta, { recursive: true }); // Cria o diretório, inclusive pais, se ainda não existir
    cb(null, pasta); // Informa ao multer onde salvar o arquivo
  },

  // Define o nome do arquivo no momento do salvamento
  filename: function (req, file, cb) {
    const pasta = path.join(__dirname, "imagens", req.params.cnpj, "produtos"); // Caminho da pasta de destino
    const caminho = path.join(pasta, file.originalname); // Caminho completo do arquivo (caso use o nome original)

    // Verifica se já existe um arquivo com o mesmo nome
    if (fs.existsSync(caminho)) {
      const ext = path.extname(file.originalname); // Pega a extensão (.jpg, .png, etc)
      const base = path.basename(file.originalname, ext); // Pega o nome do arquivo sem a extensão
      const novoNome = `${base}-${Date.now()}${ext}`; // Cria um novo nome com timestamp para evitar sobrescrever
      cb(null, novoNome); // Usa o nome alternativo
    } else {
      cb(null, file.originalname); // Se não existir, usa o nome original
    }
  },
});

// Cria o middleware multer com a configuração de armazenamento definida
const upload = multer({ storage });

// Define a rota de upload de imagem
// A rota espera um CNPJ na URL e um campo "imagem" com o arquivo
app.post("/imagens/:cnpj/produtos", upload.single("imagem"), (req, res) => {
  // Verifica se algum arquivo foi realmente enviado
  if (!req.file) {
    return res.status(400).send("Nenhuma imagem enviada.");
  }

  // Se chegou até aqui, o upload foi bem-sucedido
  return res.status(200).send("Imagem enviada com sucesso.");
});

// Rotas do app
app.use("/clientes", clientesRoutes);
app.use("/vendas", vendasRoutes);
app.use("/produtos", produtosRoutes);
app.use("/carrinho", carrinhoRoutes);
app.use("/promocoes", promocoesRoutes);
app.use("/lojas", lojasRoutes);
app.use("/checkout", checkoutRoutes);
app.use("/pix", pixRoutes);

// ✅ Webhook do Mercado Pago (notificações automáticas)
app.post("/webhooks", async (req, res) => {
  if (req.body?.data?.id) {
    const paymentId = req.body.data.id;
    const pagamento = await mercadopago.payment.findById(paymentId);
    const status = pagamento.body.status;
    const id = pagamento.body.external_reference;
    const bandeira = pagamento.body.payment_method_id;
    const tipo_id = pagamento.body.payment_type_id;
    const motivo = pagamento.body.status_detail;

    console.log("Pagamento:", {
      paymentId,
      status,
      id,
      motivo,
    });

    await dbPromise.query(
      "UPDATE vendas SET id_pagamento = ?, tipo_pagamento = ?, bandeira = ?, status = ?, st_pagamento = ? WHERE id_venda = ?",
      [paymentId, tipo_id, bandeira, status, "Pago", id]
    );
  }
  res.sendStatus(200);
});

// ✅ Rotas de retorno visual para testes via navegador
app.get("/pagamento/sucesso", (req, res) => {
  res.send("✅ Pagamento aprovado com sucesso!");
});

app.get("/pagamento/falha", (req, res) => {
  res.send("❌ Ocorreu um erro no pagamento.");
});

app.get("/pagamento/pendente", (req, res) => {
  res.send("⏳ Seu pagamento está pendente de aprovação.");
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
});
