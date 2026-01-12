-- Create admins table for admin users
CREATE TABLE public.admins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  matricula TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  cpf TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admins table
CREATE POLICY "Admins can view all admins" 
ON public.admins 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Super admins can manage admins" 
ON public.admins 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Public can check matricula for admin login" 
ON public.admins 
FOR SELECT 
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_admins_updated_at
BEFORE UPDATE ON public.admins
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the super admin
INSERT INTO public.admins (matricula, full_name, email, cpf)
VALUES ('1053321', 'Maicon Silva', 'maiconsillva2025@gmail.com', '10533219531');