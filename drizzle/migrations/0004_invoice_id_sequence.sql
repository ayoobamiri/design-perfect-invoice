CREATE TABLE IF NOT EXISTS public.invoice_counters (
  brand text NOT NULL,
  yr integer NOT NULL,
  last_number integer NOT NULL DEFAULT 10,
  PRIMARY KEY (brand, yr)
);

GRANT ALL ON public.invoice_counters TO service_role;

ALTER TABLE public.invoice_counters ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.next_invoice_id(_brand text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefix text := CASE WHEN _brand = 'auto' THEN 'PIA' ELSE 'PIS' END;
  v_year integer := EXTRACT(YEAR FROM (now() AT TIME ZONE 'America/Los_Angeles'))::int;
  v_yy text := to_char((now() AT TIME ZONE 'America/Los_Angeles'), 'YY');
  v_n integer;
  v_candidate text;
BEGIN
  LOOP
    INSERT INTO public.invoice_counters AS c (brand, yr, last_number)
    VALUES (CASE WHEN _brand = 'auto' THEN 'auto' ELSE 'smog' END, v_year, 10)
    ON CONFLICT (brand, yr) DO UPDATE SET last_number = c.last_number + 1
    RETURNING c.last_number INTO v_n;

    v_candidate := v_prefix || v_yy || lpad(v_n::text, 2, '0');

    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.invoices i WHERE i.data->>'invoice_id' = v_candidate
    );
  END LOOP;

  RETURN v_candidate;
END;
$$;

GRANT EXECUTE ON FUNCTION public.next_invoice_id(text) TO service_role;