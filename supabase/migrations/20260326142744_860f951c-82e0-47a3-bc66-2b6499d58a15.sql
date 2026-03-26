
CREATE TABLE public.voice_recordings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  storage_path TEXT NOT NULL,
  duration_seconds NUMERIC,
  field_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.voice_recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own recordings" ON public.voice_recordings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own recordings" ON public.voice_recordings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recordings" ON public.voice_recordings
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
