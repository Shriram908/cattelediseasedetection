CREATE OR REPLACE FUNCTION public.email_registered(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE lower(email) = lower(trim(_email))
  );
$$;

REVOKE ALL ON FUNCTION public.email_registered(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.email_registered(text) TO anon, authenticated;