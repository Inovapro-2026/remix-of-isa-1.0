-- Add product code column
ALTER TABLE public.products 
ADD COLUMN code text;

-- Create function to generate product code
CREATE OR REPLACE FUNCTION public.generate_product_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    -- Generate a 6-character alphanumeric code
    new_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.products WHERE code = new_code) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  NEW.code := new_code;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to auto-generate code on insert
CREATE TRIGGER generate_product_code_trigger
BEFORE INSERT ON public.products
FOR EACH ROW
WHEN (NEW.code IS NULL)
EXECUTE FUNCTION public.generate_product_code();

-- Generate codes for existing products
UPDATE public.products 
SET code = upper(substring(md5(id::text || created_at::text) from 1 for 6))
WHERE code IS NULL;