-- Allow authenticated users to view basic profile info for other users
-- This is needed for Messages, Appointments, and Veterinarians pages
CREATE POLICY "Authenticated users can view basic profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Drop the old restrictive policy since the new one covers it
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
