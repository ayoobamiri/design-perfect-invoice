CREATE TABLE public.customer_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ,
  name TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  zip TEXT NOT NULL DEFAULT '',
  written_by TEXT NOT NULL DEFAULT '',
  res_phone TEXT NOT NULL DEFAULT '',
  bus_phone TEXT NOT NULL DEFAULT '',
  year TEXT NOT NULL DEFAULT '',
  make TEXT NOT NULL DEFAULT '',
  model TEXT NOT NULL DEFAULT '',
  license_plate TEXT NOT NULL DEFAULT ''
);

CREATE INDEX customer_submissions_created_at_idx ON public.customer_submissions (created_at DESC);

GRANT INSERT ON public.customer_submissions TO anon;
GRANT INSERT ON public.customer_submissions TO authenticated;
GRANT ALL ON public.customer_submissions TO service_role;

ALTER TABLE public.customer_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit customer info"
  ON public.customer_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
