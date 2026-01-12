-- Update default amount for plan renewals to R$97
ALTER TABLE public.plan_renewals ALTER COLUMN amount SET DEFAULT 97;