-- Drop the recursive policy
DROP POLICY IF EXISTS "Veterinarians can view reports they're treating" ON public.reports;

-- Create a security definer function to check vet access without recursion
CREATE OR REPLACE FUNCTION public.vet_has_notes_on_report(_vet_id uuid, _report_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.vet_notes
    WHERE vet_id = _vet_id AND report_id = _report_id
  )
$$;

-- Recreate the policy using the function
CREATE POLICY "Veterinarians can view reports they're treating"
ON public.reports
FOR SELECT
TO authenticated
USING (public.vet_has_notes_on_report(auth.uid(), id));