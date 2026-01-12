-- Adicionar campos para entrega digital automática via WhatsApp
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS delivery_type TEXT DEFAULT 'none' CHECK (delivery_type IN ('none', 'text', 'link', 'file')),
ADD COLUMN IF NOT EXISTS delivery_content TEXT,
ADD COLUMN IF NOT EXISTS delivery_file_url TEXT;

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.products.delivery_type IS 'Tipo de entrega digital: none (sem entrega), text (mensagem), link (URL), file (arquivo)';
COMMENT ON COLUMN public.products.delivery_content IS 'Conteúdo da entrega: mensagem de texto ou URL do link';
COMMENT ON COLUMN public.products.delivery_file_url IS 'URL do arquivo para entrega (PDF, ZIP, etc)';