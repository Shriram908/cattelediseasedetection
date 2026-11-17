-- Existing reports predate payments and stay readable; new reports start locked.
ALTER TABLE public.reports ADD COLUMN unlocked boolean NOT NULL DEFAULT true;
ALTER TABLE public.reports ALTER COLUMN unlocked SET DEFAULT false;
COMMENT ON COLUMN public.reports.unlocked IS 'True once the diagnosis fee is paid; only the backend may set it.';

CREATE OR REPLACE FUNCTION public.protect_report_unlock()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF coalesce(auth.role(), '') <> 'service_role' THEN
    IF TG_OP = 'INSERT' THEN NEW.unlocked := false;
    ELSE NEW.unlocked := OLD.unlocked;
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER reports_protect_unlock
BEFORE INSERT OR UPDATE ON public.reports
FOR EACH ROW EXECUTE FUNCTION public.protect_report_unlock();

DROP POLICY "Users can view their own reports" ON public.reports;
CREATE POLICY "Farmers view their unlocked reports" ON public.reports
FOR SELECT TO authenticated USING (user_id = auth.uid() AND unlocked);

CREATE TABLE public.diagnosis_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  razorpay_order_id text NOT NULL UNIQUE,
  razorpay_payment_id text UNIQUE,
  amount_paise integer NOT NULL CHECK (amount_paise > 0),
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'paid')),
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);
CREATE INDEX diagnosis_payments_report_idx ON public.diagnosis_payments (report_id);
CREATE INDEX diagnosis_payments_user_idx ON public.diagnosis_payments (user_id, created_at DESC);

GRANT SELECT ON public.diagnosis_payments TO authenticated;
GRANT ALL ON public.diagnosis_payments TO service_role;
ALTER TABLE public.diagnosis_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Farmers view own payments" ON public.diagnosis_payments
FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins view payments" ON public.diagnosis_payments
FOR SELECT TO authenticated USING (public.is_admin());

-- Lets a farmer see which of their reports await payment without exposing results.
CREATE OR REPLACE FUNCTION public.my_locked_reports(_report_id uuid DEFAULT NULL)
RETURNS TABLE (id uuid, diagnosis_date timestamptz, cattle_name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT r.id, r.diagnosis_date, c.name
  FROM public.reports r
  LEFT JOIN public.cattle c ON c.id = r.cattle_id
  WHERE r.user_id = auth.uid() AND NOT r.unlocked
    AND (_report_id IS NULL OR r.id = _report_id)
  ORDER BY r.diagnosis_date DESC
  LIMIT 20
$$;
REVOKE EXECUTE ON FUNCTION public.my_locked_reports(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_locked_reports(uuid) TO authenticated;