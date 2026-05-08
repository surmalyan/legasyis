
ALTER TABLE public.circle_memories
ADD COLUMN IF NOT EXISTS guest_relationship text;

CREATE OR REPLACE FUNCTION public.submit_guest_memory(
  _invite_code text,
  _guest_name text,
  _guest_email text,
  _content text,
  _voice_note_path text,
  _photo_urls text[],
  _guest_relationship text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    guest_name, guest_email, guest_relationship
  ) VALUES (
    v_circle_id, NULL, _content, _voice_note_path, _photo_urls,
    trim(_guest_name), NULLIF(lower(trim(_guest_email)), ''),
    NULLIF(trim(_guest_relationship), '')
  ) RETURNING id INTO v_memory_id;

  RETURN v_memory_id;
END;
$function$;
