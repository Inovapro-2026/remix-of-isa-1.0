-- Create table for WhatsApp conversation memory
CREATE TABLE public.whatsapp_conversation_memory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instance_id UUID NOT NULL REFERENCES public.whatsapp_instances(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  customer_name TEXT,
  conversation_history JSONB DEFAULT '[]'::jsonb,
  context JSONB DEFAULT '{}'::jsonb,
  first_contact_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(instance_id, phone_number)
);

-- Enable RLS
ALTER TABLE public.whatsapp_conversation_memory ENABLE ROW LEVEL SECURITY;

-- Policy to allow the service role to manage all memories
CREATE POLICY "Service role can manage all memories"
ON public.whatsapp_conversation_memory
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_conversation_memory_phone ON public.whatsapp_conversation_memory(instance_id, phone_number);
CREATE INDEX idx_conversation_memory_last_message ON public.whatsapp_conversation_memory(last_message_at DESC);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_conversation_memory_updated_at
BEFORE UPDATE ON public.whatsapp_conversation_memory
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();