ALTER TABLE public.profiles ADD CONSTRAINT profile_contact_lengths CHECK (char_length(coalesce(full_name,'')) <= 200 AND char_length(coalesce(phone,'')) <= 40 AND char_length(coalesce(location,'')) <= 300) NOT VALID;
CREATE FUNCTION public.admin_metrics(days integer DEFAULT 30) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
 IF NOT public.is_admin() THEN RAISE EXCEPTION 'Administrator access required' USING ERRCODE = '42501'; END IF;
 IF days NOT IN (7,30,90) THEN RAISE EXCEPTION 'Invalid time range'; END IF;
 SELECT jsonb_build_object('diagnoses', (SELECT count(*) FROM public.reports), 'signups', (SELECT count(*) FROM public.profiles), 'queries', (SELECT count(*) FROM public.chatbot_queries), 'trends', (SELECT coalesce(jsonb_agg(t), '[]'::jsonb) FROM (SELECT to_char(day,'YYYY-MM-DD') AS date, (SELECT count(*) FROM public.reports r WHERE r.diagnosis_date >= day AND r.diagnosis_date < day + interval '1 day') AS diagnoses FROM generate_series(date_trunc('day',now()) - (days-1)*interval '1 day', date_trunc('day',now()), interval '1 day') AS day) t), 'diseases', (SELECT coalesce(jsonb_agg(t), '[]'::jsonb) FROM (SELECT predicted_disease AS name, count(*) AS count FROM public.reports WHERE diagnosis_date >= now() - days*interval '1 day' GROUP BY predicted_disease ORDER BY count(*) DESC LIMIT 8) t)) INTO result;
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.admin_metrics(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_metrics(integer) TO authenticated;
