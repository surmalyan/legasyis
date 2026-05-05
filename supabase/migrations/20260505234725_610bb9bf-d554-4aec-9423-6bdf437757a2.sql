
-- Memory requests: owner-created prompts (text question + optional voice) shareable via unique link
CREATE TABLE public.memory_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  circle_id UUID NOT NULL,
  creator_id UUID NOT NULL,
  code TEXT NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(9), 'hex'),
  question TEXT NOT NULL,
  voice_path TEXT,
  category TEXT,
  life_period TEXT,
  response_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_memory_requests_circle ON public.memory_requests(circle_id);
CREATE INDEX idx_memory_requests_code ON public.memory_requests(code);

ALTER TABLE public.memory_requests ENABLE ROW LEVEL SECURITY;

-- Anyone (authed) can view a request by code (needed for the landing page)
CREATE POLICY "Anyone can view memory requests"
ON public.memory_requests FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Creator manages own requests"
ON public.memory_requests FOR ALL TO authenticated
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id AND EXISTS (
  SELECT 1 FROM public.memory_circles
  WHERE id = memory_requests.circle_id AND creator_id = auth.uid()
));

CREATE TRIGGER trg_memory_requests_updated_at
BEFORE UPDATE ON public.memory_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add request_id to circle_memories so we can link responses back
ALTER TABLE public.circle_memories
  ADD COLUMN request_id UUID REFERENCES public.memory_requests(id) ON DELETE SET NULL;

CREATE INDEX idx_circle_memories_request ON public.circle_memories(request_id);

-- Bump response_count when a memory is added against a request
CREATE OR REPLACE FUNCTION public.bump_request_response_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.request_id IS NOT NULL THEN
    UPDATE public.memory_requests
    SET response_count = response_count + 1
    WHERE id = NEW.request_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_circle_memories_bump_request
AFTER INSERT ON public.circle_memories
FOR EACH ROW EXECUTE FUNCTION public.bump_request_response_count();

-- Allow creator to share request voice from voice-notes bucket (via signed URLs)
-- voice-notes bucket already exists (private). We'll store under requests/{circle_id}/{uuid}.webm
CREATE POLICY "Circle creator can upload request voice"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'voice-notes'
  AND (storage.foldername(name))[1] = 'requests'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Authed can read request voices"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'voice-notes'
  AND (storage.foldername(name))[1] = 'requests'
);
