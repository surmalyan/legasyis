ALTER TABLE public.circle_memories
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS life_period text;

CREATE INDEX IF NOT EXISTS idx_circle_memories_period ON public.circle_memories(circle_id, life_period);