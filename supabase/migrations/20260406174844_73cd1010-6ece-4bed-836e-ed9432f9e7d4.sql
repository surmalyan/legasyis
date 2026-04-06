
-- 1. Fix public profile exposure: create a view with only safe fields
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT
  user_id,
  username,
  full_name,
  avatar_url,
  occupation,
  hobbies,
  life_motto,
  is_public
FROM public.profiles
WHERE is_public = true;

-- Grant anon and authenticated access to the view
GRANT SELECT ON public.public_profiles TO anon;
GRANT SELECT ON public.public_profiles TO authenticated;

-- Remove overly broad anonymous SELECT policies on profiles
DROP POLICY IF EXISTS "Anyone can view public profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated can search profiles by username" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated can view public profiles" ON public.profiles;

-- Re-add a scoped authenticated policy for public profiles (needed for search/legacy page)
CREATE POLICY "Authenticated can view public profiles limited"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (is_public = true);

-- 2. Fix subscription self-insert: remove the INSERT policy
DROP POLICY IF EXISTS "Users can insert own subscription" ON public.user_subscriptions;
