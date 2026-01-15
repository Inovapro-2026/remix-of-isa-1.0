-- Clean up orphaned data for deleted user 810f7a82-1bd7-4999-86a1-ddb4194b7254 (matricula 666058)

-- First delete whatsapp related data (respecting foreign keys)
DELETE FROM whatsapp_messages WHERE instance_id IN (
  SELECT id FROM whatsapp_instances WHERE user_id = '810f7a82-1bd7-4999-86a1-ddb4194b7254'
);

DELETE FROM whatsapp_contacts WHERE instance_id IN (
  SELECT id FROM whatsapp_instances WHERE user_id = '810f7a82-1bd7-4999-86a1-ddb4194b7254'
);

DELETE FROM whatsapp_shopping_cart WHERE instance_id IN (
  SELECT id FROM whatsapp_instances WHERE user_id = '810f7a82-1bd7-4999-86a1-ddb4194b7254'
);

DELETE FROM whatsapp_conversation_memory WHERE instance_id IN (
  SELECT id FROM whatsapp_instances WHERE user_id = '810f7a82-1bd7-4999-86a1-ddb4194b7254'
);

DELETE FROM whatsapp_instances WHERE user_id = '810f7a82-1bd7-4999-86a1-ddb4194b7254';

-- Delete other related data
DELETE FROM products WHERE user_id = '810f7a82-1bd7-4999-86a1-ddb4194b7254';
DELETE FROM categories WHERE user_id = '810f7a82-1bd7-4999-86a1-ddb4194b7254';
DELETE FROM client_ai_memory WHERE user_id = '810f7a82-1bd7-4999-86a1-ddb4194b7254';
DELETE FROM ai_behavior_rules WHERE user_id = '810f7a82-1bd7-4999-86a1-ddb4194b7254';
DELETE FROM company_knowledge WHERE user_id = '810f7a82-1bd7-4999-86a1-ddb4194b7254';
DELETE FROM seller_balances WHERE user_id = '810f7a82-1bd7-4999-86a1-ddb4194b7254';
DELETE FROM seller_pix_info WHERE user_id = '810f7a82-1bd7-4999-86a1-ddb4194b7254';
DELETE FROM ai_configs WHERE user_id = '810f7a82-1bd7-4999-86a1-ddb4194b7254';
DELETE FROM user_roles WHERE user_id = '810f7a82-1bd7-4999-86a1-ddb4194b7254';

-- Finally delete the profile
DELETE FROM profiles WHERE id = '810f7a82-1bd7-4999-86a1-ddb4194b7254';

-- Also clean by matricula
DELETE FROM products WHERE matricula = '666058';
DELETE FROM ai_behavior_rules WHERE matricula = '666058';
DELETE FROM ai_local_memory WHERE matricula = '666058';