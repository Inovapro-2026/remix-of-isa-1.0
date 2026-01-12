-- =====================================================
-- MIGRAÇÃO: Adicionar coluna matricula em products
-- =====================================================
-- Este script adiciona a coluna matricula, cria função
-- e trigger para preenchimento automático
-- =====================================================

-- 1. Adicionar coluna matricula
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS matricula TEXT;

-- 2. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_products_matricula 
ON public.products USING btree (matricula);

-- 3. Criar função para preencher matrícula automaticamente
CREATE OR REPLACE FUNCTION fill_product_matricula()
RETURNS TRIGGER AS $$
BEGIN
    -- Buscar matrícula do cliente pelo user_id
    SELECT c.matricula INTO NEW.matricula
    FROM clients c
    WHERE c.user_id = NEW.user_id
    LIMIT 1;
    
    -- Se não encontrar matrícula, manter NULL
    -- (isso permite que produtos sem user_id válido sejam criados)
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Criar trigger para executar antes de INSERT ou UPDATE
DROP TRIGGER IF EXISTS trigger_fill_product_matricula ON products;

CREATE TRIGGER trigger_fill_product_matricula
BEFORE INSERT OR UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION fill_product_matricula();

-- 5. Preencher matrículas para produtos existentes
UPDATE products p
SET matricula = c.matricula
FROM clients c
WHERE p.user_id = c.user_id
AND p.matricula IS NULL;

-- 6. Verificação: Mostrar produtos com matrícula
SELECT 
    p.id,
    p.name,
    p.matricula,
    p.user_id,
    c.cpf
FROM products p
LEFT JOIN clients c ON p.user_id = c.user_id
WHERE p.is_active = true
LIMIT 10;

-- 7. Verificação: Contar produtos sem matrícula
SELECT 
    COUNT(*) as produtos_sem_matricula
FROM products
WHERE matricula IS NULL AND is_active = true;
