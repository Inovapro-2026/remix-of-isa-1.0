-- ============================================================================
-- ADICIONAR COLUNA MATRICULA - VERSÃO SIMPLIFICADA
-- ============================================================================

-- Adicionar coluna matricula
ALTER TABLE ai_behavior_rules 
ADD COLUMN matricula TEXT;

-- Criar índice
CREATE INDEX idx_ai_behavior_rules_matricula 
ON ai_behavior_rules(matricula);

-- Verificar se foi adicionada
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'ai_behavior_rules'
ORDER BY ordinal_position;
