
-- Storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage bucket for voice notes
INSERT INTO storage.buckets (id, name, public) VALUES ('voice-notes', 'voice-notes', true);

-- RLS for avatars bucket
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS for voice-notes bucket
CREATE POLICY "Users can upload own voice notes"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'voice-notes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view voice notes"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'voice-notes');

CREATE POLICY "Users can delete own voice notes"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'voice-notes' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Family members table for family tree
CREATE TABLE public.family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  relationship text NOT NULL,
  birth_year integer,
  death_year integer,
  parent_member_id uuid REFERENCES public.family_members(id) ON DELETE SET NULL,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own family members"
ON public.family_members FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own family members"
ON public.family_members FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own family members"
ON public.family_members FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own family members"
ON public.family_members FOR DELETE TO authenticated
USING (auth.uid() = user_id);
