-- ============================================================================
-- POLÍTICA RLS PARA ai_behavior_rules
-- ============================================================================
-- 
-- Este script cria uma política que permite ao backend (usando chave anon)
-- ler as regras de comportamento de qualquer usuário.
-- 
-- IMPORTANTE: Execute este SQL no Supabase SQL Editor
-- ============================================================================

-- 1. Remover política antiga de SELECT se existir
DROP POLICY IF EXISTS "Users can read their own behavior rules" ON ai_behavior_rules;
DROP POLICY IF EXISTS "Enable read access for all users" ON ai_behavior_rules;
DROP POLICY IF EXISTS "Allow backend to read all rules" ON ai_behavior_rules;

-- 2. Criar nova política que permite leitura para todos
CREATE POLICY "Allow backend to read all rules"
ON ai_behavior_rules
FOR SELECT
USING (true);

-- 3. Manter política de INSERT/UPDATE apenas para o próprio usuário
DROP POLICY IF EXISTS "Users can insert their own behavior rules" ON ai_behavior_rules;
CREATE POLICY "Users can insert their own behavior rules"
ON ai_behavior_rules
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own behavior rules" ON ai_behavior_rules;
CREATE POLICY "Users can update their own behavior rules"
ON ai_behavior_rules
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================
-- Após executar, verifique as políticas com:
-- SELECT * FROM pg_policies WHERE tablename = 'ai_behavior_rules';
-- ============================================================================
