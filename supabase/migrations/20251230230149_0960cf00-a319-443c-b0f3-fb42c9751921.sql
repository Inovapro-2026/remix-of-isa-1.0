-- Public RPC to fetch storefront data without exposing private memory
-- Returns only vitrine config (from client_ai_memory) + active products

CREATE OR REPLACE FUNCTION public.get_public_vitrine(identifier TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_config JSONB;
  v_products JSONB;
BEGIN
  IF identifier IS NULL OR length(trim(identifier)) = 0 THEN
    RETURN NULL;
  END IF;

  -- Accept either CPF (digits string stored in profiles.cpf) or direct user id
  SELECT p.id
  INTO v_user_id
  FROM public.profiles p
  WHERE p.cpf = identifier
     OR p.id::text = identifier
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT (cam.config -> 'vitrine' -> 'config')
  INTO v_config
  FROM public.client_ai_memory cam
  WHERE cam.user_id = v_user_id
  LIMIT 1;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', pr.id,
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

  RETURN jsonb_build_object(
    'vitrine', jsonb_build_object('config', v_config),
    'products', v_products
  );
END;
$$;

-- Allow calling the function from the public (anon) client
GRANT EXECUTE ON FUNCTION public.get_public_vitrine(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_vitrine(TEXT) TO authenticated;
