-- Ensure products table has the expected structure
-- 1) Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  price numeric(10, 2) NOT NULL,
  description text NULL,
  image_url text NULL,
  category text NULL,
  is_active boolean NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (id)
);

-- 2) Align existing columns (safe if they already match)
ALTER TABLE public.products
  ALTER COLUMN id SET DEFAULT gen_random_uuid(),
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now(),
  ALTER COLUMN is_active SET DEFAULT true;

-- Ensure price has precision/scale
ALTER TABLE public.products
  ALTER COLUMN price TYPE numeric(10, 2) USING price::numeric(10, 2);

-- 3) Indexes
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products USING btree (category);

-- 4) Trigger to auto-update updated_at
DO $$
BEGIN
  -- Drop trigger if it exists (Postgres has no CREATE TRIGGER IF NOT EXISTS)
  IF EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_products_updated_at'
      AND tgrelid = 'public.products'::regclass
  ) THEN
    EXECUTE 'DROP TRIGGER update_products_updated_at ON public.products';
  END IF;

  EXECUTE 'CREATE TRIGGER update_products_updated_at
           BEFORE UPDATE ON public.products
           FOR EACH ROW
           EXECUTE FUNCTION public.update_updated_at_column()';
END $$;
