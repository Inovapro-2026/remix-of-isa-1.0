-- Create table to track vitrine visits
CREATE TABLE public.vitrine_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vitrine_id TEXT NOT NULL,
  seller_id UUID REFERENCES auth.users(id),
  visitor_ip TEXT,
  user_agent TEXT,
  referrer TEXT,
  visited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_id TEXT
);

-- Enable RLS
ALTER TABLE public.vitrine_visits ENABLE ROW LEVEL SECURITY;

-- Policy for inserting visits (anyone can insert - public vitrines)
CREATE POLICY "Anyone can log vitrine visits" 
ON public.vitrine_visits 
FOR INSERT 
WITH CHECK (true);

-- Policy for reading visits (only admins and the vitrine owner)
CREATE POLICY "Admins and owners can view vitrine visits" 
ON public.vitrine_visits 
FOR SELECT 
USING (
  auth.uid() = seller_id 
  OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Create index for faster queries
CREATE INDEX idx_vitrine_visits_vitrine_id ON public.vitrine_visits(vitrine_id);
CREATE INDEX idx_vitrine_visits_seller_id ON public.vitrine_visits(seller_id);
CREATE INDEX idx_vitrine_visits_visited_at ON public.vitrine_visits(visited_at DESC);