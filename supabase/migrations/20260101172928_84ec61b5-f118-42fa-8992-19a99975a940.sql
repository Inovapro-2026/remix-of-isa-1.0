-- Create categories table
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  image_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own categories"
ON public.categories FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own categories"
ON public.categories FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
ON public.categories FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
ON public.categories FOR DELETE
USING (auth.uid() = user_id);

-- Public can view categories for vitrine
CREATE POLICY "Public can view active categories"
ON public.categories FOR SELECT
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for category images
INSERT INTO storage.buckets (id, name, public)
VALUES ('category-images', 'category-images', true);

-- Storage policies
CREATE POLICY "Anyone can view category images"
ON storage.objects FOR SELECT
USING (bucket_id = 'category-images');

CREATE POLICY "Users can upload category images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'category-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own category images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'category-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own category images"
ON storage.objects FOR DELETE
USING (bucket_id = 'category-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Update get_public_vitrine to include categories
CREATE OR REPLACE FUNCTION public.get_public_vitrine(identifier text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_config JSONB;
  v_products JSONB;
  v_categories JSONB;
  v_clean_id TEXT;
BEGIN
  IF identifier IS NULL OR length(trim(identifier)) = 0 THEN
    RETURN NULL;
  END IF;

  v_clean_id := replace(replace(trim(identifier), '.', ''), '-', '');

  SELECT p.id INTO v_user_id
  FROM public.profiles p
  WHERE replace(replace(p.cpf, '.', ''), '-', '') = v_clean_id
     OR p.cpf = identifier
     OR p.id::text = identifier
  LIMIT 1;

  IF v_user_id IS NULL THEN
    SELECT c.user_id INTO v_user_id
    FROM public.clients c
    WHERE c.user_id IS NOT NULL
      AND (replace(replace(c.cpf, '.', ''), '-', '') = v_clean_id
           OR c.cpf = identifier
           OR c.user_id::text = identifier)
    LIMIT 1;
  END IF;

  IF v_user_id IS NULL THEN
    SELECT a.user_id INTO v_user_id
    FROM public.admins a
    WHERE a.user_id IS NOT NULL
      AND (replace(replace(a.cpf, '.', ''), '-', '') = v_clean_id
           OR a.cpf = identifier
           OR a.user_id::text = identifier)
    LIMIT 1;
  END IF;

  IF v_user_id IS NULL THEN
    BEGIN
      v_user_id := identifier::uuid;
      IF NOT EXISTS (SELECT 1 FROM public.client_ai_memory WHERE user_id = v_user_id) THEN
        v_user_id := NULL;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_user_id := NULL;
    END;
  END IF;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'user_not_found', 'identifier', identifier);
  END IF;

  SELECT cam.config -> 'vitrine' -> 'config'
  INTO v_config
  FROM public.client_ai_memory cam
  WHERE cam.user_id = v_user_id
  LIMIT 1;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', pr.id,
        'code', pr.code,
        'name', pr.name,
        'price', pr.price,
        'description', pr.description,
        'image_url', pr.image_url,
        'category', pr.category
      )
      ORDER BY pr.created_at DESC
    ),
    '[]'::jsonb
  )
  INTO v_products
  FROM public.products pr
  WHERE pr.user_id = v_user_id
    AND pr.is_active = true;

  -- Get categories
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', cat.id,
        'name', cat.name,
        'image_url', cat.image_url
      )
      ORDER BY cat.name ASC
    ),
    '[]'::jsonb
  )
  INTO v_categories
  FROM public.categories cat
  WHERE cat.user_id = v_user_id;

  RETURN jsonb_build_object(
    'vitrine', jsonb_build_object('config', v_config),
    'products', v_products,
    'categories', v_categories,
    'user_id', v_user_id
  );
END;
$$;