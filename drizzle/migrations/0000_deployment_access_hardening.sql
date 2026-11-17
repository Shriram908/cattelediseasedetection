DROP POLICY IF EXISTS "Authenticated users can view basic profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
DROP POLICY IF EXISTS "Users can insert their own role on signup" ON public.user_roles;
REVOKE ALL ON public.user_roles FROM anon, authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
REVOKE ALL ON public.profiles FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cattle, public.vaccinations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.reports TO authenticated;
GRANT SELECT ON public.diseases TO authenticated;
GRANT ALL ON public.cattle, public.vaccinations, public.reports, public.diseases TO service_role;
REVOKE ALL ON public.cattle, public.vaccinations, public.reports, public.diseases FROM anon;
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 INSERT INTO public.profiles (id, email, full_name) VALUES (NEW.id, COALESCE(NEW.email, ''), LEFT(COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 200)) ON CONFLICT (id) DO NOTHING;
 INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'farmer'::public.app_role) ON CONFLICT (user_id, role) DO NOTHING;
 RETURN NEW;
END;
$$;
DROP POLICY IF EXISTS "Users can create their own reports" ON public.reports;
CREATE POLICY "Users can create their own reports" ON public.reports FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.cattle c WHERE c.id = cattle_id AND c.owner_id = auth.uid()));
DROP POLICY IF EXISTS "Users can update their own reports" ON public.reports;
CREATE POLICY "Users can update their own reports" ON public.reports FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.cattle c WHERE c.id = cattle_id AND c.owner_id = auth.uid()));
CREATE OR REPLACE FUNCTION public.validate_report_owner() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.cattle WHERE id = NEW.cattle_id AND owner_id = NEW.user_id) THEN RAISE EXCEPTION 'Report cattle must belong to the report owner'; END IF;
 IF NEW.confidence_score < 0 OR NEW.confidence_score > 1 THEN RAISE EXCEPTION 'Confidence must be between zero and one'; END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER validate_report_owner BEFORE INSERT OR UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.validate_report_owner();
CREATE INDEX IF NOT EXISTS cattle_owner_created_idx ON public.cattle(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS reports_user_diagnosis_idx ON public.reports(user_id, diagnosis_date DESC);
CREATE INDEX IF NOT EXISTS vaccinations_cattle_due_idx ON public.vaccinations(cattle_id, next_due_date);
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_report_owner() FROM PUBLIC, anon, authenticated;