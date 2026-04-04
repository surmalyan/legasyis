
-- Allow authenticated users to search profiles by username
CREATE POLICY "Authenticated can search profiles by username"
ON public.profiles
FOR SELECT
TO authenticated
USING (username IS NOT NULL);
