-- Create table for plan renewal requests
CREATE TABLE public.plan_renewals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID REFERENCES public.clients(id),
  matricula TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  receipt_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  amount NUMERIC NOT NULL DEFAULT 49.90,
  rejection_reason TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.plan_renewals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own renewals"
ON public.plan_renewals
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own renewals"
ON public.plan_renewals
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all renewals"
ON public.plan_renewals
FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update renewals"
ON public.plan_renewals
FOR UPDATE
USING (is_admin(auth.uid()));

-- Create storage bucket for receipts
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', true);

-- Storage policies
CREATE POLICY "Anyone can view receipts"
ON storage.objects
FOR SELECT
USING (bucket_id = 'receipts');

CREATE POLICY "Authenticated users can upload receipts"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'receipts' AND auth.role() = 'authenticated');

-- Create trigger for updated_at
CREATE TRIGGER update_plan_renewals_updated_at
BEFORE UPDATE ON public.plan_renewals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();