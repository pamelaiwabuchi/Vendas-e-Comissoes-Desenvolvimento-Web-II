// Conexão com o MySQL usando mysql2/promise.
// As credenciais vêm do arquivo .env (nunca ficam no código-fonte).
require("dotenv").config();
const mysql = require("mysql2/promise");

const conexao = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "db_vendas",
  waitForConnections: true,
  connectionLimit: 10,
  // Faz DECIMAL voltar como número em vez de string
  decimalNumbers: true,
  // Retorna DATETIME como texto ("2026-10-01 09:15:00"), sem conversão de fuso
  dateStrings: true,
});

// Testa a conexão ao iniciar o servidor
async function testarConexao() {
  try {
    const conn = await conexao.getConnection();
    conn.release();
    console.log("Conectado ao MySQL com sucesso.");
  } catch (erro) {
    console.error("Erro ao conectar ao MySQL:", erro.message);
    throw erro;
  }
}

module.exports = { conexao, testarConexao };
