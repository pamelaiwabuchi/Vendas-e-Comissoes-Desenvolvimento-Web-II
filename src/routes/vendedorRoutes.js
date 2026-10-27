const express = require("express");
const vendedorService = require("../services/vendedorService");

const router = express.Router();

// POST /vendedores - Cadastrar vendedor
router.post("/", async (req, res, next) => {
  try {
    const vendedor = await vendedorService.cadastrarVendedor(req.body);
    res.status(201).json(vendedor);
  } catch (erro) {
    next(erro);
  }
});

// GET /vendedores - Listar vendedores
router.get("/", async (req, res, next) => {
  try {
    const vendedores = await vendedorService.listarVendedores();
    res.status(200).json(vendedores);
  } catch (erro) {
    next(erro);
  }
});

// GET /vendedores/:id - Consultar vendedor
router.get("/:id", async (req, res, next) => {
  try {
    const vendedor = await vendedorService.buscarVendedorPorId(req.params.id);
    res.status(200).json(vendedor);
  } catch (erro) {
    next(erro);
  }
});

// PUT /vendedores/:id - Atualizar meta mensal e percentual base
router.put("/:id", async (req, res, next) => {
  try {
    const vendedor = await vendedorService.atualizarVendedor(req.params.id, req.body);
    res.status(200).json(vendedor);
  } catch (erro) {
    next(erro);
  }
});

// PATCH /vendedores/:id/desativar - Desativar vendedor
router.patch("/:id/desativar", async (req, res, next) => {
  try {
    const vendedor = await vendedorService.desativarVendedor(req.params.id);
    res.status(200).json({ mensagem: "Vendedor desativado com sucesso.", vendedor });
  } catch (erro) {
    next(erro);
  }
});

module.exports = router;
