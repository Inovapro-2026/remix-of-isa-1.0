-- ================================================================
-- TABLE 1: ai_behavior_rules
-- Stores the "Memória de Comportamento" (behavior rules) per user
-- ================================================================
CREATE TABLE IF NOT EXISTS public.ai_behavior_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  rules text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_behavior_rules ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own behavior rules"
  ON public.ai_behavior_rules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own behavior rules"
  ON public.ai_behavior_rules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own behavior rules"
  ON public.ai_behavior_rules FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own behavior rules"
  ON public.ai_behavior_rules FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_ai_behavior_rules_updated_at
  BEFORE UPDATE ON public.ai_behavior_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ================================================================
-- TABLE 2: company_knowledge
-- Stores the "Conhecimento da Empresa" per user
-- ================================================================
CREATE TABLE IF NOT EXISTS public.company_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  name text DEFAULT '',
  segment text DEFAULT '',
  mission text DEFAULT '',
  hours text DEFAULT '',
  payment text DEFAULT '',
  address text DEFAULT '',
  policies text DEFAULT '',
  schedule_config jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_knowledge ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own company knowledge"
  ON public.company_knowledge FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own company knowledge"
  ON public.company_knowledge FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own company knowledge"
  ON public.company_knowledge FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own company knowledge"
  ON public.company_knowledge FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_company_knowledge_updated_at
  BEFORE UPDATE ON public.company_knowledge
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();