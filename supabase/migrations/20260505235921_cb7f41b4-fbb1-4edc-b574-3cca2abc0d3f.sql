
-- Allow public (anon + authenticated) read of memory_circles by invite_code
DROP POLICY IF EXISTS "Anyone can view circle by invite code" ON public.memory_circles;
CREATE POLICY "Public can view circles"
  ON public.memory_circles FOR SELECT
  TO anon, authenticated
  USING (true);

-- Make author_id nullable to support guest contributions
ALTER TABLE public.circle_memories
  ALTER COLUMN author_id DROP NOT NULL;

-- Add guest fields
ALTER TABLE public.circle_memories
  ADD COLUMN IF NOT EXISTS guest_name TEXT,
  ADD COLUMN IF NOT EXISTS guest_email TEXT;

-- Server-side function for guest memory submission
CREATE OR REPLACE FUNCTION public.submit_guest_memory(
  _invite_code TEXT,
  _guest_name TEXT,
  _guest_email TEXT,
  _content TEXT,
  _voice_note_path TEXT,
  _photo_urls TEXT[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_circle_id UUID;
  v_memory_id UUID;
BEGIN
  IF _invite_code IS NULL OR length(trim(_invite_code)) = 0 THEN
    RAISE EXCEPTION 'invite_code_required';
  END IF;
  IF _guest_name IS NULL OR length(trim(_guest_name)) = 0 THEN
    RAISE EXCEPTION 'name_required';
  END IF;
  IF (_content IS NULL OR length(trim(_content)) = 0)
     AND _voice_note_path IS NULL
     AND (_photo_urls IS NULL OR array_length(_photo_urls, 1) IS NULL) THEN
    RAISE EXCEPTION 'empty_memory';
  END IF;

  SELECT id INTO v_circle_id FROM public.memory_circles WHERE invite_code = _invite_code;
  IF v_circle_id IS NULL THEN
    RAISE EXCEPTION 'circle_not_found';
  END IF;

  INSERT INTO public.circle_memories (
    circle_id, author_id, content, voice_note_path, photo_urls,
    guest_name, guest_email
  ) VALUES (
    v_circle_id, NULL, _content, _voice_note_path, _photo_urls,
    trim(_guest_name), NULLIF(lower(trim(_guest_email)), '')
  ) RETURNING id INTO v_memory_id;

  RETURN v_memory_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_guest_memory(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT[]) TO anon, authenticated;

-- Storage policies for guest uploads (voice-notes and memory-photos in guest/ prefix)
CREATE POLICY "Guest uploads to voice-notes"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'voice-notes' AND (storage.foldername(name))[1] = 'guest');

CREATE POLICY "Guest uploads to memory-photos"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'memory-photos' AND (storage.foldername(name))[1] = 'guest');
