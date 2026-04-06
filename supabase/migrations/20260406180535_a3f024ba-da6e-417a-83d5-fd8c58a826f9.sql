
ALTER TABLE public.profiles ADD COLUMN last_active_at timestamptz DEFAULT now();

-- Update existing rows
UPDATE public.profiles SET last_active_at = updated_at;
