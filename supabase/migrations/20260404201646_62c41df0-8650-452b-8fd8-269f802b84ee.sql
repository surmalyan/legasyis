
-- 1. Fix profile username search policy to only expose public profiles
DROP POLICY IF EXISTS "Authenticated can search profiles by username" ON public.profiles;
CREATE POLICY "Authenticated can search profiles by username"
  ON public.profiles FOR SELECT TO authenticated
  USING (username IS NOT NULL AND is_public = true);

-- 2. Fix subscription self-insert to prevent self-activation
DROP POLICY IF EXISTS "Users can insert own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can insert own subscription"
  ON public.user_subscriptions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND active = false);

-- 3. Make voice-notes bucket private
UPDATE storage.buckets SET public = false WHERE id = 'voice-notes';

-- 4. Drop any public SELECT policy on voice-notes storage objects
DROP POLICY IF EXISTS "Anyone can view voice notes" ON storage.objects;
DROP POLICY IF EXISTS "Voice notes are publicly accessible" ON storage.objects;

-- 5. Add private SELECT policy for voice-notes (owner only)
CREATE POLICY "Users can view own voice notes"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'voice-notes' AND auth.uid()::text = (storage.foldername(name))[1]);
