CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
 INSERT INTO public.profiles (id, email, full_name, phone)
 VALUES (NEW.id, COALESCE(NEW.email, ''), LEFT(COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 200), NULLIF('+' || LTRIM(COALESCE(NEW.phone, ''), '+'), '+'))
 ON CONFLICT (id) DO NOTHING;
 INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'farmer'::public.app_role) ON CONFLICT (user_id, role) DO NOTHING;
 RETURN NEW;
END;
$function$;