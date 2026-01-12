-- Tabela para armazenar memória da IA (substituindo SQLite local)
CREATE TABLE IF NOT EXISTS public.ai_local_memory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  matricula TEXT NOT NULL,
  table_name TEXT NOT NULL,
  key TEXT NOT NULL,
  value JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(matricula, table_name, key)
);

-- Índices para busca rápida
CREATE INDEX idx_ai_local_memory_matricula ON public.ai_local_memory(matricula);
CREATE INDEX idx_ai_local_memory_lookup ON public.ai_local_memory(matricula, table_name);

-- Habilitar RLS
ALTER TABLE public.ai_local_memory ENABLE ROW LEVEL SECURITY;

-- Política para leitura por matrícula do usuário
CREATE POLICY "Users can read their own memory" 
ON public.ai_local_memory 
FOR SELECT 
USING (
  matricula IN (
    SELECT c.matricula FROM clients c WHERE c.user_id = auth.uid()
  )
);

-- Política para inserção por matrícula do usuário
CREATE POLICY "Users can insert their own memory" 
ON public.ai_local_memory 
FOR INSERT 
WITH CHECK (
  matricula IN (
    SELECT c.matricula FROM clients c WHERE c.user_id = auth.uid()
  )
);

-- Política para atualização por matrícula do usuário
CREATE POLICY "Users can update their own memory" 
ON public.ai_local_memory 
FOR UPDATE 
USING (
  matricula IN (
    SELECT c.matricula FROM clients c WHERE c.user_id = auth.uid()
  )
);

-- Política para deleção por matrícula do usuário
CREATE POLICY "Users can delete their own memory" 
ON public.ai_local_memory 
FOR DELETE 
USING (
  matricula IN (
    SELECT c.matricula FROM clients c WHERE c.user_id = auth.uid()
  )
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_ai_local_memory_updated_at
BEFORE UPDATE ON public.ai_local_memory
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();