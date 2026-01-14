-- Create storage bucket for welcome media (images/videos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('welcome-media', 'welcome-media', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for welcome-media bucket
CREATE POLICY "Users can upload their own welcome media"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'welcome-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own welcome media"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'welcome-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own welcome media"
ON storage.objects
FOR DELETE
USING (bucket_id = 'welcome-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Welcome media is publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'welcome-media');