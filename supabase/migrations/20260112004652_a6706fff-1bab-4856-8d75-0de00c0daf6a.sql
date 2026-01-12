-- Adicionar campos para rastrear entrega digital
ALTER TABLE public.sales
ADD COLUMN IF NOT EXISTS delivery_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'failed', 'not_required'));

COMMENT ON COLUMN public.sales.delivery_sent_at IS 'Timestamp de quando a entrega digital foi enviada';
COMMENT ON COLUMN public.sales.delivery_status IS 'Status da entrega digital: pending, sent, failed, not_required';