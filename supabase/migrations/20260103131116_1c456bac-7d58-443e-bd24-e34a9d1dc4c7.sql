-- Criar bucket para anexos de tickets
INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-attachments', 'ticket-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Policy para visualização pública
CREATE POLICY "Anexos são públicos para visualização"
ON storage.objects FOR SELECT
USING (bucket_id = 'ticket-attachments');

-- Policy para upload por usuários autenticados
CREATE POLICY "Usuários autenticados podem fazer upload de anexos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'ticket-attachments' AND auth.role() = 'authenticated');

-- Policy para deletar próprios anexos
CREATE POLICY "Usuários podem deletar próprios anexos"
ON storage.objects FOR DELETE
USING (bucket_id = 'ticket-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);