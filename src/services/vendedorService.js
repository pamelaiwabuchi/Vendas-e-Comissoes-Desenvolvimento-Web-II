const { conexao } = require("../config/db");
const AppError = require("../utils/AppError");

function validarDadosVendedor({ meta_mensal, percentual_base }) {
  if (meta_mensal === undefined || isNaN(meta_mensal) || Number(meta_mensal) < 0) {
    throw new AppError("meta_mensal deve ser um número maior ou igual a zero.");
  }
  if (
    percentual_base === undefined ||
    isNaN(percentual_base) ||
    Number(percentual_base) < 0 ||
    Number(percentual_base) > 100
  ) {
    throw new AppError("percentual_base deve ser um número entre 0 e 100.");
  }
}

async function cadastrarVendedor({ nome, meta_mensal, percentual_base }) {
  try {
    if (!nome || typeof nome !== "string" || !nome.trim()) {
      throw new AppError("O nome do vendedor é obrigatório.");
    }
    validarDadosVendedor({ meta_mensal, percentual_base });

    const [resultado] = await conexao.execute(
      "INSERT INTO vendedores (nome, meta_mensal, percentual_base, ativo) VALUES (?, ?, ?, ?)",
      [nome.trim(), meta_mensal, percentual_base, true]
    );
    return await buscarVendedorPorId(resultado.insertId);
  } catch (erro) {
    console.error("Erro ao cadastrar vendedor:", erro.message);
    throw erro;
  }
}

async function listarVendedores() {
  try {
    const [resultados] = await conexao.execute(
      "SELECT * FROM vendedores ORDER BY id_vendedor"
    );
    return resultados;
  } catch (erro) {
    console.error("Erro ao consultar vendedores:", erro.message);
    throw erro;
  }
}

async function buscarVendedorPorId(id) {
  try {
    const [resultados] = await conexao.execute(
      "SELECT * FROM vendedores WHERE id_vendedor = ?",
      [id]
    );
    if (resultados.length === 0) {
      throw new AppError("Vendedor não encontrado.", 404);
    }
    return resultados[0];
  } catch (erro) {
    console.error("Erro ao consultar vendedor:", erro.message);
    throw erro;
  }
}

async function atualizarVendedor(id, { meta_mensal, percentual_base }) {
  try {
    validarDadosVendedor({ meta_mensal, percentual_base });
    await buscarVendedorPorId(id); // 404 se não existir

    await conexao.execute(
      "UPDATE vendedores SET meta_mensal = ?, percentual_base = ? WHERE id_vendedor = ?",
      [meta_mensal, percentual_base, id]
    );
    return await buscarVendedorPorId(id);
  } catch (erro) {
    console.error("Erro ao atualizar vendedor:", erro.message);
    throw erro;
  }
}

// Não apaga o registro: só marca como inativo, preservando o histórico de vendas.
async function desativarVendedor(id) {
  try {
    const vendedor = await buscarVendedorPorId(id);
    if (!vendedor.ativo) {
      throw new AppError("Vendedor já está inativo.");
    }

    await conexao.execute(
      "UPDATE vendedores SET ativo = ? WHERE id_vendedor = ?",
      [false, id]
    );
    return await buscarVendedorPorId(id);
  } catch (erro) {
    console.error("Erro ao desativar vendedor:", erro.message);
    throw erro;
  }
}

module.exports = {
  cadastrarVendedor,
  listarVendedores,
  buscarVendedorPorId,
  atualizarVendedor,
  desativarVendedor,
};
