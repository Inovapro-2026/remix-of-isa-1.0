-- Insert approved account request so the trigger picks up the matricula on signup
INSERT INTO public.account_requests (
  full_name,
  email,
  matricula,
  status,
  reviewed_at
) VALUES (
  'Maicon Correia da Silva',
  'maiconsillva2025@gmail.com',
  '1285041',
  'approved',
  now()
);

-- Create a function to set admin role after signup for this specific email
CREATE OR REPLACE FUNCTION public.set_admin_for_maicon()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'maiconsillva2025@gmail.com' THEN
    UPDATE public.user_roles
    SET role = 'super_admin'
    WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to run after user creation
DROP TRIGGER IF EXISTS set_admin_role_maicon ON auth.users;
CREATE TRIGGER set_admin_role_maicon
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.set_admin_for_maicon();