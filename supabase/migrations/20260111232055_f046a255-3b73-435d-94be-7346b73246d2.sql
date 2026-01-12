-- =====================================================
-- SISTEMA ISA MARKETPLACE - TABELAS COMPLETAS
-- =====================================================

-- 1. SALDO DO VENDEDOR (seller_balances)
CREATE TABLE IF NOT EXISTS public.seller_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  available_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  pending_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_earned DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_withdrawn DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. VENDAS (sales)
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  platform_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  seller_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT DEFAULT 'pix',
  payment_id TEXT,
  payment_status TEXT DEFAULT 'pending',
  mp_payment_id TEXT,
  mp_preference_id TEXT,
  pix_qr_code TEXT,
  pix_qr_code_base64 TEXT,
  pix_copy_paste TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. SOLICITAÇÕES DE SAQUE (withdrawal_requests)
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  pix_key TEXT NOT NULL,
  pix_key_type TEXT NOT NULL DEFAULT 'cpf',
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID,
  receipt_url TEXT,
  mp_transfer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. CONFIGURAÇÕES DA PLATAFORMA (platform_settings)
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. AVALIAÇÕES DE PRODUTOS (product_reviews)
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_verified_purchase BOOLEAN DEFAULT false,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. LOGS DE PAGAMENTO (payment_logs) - Antifraude
CREATE TABLE IF NOT EXISTS public.payment_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id TEXT NOT NULL,
  mp_payment_id TEXT,
  event_type TEXT NOT NULL,
  payload JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. LOGS DE ANTIFRAUDE (antifraud_logs)
CREATE TABLE IF NOT EXISTS public.antifraud_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  seller_id UUID,
  customer_phone TEXT,
  ip_address TEXT,
  details JSONB,
  is_blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. COMISSÕES (platform_commissions)
CREATE TABLE IF NOT EXISTS public.platform_commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
  withdrawal_id UUID REFERENCES public.withdrawal_requests(id) ON DELETE SET NULL,
  commission_type TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  percentage DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 9. DADOS PIX DO VENDEDOR (seller_pix_info)
CREATE TABLE IF NOT EXISTS public.seller_pix_info (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  pix_key TEXT NOT NULL,
  pix_key_type TEXT NOT NULL DEFAULT 'cpf',
  holder_name TEXT NOT NULL,
  holder_document TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_sales_seller_id ON public.sales(seller_id);
CREATE INDEX IF NOT EXISTS idx_sales_payment_id ON public.sales(payment_id);
CREATE INDEX IF NOT EXISTS idx_sales_mp_payment_id ON public.sales(mp_payment_id);
CREATE INDEX IF NOT EXISTS idx_sales_status ON public.sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON public.sales(payment_status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_seller_id ON public.withdrawal_requests(seller_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON public.withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_payment_id ON public.payment_logs(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_mp_payment_id ON public.payment_logs(mp_payment_id);
CREATE INDEX IF NOT EXISTS idx_antifraud_logs_seller_id ON public.antifraud_logs(seller_id);
CREATE INDEX IF NOT EXISTS idx_antifraud_logs_ip_address ON public.antifraud_logs(ip_address);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- seller_balances
ALTER TABLE public.seller_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own balance"
  ON public.seller_balances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all balances"
  ON public.seller_balances FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "System can manage balances"
  ON public.seller_balances FOR ALL
  USING (public.is_admin(auth.uid()));

-- sales
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sales"
  ON public.sales FOR SELECT
  USING (auth.uid() = seller_id);

CREATE POLICY "Admins can view all sales"
  ON public.sales FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage all sales"
  ON public.sales FOR ALL
  USING (public.is_admin(auth.uid()));

-- withdrawal_requests
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own withdrawals"
  ON public.withdrawal_requests FOR SELECT
  USING (auth.uid() = seller_id);

CREATE POLICY "Users can create withdrawal requests"
  ON public.withdrawal_requests FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Admins can manage all withdrawals"
  ON public.withdrawal_requests FOR ALL
  USING (public.is_admin(auth.uid()));

-- platform_settings
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read platform settings"
  ON public.platform_settings FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify settings"
  ON public.platform_settings FOR ALL
  USING (public.is_admin(auth.uid()));

-- product_reviews
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view visible reviews"
  ON public.product_reviews FOR SELECT
  USING (is_visible = true);

CREATE POLICY "Admins can manage reviews"
  ON public.product_reviews FOR ALL
  USING (public.is_admin(auth.uid()));

-- payment_logs
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view payment logs"
  ON public.payment_logs FOR SELECT
  USING (public.is_admin(auth.uid()));

-- antifraud_logs
ALTER TABLE public.antifraud_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view antifraud logs"
  ON public.antifraud_logs FOR SELECT
  USING (public.is_admin(auth.uid()));

-- platform_commissions
ALTER TABLE public.platform_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view commissions"
  ON public.platform_commissions FOR SELECT
  USING (public.is_admin(auth.uid()));

-- seller_pix_info
ALTER TABLE public.seller_pix_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pix info"
  ON public.seller_pix_info FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own pix info"
  ON public.seller_pix_info FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all pix info"
  ON public.seller_pix_info FOR SELECT
  USING (public.is_admin(auth.uid()));

-- =====================================================
-- CONFIGURAÇÕES INICIAIS DA PLATAFORMA
-- =====================================================
INSERT INTO public.platform_settings (setting_key, setting_value, description)
VALUES 
  ('commission_rate', '{"percentage": 10, "type": "sale"}', 'Taxa de comissão por venda (%)'),
  ('min_withdrawal', '{"amount": 50.00}', 'Valor mínimo para saque (R$)'),
  ('mercado_pago', '{"public_key": "APP_USR-aa4e0a93-7800-412b-a8d3-2ed1ccd9d5bf", "client_id": "177791261319351"}', 'Configurações do Mercado Pago')
ON CONFLICT (setting_key) DO NOTHING;

-- =====================================================
-- TRIGGER PARA ATUALIZAR updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger nas tabelas
DROP TRIGGER IF EXISTS update_seller_balances_updated_at ON public.seller_balances;
CREATE TRIGGER update_seller_balances_updated_at
  BEFORE UPDATE ON public.seller_balances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_sales_updated_at ON public.sales;
CREATE TRIGGER update_sales_updated_at
  BEFORE UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_withdrawal_requests_updated_at ON public.withdrawal_requests;
CREATE TRIGGER update_withdrawal_requests_updated_at
  BEFORE UPDATE ON public.withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_seller_pix_info_updated_at ON public.seller_pix_info;
CREATE TRIGGER update_seller_pix_info_updated_at
  BEFORE UPDATE ON public.seller_pix_info
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();