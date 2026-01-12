-- ============================================================================
-- ATUALIZAR VÍNCULO DE USER_ID NA TABELA CLIENTS
-- ============================================================================
-- 
-- Este script atualiza o user_id de um cliente para vincular ao usuário
-- que tem as regras de comportamento do INOVAFOOD salvas.
--
-- INSTRUÇÕES:
-- 1. Escolha qual telefone/CPF você quer usar para o bot
-- 2. Escolha qual user_id usar (um dos que tem regras salvas):
--    - 82a578cd-86ee-49ca-8b48-b45db1aa345d (criado hoje)
--    - 810f7a82-1bd7-4999-86a1-ddb4194b7254 (criado ontem)
-- 3. Execute o UPDATE apropriado abaixo
-- ============================================================================

-- OPÇÃO 1: Atualizar pelo telefone 11978197645 (matrícula 758322)
-- Descomente a linha abaixo e escolha o user_id:
-- UPDATE clients 
-- SET user_id = '82a578cd-86ee-49ca-8b48-b45db1aa345d'
-- WHERE phone = '11978197645';

-- OPÇÃO 2: Atualizar pelo telefone 11937728973 (MAICON - matrícula 390151)
-- Descomente a linha abaixo e escolha o user_id:
-- UPDATE clients 
-- SET user_id = '82a578cd-86ee-49ca-8b48-b45db1aa345d'
-- WHERE phone = '11937728973';

-- OPÇÃO 3: Atualizar pela matrícula
-- Descomente a linha abaixo e escolha o user_id:
-- UPDATE clients 
-- SET user_id = '82a578cd-86ee-49ca-8b48-b45db1aa345d'
-- WHERE matricula = '758322';

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================
-- Após executar, verifique com:
-- SELECT id, user_id, phone, matricula, full_name FROM clients;
-- ============================================================================

-- ============================================================================
-- RECOMENDAÇÃO
-- ============================================================================
-- Use o user_id mais recente: 82a578cd-86ee-49ca-8b48-b45db1aa345d
-- Esse foi criado hoje (02/01/2026) e tem as regras do INOVAFOOD
-- ============================================================================
