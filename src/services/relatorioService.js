const { conexao } = require("../config/db");
const AppError = require("../utils/AppError");

const FORMATO_DATA = /^\d{4}-\d{2}-\d{2}$/;

// Filtro de período: inclui o dia final inteiro (até 23:59:59)
const FILTRO_PERIODO = "v.data_venda >= ? AND v.data_venda < DATE_ADD(?, INTERVAL 1 DAY)";

async function gerarRelatorioPerformance(inicio, fim) {
  try {
    if (!FORMATO_DATA.test(inicio || "") || !FORMATO_DATA.test(fim || "")) {
      throw new AppError("Informe inicio e fim no formato AAAA-MM-DD.");
    }
    if (inicio > fim) {
      throw new AppError("A data inicial deve ser anterior ou igual à data final.");
    }
    const periodo = [inicio, fim];

    // 1. Total de vendas + comissão média geral (COUNT, SUM, AVG)
    const [[totais]] = await conexao.execute(
      `SELECT COUNT(*) AS total_vendas,
              COALESCE(SUM(v.valor_venda), 0) AS valor_total_vendido,
              COALESCE(SUM(v.valor_comissao), 0) AS total_comissoes,
              COALESCE(ROUND(AVG(v.valor_comissao), 2), 0) AS comissao_media_geral
       FROM vendas v
       WHERE ${FILTRO_PERIODO}`,
      periodo
    );

    // 2. Vendas por região + comissão média por região (JOIN, GROUP BY, SUM, AVG, COUNT)
    const [porRegiao] = await conexao.execute(
      `SELECT r.id_regiao, r.nome_regiao,
              COUNT(v.id_venda) AS quantidade_vendas,
              COALESCE(SUM(v.valor_venda), 0) AS total_vendido,
              COALESCE(ROUND(AVG(v.valor_comissao), 2), 0) AS comissao_media
       FROM regioes r
       LEFT JOIN vendas v ON v.id_regiao = r.id_regiao AND ${FILTRO_PERIODO}
       GROUP BY r.id_regiao, r.nome_regiao
       ORDER BY r.id_regiao`,
      periodo
    );

    // 3. Vendas por tipo de cliente (GROUP BY, SUM, COUNT)
    const [porTipoCliente] = await conexao.execute(
      `SELECT v.tipo_cliente,
              COUNT(*) AS quantidade_vendas,
              SUM(v.valor_venda) AS total_vendido
       FROM vendas v
       WHERE ${FILTRO_PERIODO}
       GROUP BY v.tipo_cliente
       ORDER BY v.tipo_cliente`,
      periodo
    );

    // 4. Totais por vendedor (JOIN, GROUP BY, SUM) -> melhor vendedor e maior comissão
    const [porVendedor] = await conexao.execute(
      `SELECT vd.id_vendedor, vd.nome,
              COUNT(v.id_venda) AS quantidade_vendas,
              SUM(v.valor_venda) AS total_vendido,
              SUM(v.valor_comissao) AS total_comissao
       FROM vendas v
       INNER JOIN vendedores vd ON vd.id_vendedor = v.id_vendedor
       WHERE ${FILTRO_PERIODO}
       GROUP BY vd.id_vendedor, vd.nome`,
      periodo
    );
    const melhorVendedor =
      [...porVendedor].sort((a, b) => b.total_vendido - a.total_vendido)[0] || null;
    const maiorComissao =
      [...porVendedor].sort((a, b) => b.total_comissao - a.total_comissao)[0] || null;

    // 5. Metas: soma das vendas de cada vendedor em cada mês de referência,
    //    comparada com a meta mensal (JOIN, GROUP BY, SUM)
    const [metas] = await conexao.execute(
      `SELECT DATE_FORMAT(v.data_venda, '%Y-%m') AS mes_referencia,
              vd.id_vendedor, vd.nome, vd.meta_mensal,
              SUM(v.valor_venda) AS total_vendido_mes,
              SUM(v.valor_venda) >= vd.meta_mensal AS meta_atingida
       FROM vendas v
       INNER JOIN vendedores vd ON vd.id_vendedor = v.id_vendedor
       WHERE ${FILTRO_PERIODO}
       GROUP BY mes_referencia, vd.id_vendedor, vd.nome, vd.meta_mensal
       ORDER BY mes_referencia, vd.id_vendedor`,
      periodo
    );
    const detalheMetas = metas.map((m) => ({ ...m, meta_atingida: Boolean(m.meta_atingida) }));

    return {
      periodo: { inicio, fim },
      total_vendas: totais.total_vendas,
      valor_total_vendido: totais.valor_total_vendido,
      total_comissoes: totais.total_comissoes,
      vendas_por_regiao: porRegiao.map(({ id_regiao, nome_regiao, quantidade_vendas, total_vendido }) => ({
        id_regiao, nome_regiao, quantidade_vendas, total_vendido,
      })),
      vendas_por_tipo_cliente: porTipoCliente,
      melhor_vendedor: melhorVendedor,
      maior_comissao: maiorComissao,
      metas_atingidas: {
        quantidade: detalheMetas.filter((m) => m.meta_atingida).length,
        detalhes: detalheMetas,
      },
      comissao_media_geral: totais.comissao_media_geral,
      comissao_media_por_regiao: porRegiao.map(({ id_regiao, nome_regiao, comissao_media }) => ({
        id_regiao, nome_regiao, comissao_media,
      })),
    };
  } catch (erro) {
    console.error("Erro ao gerar relatório de performance:", erro.message);
    throw erro;
  }
}

module.exports = { gerarRelatorioPerformance };
