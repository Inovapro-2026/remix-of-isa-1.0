-- Add vitrine_id column to clients table for random unique vitrine links
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS vitrine_id TEXT UNIQUE;

-- Create function to generate random vitrine ID
CREATE OR REPLACE FUNCTION public.generate_vitrine_id()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Set vitrine_id for existing clients that don't have one
UPDATE public.clients 
SET vitrine_id = generate_vitrine_id()
WHERE vitrine_id IS NULL;

-- Create trigger to auto-generate vitrine_id on insert
CREATE OR REPLACE FUNCTION public.set_vitrine_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.vitrine_id IS NULL THEN
    NEW.vitrine_id := generate_vitrine_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trigger_set_vitrine_id ON public.clients;
CREATE TRIGGER trigger_set_vitrine_id
  BEFORE INSERT ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.set_vitrine_id();