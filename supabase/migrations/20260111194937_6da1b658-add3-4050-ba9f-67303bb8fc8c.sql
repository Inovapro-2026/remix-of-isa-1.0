-- Atualizar o profile para ter a matricula 666058
UPDATE public.profiles 
SET matricula = '666058'
WHERE id = '810f7a82-1bd7-4999-86a1-ddb4194b7254';

-- Atualizar todos os produtos deste user_id para ter a matricula 666058
UPDATE public.products 
SET matricula = '666058'
WHERE user_id = '810f7a82-1bd7-4999-86a1-ddb4194b7254';

-- Vincular o cliente à conta auth
UPDATE public.clients
SET user_id = '810f7a82-1bd7-4999-86a1-ddb4194b7254'
WHERE matricula = '666058';