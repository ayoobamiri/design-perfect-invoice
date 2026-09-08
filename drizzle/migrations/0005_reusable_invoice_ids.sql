CREATE TABLE IF NOT EXISTS public.invoice_released_ids (
  invoice_id text PRIMARY KEY,
  brand text NOT NULL,
  yr integer NOT NULL,
  released_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.invoice_released_ids TO service_role;

ALTER TABLE public.invoice_released_ids ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.next_invoice_id(_brand text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_brand text := CASE WHEN _brand = 'auto' THEN 'auto' ELSE 'smog' END;
  v_prefix text := CASE WHEN _brand = 'auto' THEN 'PIA' ELSE 'PIS' END;
  v_year integer := EXTRACT(YEAR FROM (now() AT TIME ZONE 'America/Los_Angeles'))::int;
  v_yy text := to_char((now() AT TIME ZONE 'America/Los_Angeles'), 'YY');
  v_n integer;
  v_candidate text;
BEGIN
  -- Reuse the lowest cancelled number for this brand/year first.
  LOOP
    DELETE FROM public.invoice_released_ids r
    WHERE r.invoice_id = (
      SELECT x.invoice_id FROM public.invoice_released_ids x
      WHERE x.brand = v_brand AND x.yr = v_year
      ORDER BY x.invoice_id
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    RETURNING r.invoice_id INTO v_candidate;

    EXIT WHEN v_candidate IS NULL;

    IF NOT EXISTS (SELECT 1 FROM public.invoices i WHERE i.data->>'invoice_id' = v_candidate) THEN
      RETURN v_candidate;
    END IF;
  END LOOP;

  LOOP
    INSERT INTO public.invoice_counters AS c (brand, yr, last_number)
    VALUES (v_brand, v_year, 10)
    ON CONFLICT (brand, yr) DO UPDATE SET last_number = c.last_number + 1
    RETURNING c.last_number INTO v_n;

    v_candidate := v_prefix || v_yy || lpad(v_n::text, 2, '0');

    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.invoices i WHERE i.data->>'invoice_id' = v_candidate
    );
  END LOOP;

  RETURN v_candidate;
END;
$function$;

CREATE OR REPLACE FUNCTION public.release_invoice_id(_brand text, _invoice_id text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_brand text := CASE WHEN _brand = 'auto' THEN 'auto' ELSE 'smog' END;
  v_prefix text := CASE WHEN _brand = 'auto' THEN 'PIA' ELSE 'PIS' END;
  v_year integer := EXTRACT(YEAR FROM (now() AT TIME ZONE 'America/Los_Angeles'))::int;
  v_yy text := to_char((now() AT TIME ZONE 'America/Los_Angeles'), 'YY');
  v_id text := upper(btrim(coalesce(_invoice_id, '')));
BEGIN
  IF v_id !~ ('^' || v_prefix || v_yy || '[0-9]+$') THEN
    RETURN;
  END IF;
  IF EXISTS (SELECT 1 FROM public.invoices i WHERE i.data->>'invoice_id' = v_id) THEN
    RETURN;
  END IF;
  INSERT INTO public.invoice_released_ids (invoice_id, brand, yr)
  VALUES (v_id, v_brand, v_year)
  ON CONFLICT (invoice_id) DO NOTHING;
END;
$function$;