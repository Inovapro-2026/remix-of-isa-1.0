-- Drop existing function and recreate with correct return type
DROP FUNCTION IF EXISTS public.get_public_vitrine(text);

-- Update get_public_vitrine function to also search by vitrine_id
CREATE OR REPLACE FUNCTION public.get_public_vitrine(identifier TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  found_user_id UUID;
  found_matricula TEXT;
  result JSON;
BEGIN
  -- First try to find by vitrine_id
  SELECT user_id, matricula INTO found_user_id, found_matricula
  FROM clients
  WHERE vitrine_id = identifier
  LIMIT 1;

  -- If not found, try by CPF
  IF found_user_id IS NULL THEN
    SELECT user_id, matricula INTO found_user_id, found_matricula
    FROM clients
    WHERE cpf = identifier OR cpf = regexp_replace(identifier, '\D', '', 'g')
    LIMIT 1;
  END IF;

  -- If not found, try by matricula
  IF found_user_id IS NULL THEN
    SELECT user_id, matricula INTO found_user_id, found_matricula
    FROM clients
    WHERE matricula = identifier
    LIMIT 1;
  END IF;

  -- If not found, try by user_id (UUID format)
  IF found_user_id IS NULL THEN
    BEGIN
      SELECT user_id, matricula INTO found_user_id, found_matricula
      FROM clients
      WHERE user_id = identifier::uuid
      LIMIT 1;
    EXCEPTION WHEN invalid_text_representation THEN
      NULL;
    END;
  END IF;

  -- If still not found, check profiles table
  IF found_user_id IS NULL THEN
    SELECT id, matricula INTO found_user_id, found_matricula
    FROM profiles
    WHERE cpf = identifier 
      OR cpf = regexp_replace(identifier, '\D', '', 'g')
      OR matricula = identifier
    LIMIT 1;
  END IF;

  IF found_user_id IS NULL THEN
    RETURN json_build_object('error', 'user_not_found');
  END IF;

  -- Get vitrine config from client_ai_memory
  SELECT json_build_object(
    'vitrine', (
      SELECT json_build_object('config', (config->>'vitrine')::json)
      FROM client_ai_memory
      WHERE user_id = found_user_id
    ),
    'products', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', p.id,
          'code', p.code,
          'name', p.name,
          'price', p.price,
          'description', p.description,
          'image_url', p.image_url,
          'category', p.category
        )
      ), '[]'::json)
      FROM products p
      WHERE (p.matricula = found_matricula OR p.user_id = found_user_id)
        AND p.is_active = true
    ),
    'categories', (
      SELECT COALESCE(json_agg(
        json_build_object('id', c.id, 'name', c.name, 'image_url', c.image_url)
      ), '[]'::json)
      FROM categories c
      WHERE c.user_id = found_user_id
    )
  ) INTO result;

  RETURN result;
END;
$$;