-- Atualizar os produtos existentes do user_id 810f7a82-1bd7-4999-86a1-ddb4194b7254 com matricula 666058
UPDATE public.products 
SET matricula = '666058'
WHERE user_id = '810f7a82-1bd7-4999-86a1-ddb4194b7254' 
  AND (matricula IS NULL OR matricula = '');