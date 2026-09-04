ALTER TABLE public.customer_submissions
ADD COLUMN IF NOT EXISTS brand TEXT NOT NULL DEFAULT 'smog';