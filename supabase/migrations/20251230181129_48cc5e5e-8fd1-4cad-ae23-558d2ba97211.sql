-- Store per-user AI memory config (behavior/identity/company/products)
CREATE TABLE IF NOT EXISTS public.client_ai_memory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.client_ai_memory ENABLE ROW LEVEL SECURITY;

-- Policies: user can access only own row
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'client_ai_memory' AND policyname = 'Users can view own AI memory'
  ) THEN
    CREATE POLICY "Users can view own AI memory"
    ON public.client_ai_memory
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'client_ai_memory' AND policyname = 'Users can insert own AI memory'
  ) THEN
    CREATE POLICY "Users can insert own AI memory"
    ON public.client_ai_memory
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'client_ai_memory' AND policyname = 'Users can update own AI memory'
  ) THEN
    CREATE POLICY "Users can update own AI memory"
    ON public.client_ai_memory
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'client_ai_memory' AND policyname = 'Users can delete own AI memory'
  ) THEN
    CREATE POLICY "Users can delete own AI memory"
    ON public.client_ai_memory
    FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Timestamp trigger function (idempotent)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_client_ai_memory_updated_at ON public.client_ai_memory;
CREATE TRIGGER update_client_ai_memory_updated_at
BEFORE UPDATE ON public.client_ai_memory
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Helpful index
CREATE INDEX IF NOT EXISTS idx_client_ai_memory_user_id ON public.client_ai_memory(user_id);
