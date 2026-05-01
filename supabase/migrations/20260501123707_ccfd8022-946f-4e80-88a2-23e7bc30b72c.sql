-- Helper to keep updated_at fresh (idempotent)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============ INVITATIONS ============
CREATE TABLE public.circle_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  circle_id UUID NOT NULL REFERENCES public.memory_circles(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL,
  invitee_email TEXT NOT NULL,
  suggested_role public.circle_role NOT NULL DEFAULT 'friend',
  personal_message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  last_reminder_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_circle_invitations_circle ON public.circle_invitations(circle_id);
CREATE INDEX idx_circle_invitations_email ON public.circle_invitations(lower(invitee_email));

ALTER TABLE public.circle_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inviter can manage invitations"
ON public.circle_invitations FOR ALL
TO authenticated
USING (auth.uid() = inviter_id)
WITH CHECK (auth.uid() = inviter_id);

CREATE POLICY "Circle creator can view invitations"
ON public.circle_invitations FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.memory_circles
  WHERE memory_circles.id = circle_invitations.circle_id
    AND memory_circles.creator_id = auth.uid()
));

CREATE TRIGGER update_circle_invitations_updated_at
BEFORE UPDATE ON public.circle_invitations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  circle_id UUID REFERENCES public.memory_circles(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_unread
  ON public.notifications(user_id, created_at DESC)
  WHERE read_at IS NULL;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own notifications"
ON public.notifications FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============ TRIGGER: notify creator when member joins ============
CREATE OR REPLACE FUNCTION public.notify_circle_creator_on_join()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_creator UUID;
  v_person TEXT;
BEGIN
  IF NEW.status <> 'active' THEN
    RETURN NEW;
  END IF;

  SELECT creator_id, person_name INTO v_creator, v_person
  FROM public.memory_circles WHERE id = NEW.circle_id;

  IF v_creator IS NULL OR v_creator = NEW.user_id THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (user_id, type, title, body, link, circle_id)
  VALUES (
    v_creator,
    'member_joined',
    'New contributor joined',
    COALESCE(NEW.display_name, 'Someone') || ' joined the Book of Memory for ' || v_person,
    '/memory-circle/' || NEW.circle_id::text,
    NEW.circle_id
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_creator_on_join
AFTER INSERT ON public.circle_members
FOR EACH ROW
EXECUTE FUNCTION public.notify_circle_creator_on_join();

-- ============ TRIGGER: notify creator on new memory ============
CREATE OR REPLACE FUNCTION public.notify_circle_creator_on_memory()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_creator UUID;
  v_person TEXT;
  v_author TEXT;
BEGIN
  SELECT creator_id, person_name INTO v_creator, v_person
  FROM public.memory_circles WHERE id = NEW.circle_id;

  IF v_creator IS NULL OR v_creator = NEW.author_id THEN
    RETURN NEW;
  END IF;

  SELECT display_name INTO v_author FROM public.circle_members
  WHERE circle_id = NEW.circle_id AND user_id = NEW.author_id LIMIT 1;

  INSERT INTO public.notifications (user_id, type, title, body, link, circle_id)
  VALUES (
    v_creator,
    'memory_added',
    'New memory shared',
    COALESCE(v_author, 'A contributor') || ' added a memory about ' || v_person,
    '/memory-circle/' || NEW.circle_id::text,
    NEW.circle_id
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_creator_on_memory
AFTER INSERT ON public.circle_memories
FOR EACH ROW
EXECUTE FUNCTION public.notify_circle_creator_on_memory();

-- ============ RPC: send reminder to silent member ============
CREATE OR REPLACE FUNCTION public.remind_silent_contributor(
  _circle_id UUID,
  _member_user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_creator UUID;
  v_person TEXT;
  v_member_count INT;
  v_notif_id UUID;
BEGIN
  SELECT creator_id, person_name INTO v_creator, v_person
  FROM public.memory_circles WHERE id = _circle_id;

  IF v_creator IS NULL OR v_creator <> auth.uid() THEN
    RAISE EXCEPTION 'Only the circle creator can send reminders';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.circle_members
    WHERE circle_id = _circle_id AND user_id = _member_user_id AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'User is not an active member of this circle';
  END IF;

  SELECT COUNT(*) INTO v_member_count FROM public.circle_memories
  WHERE circle_id = _circle_id AND author_id = _member_user_id;

  IF v_member_count > 0 THEN
    RAISE EXCEPTION 'This member has already contributed';
  END IF;

  INSERT INTO public.notifications (user_id, type, title, body, link, circle_id)
  VALUES (
    _member_user_id,
    'reminder',
    'A gentle reminder',
    'Your memories about ' || v_person || ' are waiting. Even one story would mean a lot.',
    '/memory-circle/' || _circle_id::text,
    _circle_id
  ) RETURNING id INTO v_notif_id;

  RETURN v_notif_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.remind_silent_contributor(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.remind_silent_contributor(UUID, UUID) TO authenticated;

-- ============ RPC: create email invitation ============
CREATE OR REPLACE FUNCTION public.create_circle_invitation(
  _circle_id UUID,
  _email TEXT,
  _role public.circle_role,
  _message TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_creator UUID;
  v_id UUID;
BEGIN
  SELECT creator_id INTO v_creator FROM public.memory_circles WHERE id = _circle_id;

  IF v_creator IS NULL OR v_creator <> auth.uid() THEN
    RAISE EXCEPTION 'Only the circle creator can invite';
  END IF;

  IF _email IS NULL OR length(trim(_email)) = 0 THEN
    RAISE EXCEPTION 'Email is required';
  END IF;

  INSERT INTO public.circle_invitations (
    circle_id, inviter_id, invitee_email, suggested_role, personal_message
  ) VALUES (
    _circle_id, auth.uid(), lower(trim(_email)), _role, _message
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_circle_invitation(UUID, TEXT, public.circle_role, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_circle_invitation(UUID, TEXT, public.circle_role, TEXT) TO authenticated;