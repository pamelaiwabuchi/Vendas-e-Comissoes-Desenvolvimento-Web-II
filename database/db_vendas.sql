-- =====================================================
-- Sistema de Vendas com Comissões, Metas e Performance
-- Criação do banco, tabelas, relacionamentos e dados de teste
-- =====================================================

DROP DATABASE IF EXISTS db_vendas;
CREATE DATABASE db_vendas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE db_vendas;

-- -----------------------------------------------------
-- Tabela: vendedores
-- -----------------------------------------------------
CREATE TABLE vendedores (
    id_vendedor     INT AUTO_INCREMENT PRIMARY KEY,
    nome            VARCHAR(100)  NOT NULL,
    meta_mensal     DECIMAL(12,2) NOT NULL,
    percentual_base DECIMAL(5,2)  NOT NULL,
    ativo           BOOLEAN       NOT NULL DEFAULT TRUE,
    CONSTRAINT chk_meta_positiva CHECK (meta_mensal >= 0),
    CONSTRAINT chk_percentual_base CHECK (percentual_base >= 0 AND percentual_base <= 100)
);

-- -----------------------------------------------------
-- Tabela: regioes
-- -----------------------------------------------------
CREATE TABLE regioes (
    id_regiao        INT AUTO_INCREMENT PRIMARY KEY,
    nome_regiao      VARCHAR(50)  NOT NULL UNIQUE,
    percentual_bonus DECIMAL(5,2) NOT NULL DEFAULT 0,
    CONSTRAINT chk_nome_regiao CHECK (nome_regiao IN ('Norte', 'Nordeste', 'Sudeste', 'Sul')),
    CONSTRAINT chk_percentual_bonus CHECK (percentual_bonus >= 0)
);

-- -----------------------------------------------------
-- Tabela: vendas
-- ON DELETE RESTRICT: não é possível apagar um vendedor/região
-- que tenha vendas (o histórico é preservado; vendedores são desativados).
-- -----------------------------------------------------
CREATE TABLE vendas (
    id_venda       INT AUTO_INCREMENT PRIMARY KEY,
    id_vendedor    INT           NOT NULL,
    id_regiao      INT           NOT NULL,
    data_venda     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valor_venda    DECIMAL(12,2) NOT NULL,
    tipo_cliente   ENUM('PF','PJ') NOT NULL,
    valor_comissao DECIMAL(12,2) NOT NULL,
    CONSTRAINT fk_vendas_vendedor FOREIGN KEY (id_vendedor)
        REFERENCES vendedores (id_vendedor) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_vendas_regiao FOREIGN KEY (id_regiao)
        REFERENCES regioes (id_regiao) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_valor_venda CHECK (valor_venda > 0)
);

-- -----------------------------------------------------
-- Dados de teste
-- -----------------------------------------------------
INSERT INTO regioes (id_regiao, nome_regiao, percentual_bonus) VALUES
    (1, 'Norte',    1.00),
    (2, 'Nordeste', 1.00),
    (3, 'Sudeste',  0.00),
    (4, 'Sul',      0.50);

INSERT INTO vendedores (id_vendedor, nome, meta_mensal, percentual_base, ativo) VALUES
    (1, 'Ana Souza',     10000.00, 5.00, TRUE),
    (2, 'Bruno Lima',     8000.00, 4.00, TRUE),
    (3, 'Carla Mendes',  12000.00, 5.50, TRUE),
    (4, 'Diego Rocha',    6000.00, 3.00, TRUE),
    (5, 'Elisa Martins',  9000.00, 4.50, TRUE),
    (6, 'Fábio Costa',    5000.00, 3.00, FALSE); -- inativo, para testes

-- valor_comissao é preenchido logo abaixo com o UPDATE (mesma regra da API)
INSERT INTO vendas (id_venda, id_vendedor, id_regiao, data_venda, valor_venda, tipo_cliente, valor_comissao) VALUES
    ( 1, 1, 1, '2026-10-01 09:15:00', 2000.00, 'PJ', 0), -- exemplo do enunciado: R$ 180,00
    ( 2, 1, 3, '2026-10-05 14:30:00', 4500.00, 'PF', 0),
    ( 3, 1, 4, '2026-10-12 10:00:00', 5000.00, 'PJ', 0),
    ( 4, 2, 2, '2026-10-02 11:20:00', 3000.00, 'PF', 0),
    ( 5, 2, 4, '2026-10-08 16:45:00', 2500.00, 'PJ', 0),
    ( 6, 2, 1, '2026-10-20 09:00:00', 1500.00, 'PF', 0),
    ( 7, 3, 3, '2026-10-03 13:10:00', 6000.00, 'PJ', 0),
    ( 8, 3, 2, '2026-10-09 15:00:00', 4000.00, 'PF', 0),
    ( 9, 3, 1, '2026-10-18 10:30:00', 3500.00, 'PJ', 0),
    (10, 4, 4, '2026-10-04 08:50:00', 1200.00, 'PF', 0),
    (11, 4, 3, '2026-10-14 17:20:00', 2800.00, 'PJ', 0),
    (12, 4, 2, '2026-10-22 12:00:00',  900.00, 'PF', 0),
    (13, 5, 2, '2026-10-06 10:40:00', 5500.00, 'PJ', 0),
    (14, 5, 4, '2026-10-15 14:15:00', 2000.00, 'PF', 0),
    (15, 5, 1, '2026-10-25 11:05:00', 1800.00, 'PJ', 0),
    (16, 6, 3, '2026-09-28 16:00:00', 1000.00, 'PF', 0); -- histórico do vendedor inativo

-- Comissão = valor_venda × (percentual_base + bônus_cliente + bônus_região) / 100
-- Bônus do cliente: PF = 2%, PJ = 3%
UPDATE vendas v
    INNER JOIN vendedores vd ON vd.id_vendedor = v.id_vendedor
    INNER JOIN regioes r     ON r.id_regiao    = v.id_regiao
SET v.valor_comissao = ROUND(
    v.valor_venda * (vd.percentual_base
                     + CASE v.tipo_cliente WHEN 'PJ' THEN 3 ELSE 2 END
                     + r.percentual_bonus) / 100, 2);
