require("dotenv").config();
const express = require("express");
const { testarConexao } = require("./config/db");
const AppError = require("./utils/AppError");

const app = express();
app.use(express.json());

app.use("/vendedores", require("./routes/vendedorRoutes"));
app.use("/vendas", require("./routes/vendaRoutes"));
app.use("/relatorios", require("./routes/relatorioRoutes"));

// Rota inexistente -> 404
app.use((req, res) => {
  res.status(404).json({ erro: "Rota não encontrada." });
});

// Tratamento central de erros
app.use((erro, req, res, next) => {
  // Erros previstos (validação, não encontrado, duplicado)
  if (erro instanceof AppError) {
    return res.status(erro.status).json({ erro: erro.message });
  }
  // Falha de conexão ou de consulta ao banco, ou qualquer erro inesperado
  console.error(erro.message);
  res.status(500).json({ erro: "Erro interno do servidor.", detalhe: erro.message });
});

const PORTA = process.env.PORT || 3000;

app.listen(PORTA, async () => {
  console.log(`Servidor rodando em http://localhost:${PORTA}`);
  try {
    await testarConexao();
  } catch {
    console.error("A API está no ar, mas as rotas vão responder 500 até o banco estar disponível.");
  }
});
