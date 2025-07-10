const mysql = require("mysql2");

/*
// 🔹 Conexão local
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "(#suporte#)",
  database: "vendasdb",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
*/
//Conexão com o banco

const pool = mysql.createPool({
  host: "caboose.proxy.rlwy.net",
  user: "root",
  port: 18833, // ← CORRETO (com p minúsculo)
  password: "pzmFuGklAQqcuVSvhmcgdQVbvtGKIwsJ",
  database: "vendasdb",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// 🔸 Modo com Promises (para usar com async/await)
const dbPromise = pool.promise();

// 🔸 Modo com Callback (para manter compatibilidade com código legado)
const dbCallback = pool;

pool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Erro ao conectar no MySQL:", err);
    throw err;
  }
  console.log("✅ Conectado ao MySQL!");
  connection.release(); // libera a conexão de volta para o pool
});

// 🔸 Exporta os dois modos
module.exports = {
  dbPromise, // usar com async/await
  dbCallback, // usar com callbacks
};
