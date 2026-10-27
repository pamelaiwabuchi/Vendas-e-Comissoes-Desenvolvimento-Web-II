# Sistema de Vendas com Comissões, Metas e Performance

API REST em **Node.js + Express + MySQL** para gerenciar vendedores, vendas, comissões e metas de uma rede de lojas com unidades nas regiões Norte, Nordeste, Sudeste e Sul.

## Tecnologias

- Node.js (v18 ou superior)
- Express 5
- MySQL 8 / MariaDB, acessado com `mysql2/promise`
- dotenv (credenciais em variáveis de ambiente)

## Estrutura do projeto

```
database/
  db_vendas.sql            # cria o banco, as tabelas, os relacionamentos e os dados de teste
src/
  config/db.js             # pool de conexões (mysql2/promise)
  services/
    comissaoService.js     # calcularComissao(): regra única de comissão
    vendedorService.js     # cadastrar, listar, atualizar e desativar vendedores
    vendaService.js        # registrar, listar, consultar e excluir vendas
    relatorioService.js    # gerarRelatorioPerformance()
  routes/                  # endpoints da API REST
  utils/AppError.js        # erro com código HTTP (400, 404, 409)
  server.js                # inicia o Express e trata os erros
requisicoes.http           # requisições prontas para testar
```

## Instalação

```bash
git clone <url-do-repositorio>
cd des-web-2-ativ3
npm install
```

## Configuração

1. Crie o banco executando o script SQL:

   ```bash
   mysql -u root -p < database/db_vendas.sql
   ```

   (Ou abra o arquivo no MySQL Workbench / DBeaver e execute.)

2. Copie o arquivo de exemplo e preencha com as suas credenciais:

   ```bash
   cp .env.example .env
   ```

   ```
   PORT=3000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=sua_senha
   DB_NAME=db_vendas
   ```

   O `.env` está no `.gitignore`, então a senha nunca vai para o GitHub.

## Execução

```bash
npm start      # inicia o servidor
npm run dev    # reinicia automaticamente ao salvar arquivos
```

A API sobe em `http://localhost:3000`.

## Modelo de dados

| Tabela | Campos principais | Restrições |
|---|---|---|
| `vendedores` | id_vendedor, nome, meta_mensal, percentual_base, ativo | PK, CHECK de valores não negativos |
| `regioes` | id_regiao, nome_regiao, percentual_bonus | PK, nome único e limitado às 4 regiões |
| `vendas` | id_venda, id_vendedor, id_regiao, data_venda, valor_venda, tipo_cliente, valor_comissao | PK, FKs para vendedores e regiões (`ON DELETE RESTRICT`), CHECK valor > 0 |

Vendedores não são excluídos, apenas desativados, preservando o histórico de vendas.

## Regras de comissão

```
comissão = valor_venda × (percentual_base + bônus_cliente + bônus_região) / 100
```

| Tipo de cliente | Bônus |
|---|---|
| PF | 2% |
| PJ | 3% |

| Região | Bônus |
|---|---|
| Norte | 1% |
| Nordeste | 1% |
| Sudeste | 0% |
| Sul | 0,5% |

Exemplo: R$ 2.000,00 para cliente PJ no Norte, com base de 5%, resulta em 9% e comissão de **R$ 180,00**.

Toda a regra está em `calcularComissao()`, em `src/services/comissaoService.js`.

## Endpoints

| Método | Endpoint | Operação | Códigos |
|---|---|---|---|
| POST | `/vendedores` | Cadastrar vendedor | 201, 400 |
| GET | `/vendedores` | Listar vendedores | 200 |
| GET | `/vendedores/:id` | Consultar vendedor | 200, 404 |
| PUT | `/vendedores/:id` | Atualizar meta e percentual base | 200, 400, 404 |
| PATCH | `/vendedores/:id/desativar` | Desativar vendedor | 200, 400, 404 |
| POST | `/vendas` | Registrar venda | 201, 400, 404, 409 |
| GET | `/vendas` | Listar vendas | 200 |
| GET | `/vendas/vendedor/:id` | Vendas por vendedor | 200, 404 |
| GET | `/vendas/regiao/:id` | Vendas por região | 200, 404 |
| DELETE | `/vendas/:id` | Excluir venda | 200, 404 |
| GET | `/relatorios/performance?inicio=AAAA-MM-DD&fim=AAAA-MM-DD` | Relatório gerencial | 200, 400 |

Falhas de conexão ou de consulta ao banco retornam **500** com JSON `{ "erro": ..., "detalhe": ... }`.

### Exemplos de corpo

`POST /vendedores`
```json
{ "nome": "Gabriela Alves", "meta_mensal": 7000, "percentual_base": 5 }
```

`PUT /vendedores/2`
```json
{ "meta_mensal": 7000, "percentual_base": 4 }
```

`POST /vendas` (`id_venda` e `data_venda` são opcionais)
```json
{ "id_venda": 100, "id_vendedor": 1, "id_regiao": 1, "valor_venda": 2000, "tipo_cliente": "PJ", "data_venda": "2026-10-26 10:00:00" }
```

Validações ao registrar uma venda: vendedor existente e ativo, região existente, valor positivo, tipo de cliente PF/PJ e código de venda único.

## Relatório de performance

`GET /relatorios/performance?inicio=2026-10-01&fim=2026-10-31`

| Indicador | Campo no JSON | SQL usado |
|---|---|---|
| Total de vendas | `total_vendas` | COUNT |
| Vendas por região | `vendas_por_regiao` | JOIN, GROUP BY, SUM, COUNT |
| Vendas por tipo de cliente | `vendas_por_tipo_cliente` | GROUP BY, SUM, COUNT |
| Melhor vendedor | `melhor_vendedor` | JOIN, GROUP BY, SUM |
| Maior comissão | `maior_comissao` | JOIN, GROUP BY, SUM |
| Metas atingidas | `metas_atingidas` | JOIN, GROUP BY, SUM (por mês de referência) |
| Comissão média geral | `comissao_media_geral` | AVG |
| Comissão média por região | `comissao_media_por_regiao` | JOIN, GROUP BY, AVG |

Para as metas, as vendas de cada vendedor são somadas por mês (`AAAA-MM`) dentro do período e comparadas com a `meta_mensal`.

## Dados de teste

O script SQL cadastra 4 regiões, 6 vendedores (um deles inativo) e 16 vendas, sendo 15 em outubro de 2026, distribuídas entre as quatro regiões e entre PF e PJ.

## Testes

O arquivo `requisicoes.http` tem todas as requisições dos testes obrigatórios (9 a 15). Ele pode ser aberto com a extensão REST Client do VS Code, ou as mesmas requisições podem ser montadas no Postman, Insomnia ou Thunder Client.

| Teste | Requisição | Resultado esperado |
|---|---|---|
| 9. Cadastro e comissão correta | `POST /vendedores` e `POST /vendas` | 201, comissão de R$ 180,00 |
| 10. Código duplicado | `POST /vendas` com `id_venda: 1` | 409 |
| 11. Vendedor inexistente/inativo | `POST /vendas` com vendedor 999 ou 6 | 404 / 400 |
| 12. Atualização de meta | `PUT /vendedores/2` | 200 |
| 13. Consultas | `GET /vendas/regiao/4` e `GET /vendas/vendedor/3` | 200 |
| 14. Relatório mensal | `GET /relatorios/performance?inicio=2026-10-01&fim=2026-10-31` | 200, metas atingidas |
| 15. Erro de banco | Parar o MySQL ou colocar a senha errada no `.env` e chamar qualquer rota | 500 com mensagem de erro |

### Capturas de tela

As capturas das requisições e respostas estão na pasta [`prints/`](prints/), uma por teste (01 a 17), com o método, a URL, o corpo enviado, o status HTTP e o JSON retornado.
