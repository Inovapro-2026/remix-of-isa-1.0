-- Drop existing function and recreate with better lookup
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
BEGIN
  IF identifier IS NULL OR length(trim(identifier)) = 0 THEN
    RETURN NULL;
  END IF;

  -- Try to match by:
  -- 1. profiles.cpf (raw digits or formatted)
  -- 2. clients.cpf (raw digits or formatted)
  -- 3. Direct UUID match on profiles.id
  -- 4. Direct UUID match on client_ai_memory.user_id
  
  -- First try profiles table
  SELECT p.id
  INTO v_user_id
  FROM public.profiles p
  WHERE p.cpf = identifier
     OR replace(replace(p.cpf, '.', ''), '-', '') = identifier
     OR p.id::text = identifier
  LIMIT 1;

  -- If not found in profiles, try clients table
  IF v_user_id IS NULL THEN
    SELECT c.user_id
    INTO v_user_id
    FROM public.clients c
    WHERE c.cpf = identifier
       OR replace(replace(c.cpf, '.', ''), '-', '') = identifier
       OR c.user_id::text = identifier
    LIMIT 1;
  END IF;

  -- If still not found, try to cast identifier as UUID and check client_ai_memory directly
  IF v_user_id IS NULL THEN
    BEGIN
      v_user_id := identifier::uuid;
    EXCEPTION WHEN OTHERS THEN
      v_user_id := NULL;
    END;
  END IF;

  -- If still no user_id, return null
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Get vitrine config from client_ai_memory
  SELECT (cam.config -> 'vitrine' -> 'config')
  INTO v_config
  FROM public.client_ai_memory cam
  WHERE cam.user_id = v_user_id
  LIMIT 1;

  -- Get active products for this user
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
$function$;