-- Add segmento column to account_requests if not exists
ALTER TABLE public.account_requests 
ADD COLUMN IF NOT EXISTS segmento text;

-- Add segmento and status columns to clients table if not exists
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS segmento text;

-- Add data_ultima_renovacao column to clients
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS data_ultima_renovacao timestamp with time zone;