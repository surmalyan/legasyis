-- Add is_public flag to profiles
ALTER TABLE public.profiles ADD COLUMN is_public boolean NOT NULL DEFAULT false;

-- Allow anonymous read access to public profiles
CREATE POLICY "Anyone can view public profiles"
ON public.profiles FOR SELECT TO anon
USING (is_public = true);

-- Allow anonymous read access to entries of users with public profiles
CREATE POLICY "Anyone can view entries of public profiles"
ON public.entries FOR SELECT TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = entries.user_id
    AND profiles.is_public = true
  )
);

-- Also allow authenticated users to see public profiles (not just their own)
CREATE POLICY "Authenticated can view public profiles"
ON public.profiles FOR SELECT TO authenticated
USING (is_public = true);