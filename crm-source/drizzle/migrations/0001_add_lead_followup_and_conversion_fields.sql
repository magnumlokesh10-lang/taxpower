ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS followup_date date,
  ADD COLUMN IF NOT EXISTS followup_note text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS converted_at timestamptz,
  ADD COLUMN IF NOT EXISTS purchase_product text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS purchase_amount numeric(12,2),
  ADD COLUMN IF NOT EXISTS invoice_no text NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS leads_followup_date_idx ON public.leads (followup_date);
CREATE INDEX IF NOT EXISTS leads_converted_at_idx ON public.leads (converted_at DESC);