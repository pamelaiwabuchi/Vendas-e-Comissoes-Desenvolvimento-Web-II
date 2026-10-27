const express = require("express");
const vendaService = require("../services/vendaService");

const router = express.Router();

// POST /vendas - Registrar venda
router.post("/", async (req, res, next) => {
  try {
    const venda = await vendaService.registrarVenda(req.body);
    res.status(201).json(venda);
  } catch (erro) {
    next(erro);
  }
});

// GET /vendas - Listar vendas
router.get("/", async (req, res, next) => {
  try {
    const vendas = await vendaService.listarVendas();
    res.status(200).json(vendas);
  } catch (erro) {
    next(erro);
  }
});

// GET /vendas/vendedor/:id - Consultar vendas por vendedor
router.get("/vendedor/:id", async (req, res, next) => {
  try {
    const vendas = await vendaService.consultarVendasPorVendedor(req.params.id);
    res.status(200).json(vendas);
  } catch (erro) {
    next(erro);
  }
});

// GET /vendas/regiao/:id - Consultar vendas por região
router.get("/regiao/:id", async (req, res, next) => {
  try {
    const vendas = await vendaService.consultarVendasPorRegiao(req.params.id);
    res.status(200).json(vendas);
  } catch (erro) {
    next(erro);
  }
});

// DELETE /vendas/:id - Excluir venda
router.delete("/:id", async (req, res, next) => {
  try {
    const venda = await vendaService.excluirVenda(req.params.id);
    res.status(200).json({ mensagem: "Venda excluída com sucesso.", venda });
  } catch (erro) {
    next(erro);
  }
});

module.exports = router;
