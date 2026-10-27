const { conexao } = require("../config/db");
const AppError = require("../utils/AppError");
const { calcularComissao } = require("./comissaoService");

// SELECT base com JOIN para trazer nome do vendedor e da região
const SELECT_VENDAS = `
  SELECT v.id_venda, v.data_venda, v.valor_venda, v.tipo_cliente, v.valor_comissao,
         v.id_vendedor, vd.nome AS nome_vendedor,
         v.id_regiao, r.nome_regiao
  FROM vendas v
  INNER JOIN vendedores vd ON vd.id_vendedor = v.id_vendedor
  INNER JOIN regioes r     ON r.id_regiao    = v.id_regiao`;

async function registrarVenda({ id_venda, id_vendedor, id_regiao, data_venda, valor_venda, tipo_cliente }) {
  try {
    // 1. Validações dos dados recebidos
    if (!id_vendedor || !id_regiao) {
      throw new AppError("id_vendedor e id_regiao são obrigatórios.");
    }
    if (valor_venda === undefined || isNaN(valor_venda) || Number(valor_venda) <= 0) {
      throw new AppError("valor_venda deve ser um número positivo.");
    }
    if (!["PF", "PJ"].includes(tipo_cliente)) {
      throw new AppError("tipo_cliente deve ser 'PF' ou 'PJ'.");
    }

    // 2. Código de venda único
    if (id_venda !== undefined) {
      const [existente] = await conexao.execute(
        "SELECT id_venda FROM vendas WHERE id_venda = ?",
        [id_venda]
      );
      if (existente.length > 0) {
        throw new AppError(`Já existe uma venda com o código ${id_venda}.`, 409);
      }
    }

    // 3. Vendedor existe e está ativo
    const [vendedores] = await conexao.execute(
      "SELECT percentual_base, ativo FROM vendedores WHERE id_vendedor = ?",
      [id_vendedor]
    );
    if (vendedores.length === 0) {
      throw new AppError("Vendedor não encontrado.", 404);
    }
    if (!vendedores[0].ativo) {
      throw new AppError("Vendedor inativo não pode registrar vendas.");
    }

    // 4. Região existe
    const [regioes] = await conexao.execute(
      "SELECT percentual_bonus FROM regioes WHERE id_regiao = ?",
      [id_regiao]
    );
    if (regioes.length === 0) {
      throw new AppError("Região não encontrada.", 404);
    }

    // 5. Calcula a comissão
    const valorComissao = await calcularComissao(
      Number(valor_venda),
      vendedores[0].percentual_base,
      tipo_cliente,
      regioes[0].percentual_bonus
    );

    // 6. Insere a venda
    const [resultado] = await conexao.execute(
      `INSERT INTO vendas (id_venda, id_vendedor, id_regiao, data_venda, valor_venda, tipo_cliente, valor_comissao)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id_venda ?? null, // null = AUTO_INCREMENT gera o código
        id_vendedor,
        id_regiao,
        data_venda ?? new Date(),
        valor_venda,
        tipo_cliente,
        valorComissao,
      ]
    );

    return await buscarVendaPorId(resultado.insertId);
  } catch (erro) {
    console.error("Erro ao registrar venda:", erro.message);
    throw erro;
  }
}

async function listarVendas() {
  try {
    const [resultados] = await conexao.execute(`${SELECT_VENDAS} ORDER BY v.data_venda`);
    return resultados;
  } catch (erro) {
    console.error("Erro ao consultar vendas:", erro.message);
    throw erro;
  }
}

async function buscarVendaPorId(id) {
  try {
    const [resultados] = await conexao.execute(`${SELECT_VENDAS} WHERE v.id_venda = ?`, [id]);
    if (resultados.length === 0) {
      throw new AppError("Venda não encontrada.", 404);
    }
    return resultados[0];
  } catch (erro) {
    console.error("Erro ao consultar venda:", erro.message);
    throw erro;
  }
}

async function consultarVendasPorVendedor(idVendedor) {
  try {
    const [vendedor] = await conexao.execute(
      "SELECT id_vendedor FROM vendedores WHERE id_vendedor = ?",
      [idVendedor]
    );
    if (vendedor.length === 0) {
      throw new AppError("Vendedor não encontrado.", 404);
    }

    const [resultados] = await conexao.execute(
      `${SELECT_VENDAS} WHERE v.id_vendedor = ? ORDER BY v.data_venda`,
      [idVendedor]
    );
    return resultados;
  } catch (erro) {
    console.error("Erro ao consultar vendas por vendedor:", erro.message);
    throw erro;
  }
}

async function consultarVendasPorRegiao(idRegiao) {
  try {
    const [regiao] = await conexao.execute(
      "SELECT id_regiao FROM regioes WHERE id_regiao = ?",
      [idRegiao]
    );
    if (regiao.length === 0) {
      throw new AppError("Região não encontrada.", 404);
    }

    const [resultados] = await conexao.execute(
      `${SELECT_VENDAS} WHERE v.id_regiao = ? ORDER BY v.data_venda`,
      [idRegiao]
    );
    return resultados;
  } catch (erro) {
    console.error("Erro ao consultar vendas por região:", erro.message);
    throw erro;
  }
}

async function excluirVenda(id) {
  try {
    const venda = await buscarVendaPorId(id); // 404 se não existir
    await conexao.execute("DELETE FROM vendas WHERE id_venda = ?", [id]);
    return venda;
  } catch (erro) {
    console.error("Erro ao excluir venda:", erro.message);
    throw erro;
  }
}

module.exports = {
  registrarVenda,
  listarVendas,
  buscarVendaPorId,
  consultarVendasPorVendedor,
  consultarVendasPorRegiao,
  excluirVenda,
};
