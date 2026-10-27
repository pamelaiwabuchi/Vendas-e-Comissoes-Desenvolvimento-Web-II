// Única função com a regra de comissão (evita duplicar a lógica).

const BONUS_TIPO_CLIENTE = { PF: 2, PJ: 3 };

// Comissão total = valor_venda × (percentual_base + percentual_cliente + percentual_regiao) / 100
async function calcularComissao(valorVenda, percentualBase, tipoCliente, percentualRegiao) {
  try {
    const percentualCliente = BONUS_TIPO_CLIENTE[tipoCliente];
    if (percentualCliente === undefined) {
      throw new Error("Tipo de cliente inválido. Use 'PF' ou 'PJ'.");
    }

    const percentualTotal = percentualBase + percentualCliente + percentualRegiao;
    return Math.round(valorVenda * percentualTotal) / 100;
  } catch (erro) {
    console.error("Erro ao calcular comissão:", erro.message);
    throw erro;
  }
}

module.exports = { calcularComissao };
