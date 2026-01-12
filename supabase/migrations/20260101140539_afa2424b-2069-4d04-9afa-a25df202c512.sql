-- Insert client_ai_memory for the client user, copying config from admin's memory
INSERT INTO client_ai_memory (user_id, config)
SELECT 
  '48a0230c-f045-4916-98b4-66529b590fdc'::uuid,
  cam.config
FROM client_ai_memory cam
WHERE cam.user_id = '810f7a82-1bd7-4999-86a1-ddb4194b7254'
ON CONFLICT (user_id) DO UPDATE SET config = EXCLUDED.config;