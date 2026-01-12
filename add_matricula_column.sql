-- ============================================================================
-- ADICIONAR COLUNA MATRICULA NA TABELA ai_behavior_rules
-- ============================================================================
-- 
-- Este script adiciona a coluna 'matricula' na tabela ai_behavior_rules
-- para permitir vínculo direto por matrícula, sem depender de user_id
--
-- Execute este SQL no Supabase SQL Editor
-- ============================================================================

-- 1. Adicionar coluna matricula (permitindo NULL inicialmente)
ALTER TABLE ai_behavior_rules 
ADD COLUMN IF NOT EXISTS matricula TEXT NULL;

-- 2. Criar índice para melhorar performance de busca
CREATE INDEX IF NOT EXISTS idx_ai_behavior_rules_matricula 
ON ai_behavior_rules(matricula);

-- 3. Adicionar comentário na coluna
COMMENT ON COLUMN ai_behavior_rules.matricula IS 'Matrícula do cliente vinculada às regras de comportamento';

-- ============================================================================
-- ATUALIZAR REGISTROS EXISTENTES (OPCIONAL)
-- ============================================================================
-- Se você quiser vincular os registros existentes às matrículas:

-- Para o registro com user_id 82a578cd-86ee-49ca-8b48-b45db1aa345d
-- Descomente e escolha a matrícula:
-- UPDATE ai_behavior_rules 
-- SET matricula = '758322'
-- WHERE user_id = '82a578cd-86ee-49ca-8b48-b45db1aa345d';

-- Para o registro com user_id 810f7a82-1bd7-4999-86a1-ddb4194b7254
-- Descomente e escolha a matrícula:
-- UPDATE ai_behavior_rules 
-- SET matricula = '390151'
-- WHERE user_id = '810f7a82-1bd7-4999-86a1-ddb4194b7254';

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================
-- Após executar, verifique com:
-- SELECT id, user_id, matricula, 
--        LEFT(rules, 50) as rules_preview,
--        created_at 
-- FROM ai_behavior_rules;
-- ============================================================================

-- ============================================================================
-- POLÍTICA RLS PARA MATRICULA (OPCIONAL)
-- ============================================================================
-- Se quiser permitir busca por matrícula via backend:
-- DROP POLICY IF EXISTS "Allow backend to read rules by matricula" ON ai_behavior_rules;
-- CREATE POLICY "Allow backend to read rules by matricula"
-- ON ai_behavior_rules
-- FOR SELECT
-- USING (matricula IS NOT NULL);
-- ============================================================================
