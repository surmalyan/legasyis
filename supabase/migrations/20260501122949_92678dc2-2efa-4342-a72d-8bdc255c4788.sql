-- Create public bucket for memory photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('memory-photos', 'memory-photos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for memory-photos bucket
CREATE POLICY "Memory photos are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'memory-photos');

CREATE POLICY "Authenticated users can upload memory photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'memory-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own memory photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'memory-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow circle members to upload voice notes for memories
CREATE POLICY "Circle members can upload voice notes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'voice-notes'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add life_period column to anchor memories to a year (for timeline view)
ALTER TABLE public.circle_memories
ADD COLUMN IF NOT EXISTS life_year integer;

-- Add category column to group memories by chapter
ALTER TABLE public.circle_memories
ADD COLUMN IF NOT EXISTS category text;