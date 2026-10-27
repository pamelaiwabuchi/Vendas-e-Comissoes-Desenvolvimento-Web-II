const express = require("express");
const { gerarRelatorioPerformance } = require("../services/relatorioService");

const router = express.Router();

// GET /relatorios/performance?inicio=2026-10-01&fim=2026-10-31
router.get("/performance", async (req, res, next) => {
  try {
    const { inicio, fim } = req.query;
    const relatorio = await gerarRelatorioPerformance(inicio, fim);
    res.status(200).json(relatorio);
  } catch (erro) {
    next(erro);
  }
});

module.exports = router;
