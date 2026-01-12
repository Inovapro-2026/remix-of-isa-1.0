-- Drop and recreate function with fixed logic
DROP FUNCTION IF EXISTS public.get_public_vitrine(text);

CREATE OR REPLACE FUNCTION public.get_public_vitrine(identifier text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_user_id UUID;
  v_config JSONB;
  v_products JSONB;
  v_clean_id TEXT;
BEGIN
  IF identifier IS NULL OR length(trim(identifier)) = 0 THEN
    RETURN NULL;
  END IF;

  -- Clean the identifier (remove formatting)
  v_clean_id := replace(replace(trim(identifier), '.', ''), '-', '');

  -- Step 1: Try profiles table by CPF or ID
  SELECT p.id INTO v_user_id
  FROM public.profiles p
  WHERE replace(replace(p.cpf, '.', ''), '-', '') = v_clean_id
     OR p.cpf = identifier
     OR p.id::text = identifier
  LIMIT 1;

  -- Step 2: Try clients table
  IF v_user_id IS NULL THEN
    SELECT c.user_id INTO v_user_id
    FROM public.clients c
    WHERE c.user_id IS NOT NULL
      AND (replace(replace(c.cpf, '.', ''), '-', '') = v_clean_id
           OR c.cpf = identifier
           OR c.user_id::text = identifier)
    LIMIT 1;
  END IF;

  -- Step 3: Try admins table
  IF v_user_id IS NULL THEN
    SELECT a.user_id INTO v_user_id
    FROM public.admins a
    WHERE a.user_id IS NOT NULL
      AND (replace(replace(a.cpf, '.', ''), '-', '') = v_clean_id
           OR a.cpf = identifier
           OR a.user_id::text = identifier)
    LIMIT 1;
  END IF;

  -- Step 4: Try direct UUID match against client_ai_memory
  IF v_user_id IS NULL THEN
    BEGIN
      v_user_id := identifier::uuid;
      -- Verify this user_id exists in client_ai_memory
      IF NOT EXISTS (SELECT 1 FROM public.client_ai_memory WHERE user_id = v_user_id) THEN
        v_user_id := NULL;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_user_id := NULL;
    END;
  END IF;

  -- Return null if no user found
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'user_not_found', 'identifier', identifier);
  END IF;

  -- Get vitrine config
  SELECT cam.config -> 'vitrine' -> 'config'
  INTO v_config
  FROM public.client_ai_memory cam
  WHERE cam.user_id = v_user_id
  LIMIT 1;

  -- Get active products
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
    'products', v_products,
    'user_id', v_user_id
  );
END;
$function$;