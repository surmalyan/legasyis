
-- Memory Circles: the main circle entity
CREATE TABLE public.memory_circles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  person_name TEXT NOT NULL,
  person_birth_year INTEGER,
  person_death_year INTEGER,
  person_photo_url TEXT,
  description TEXT,
  invite_code TEXT NOT NULL DEFAULT encode(gen_random_bytes(12), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.memory_circles ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX idx_memory_circles_invite_code ON public.memory_circles(invite_code);

-- Circle Members
CREATE TYPE public.circle_role AS ENUM ('family', 'friend', 'colleague');

CREATE TABLE public.circle_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  circle_id UUID NOT NULL REFERENCES public.memory_circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  display_name TEXT,
  role_label circle_role NOT NULL DEFAULT 'friend',
  status TEXT NOT NULL DEFAULT 'pending',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.circle_members ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX idx_circle_members_unique ON public.circle_members(circle_id, user_id);

-- Circle Memories (contributions)
CREATE TABLE public.circle_memories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  circle_id UUID NOT NULL REFERENCES public.memory_circles(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  content TEXT,
  photo_urls TEXT[],
  voice_note_path TEXT,
  question TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.circle_memories ENABLE ROW LEVEL SECURITY;

-- Helper: check if user is member of circle
CREATE OR REPLACE FUNCTION public.is_circle_member(_user_id UUID, _circle_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.circle_members
    WHERE user_id = _user_id AND circle_id = _circle_id AND status = 'active'
  ) OR EXISTS (
    SELECT 1 FROM public.memory_circles
    WHERE id = _circle_id AND creator_id = _user_id
  )
$$;

-- RLS: memory_circles
CREATE POLICY "Creator can manage own circles"
  ON public.memory_circles FOR ALL
  TO authenticated
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Members can view their circles"
  ON public.memory_circles FOR SELECT
  TO authenticated
  USING (public.is_circle_member(auth.uid(), id));

-- RLS: circle_members
CREATE POLICY "Creator can manage members"
  ON public.circle_members FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.memory_circles WHERE id = circle_id AND creator_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.memory_circles WHERE id = circle_id AND creator_id = auth.uid()
  ));

CREATE POLICY "Members can view fellow members"
  ON public.circle_members FOR SELECT
  TO authenticated
  USING (public.is_circle_member(auth.uid(), circle_id));

CREATE POLICY "Users can join circles"
  ON public.circle_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members can update own membership"
  ON public.circle_members FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS: circle_memories
CREATE POLICY "Members can add memories"
  ON public.circle_memories FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND public.is_circle_member(auth.uid(), circle_id)
  );

CREATE POLICY "Members can view circle memories"
  ON public.circle_memories FOR SELECT
  TO authenticated
  USING (public.is_circle_member(auth.uid(), circle_id));

CREATE POLICY "Author or creator can delete memories"
  ON public.circle_memories FOR DELETE
  TO authenticated
  USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM public.memory_circles WHERE id = circle_id AND creator_id = auth.uid()
    )
  );

-- Allow public access to circles by invite code (for join flow)
CREATE POLICY "Anyone can view circle by invite code"
  ON public.memory_circles FOR SELECT
  TO authenticated
  USING (true);
