
-- 1. Extend profiles with Safe Haven fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_preserved BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS preserved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS preserved_reason TEXT, -- 'milestone' | 'legacy_tier'
  ADD COLUMN IF NOT EXISTS legacy_tier BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS digital_heir_email TEXT,
  ADD COLUMN IF NOT EXISTS digital_heir_user_id UUID,
  ADD COLUMN IF NOT EXISTS digital_heir_set_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_digital_heir_email ON public.profiles (lower(digital_heir_email));

-- 2. Helper: is a user's content preserved? (security definer, callable from RLS)
CREATE OR REPLACE FUNCTION public.is_user_preserved(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT is_preserved FROM public.profiles WHERE user_id = _user_id LIMIT 1),
    false
  );
$$;

-- 3. Helper: is the current viewer the designated Digital Heir of a user?
CREATE OR REPLACE FUNCTION public.is_digital_heir_of(_owner_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = _owner_id
      AND (
        p.digital_heir_user_id = auth.uid()
        OR (
          p.digital_heir_email IS NOT NULL
          AND lower(p.digital_heir_email) = lower((SELECT email FROM auth.users WHERE id = auth.uid()))
        )
      )
  );
$$;

-- 4. Re-evaluate preserved status for a user (callable by anyone for own user, used after creating entries)
CREATE OR REPLACE FUNCTION public.refresh_preserved_status(_user_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_count INT;
  v_legacy BOOLEAN;
  v_preserved BOOLEAN;
  v_reason TEXT;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.entries WHERE user_id = _user_id;
  SELECT COALESCE(legacy_tier, false) INTO v_legacy FROM public.profiles WHERE user_id = _user_id;

  IF v_legacy THEN
    v_preserved := true;
    v_reason := 'legacy_tier';
  ELSIF v_count >= 50 THEN
    v_preserved := true;
    v_reason := 'milestone';
  ELSE
    v_preserved := false;
    v_reason := NULL;
  END IF;

  UPDATE public.profiles
  SET
    is_preserved = v_preserved,
    preserved_reason = v_reason,
    preserved_at = CASE
      WHEN v_preserved AND preserved_at IS NULL THEN now()
      WHEN NOT v_preserved THEN NULL
      ELSE preserved_at
    END,
    updated_at = now()
  WHERE user_id = _user_id;

  RETURN v_preserved;
END;
$$;

-- 5. Trigger: re-check after each new entry
CREATE OR REPLACE FUNCTION public.trg_check_preserved_after_entry()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.refresh_preserved_status(NEW.user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS entries_check_preserved ON public.entries;
CREATE TRIGGER entries_check_preserved
AFTER INSERT ON public.entries
FOR EACH ROW EXECUTE FUNCTION public.trg_check_preserved_after_entry();

-- 6. Set / update Digital Heir (and try to link an existing user)
CREATE OR REPLACE FUNCTION public.set_digital_heir(_email TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_target UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF _email IS NULL OR length(trim(_email)) = 0 THEN
    UPDATE public.profiles
    SET digital_heir_email = NULL, digital_heir_user_id = NULL, digital_heir_set_at = NULL, updated_at = now()
    WHERE user_id = auth.uid();
    RETURN;
  END IF;

  SELECT id INTO v_target FROM auth.users WHERE lower(email) = lower(trim(_email)) LIMIT 1;

  UPDATE public.profiles
  SET
    digital_heir_email = lower(trim(_email)),
    digital_heir_user_id = v_target,
    digital_heir_set_at = now(),
    updated_at = now()
  WHERE user_id = auth.uid();
END;
$$;

-- 7. Read access for preserved content — family connections + digital heir
CREATE POLICY "Confirmed family can read preserved entries"
ON public.entries FOR SELECT TO authenticated
USING (
  public.is_user_preserved(user_id)
  AND public.has_confirmed_connection(auth.uid(), user_id)
);

CREATE POLICY "Digital heir can read preserved entries"
ON public.entries FOR SELECT TO authenticated
USING (
  public.is_user_preserved(user_id)
  AND public.is_digital_heir_of(user_id)
);

-- 8. Allow viewers (heir + connected family) to read the owner's profile preserved fields
CREATE POLICY "Confirmed family can view preserved profile"
ON public.profiles FOR SELECT TO authenticated
USING (
  is_preserved = true
  AND (
    public.has_confirmed_connection(auth.uid(), user_id)
    OR public.is_digital_heir_of(user_id)
  )
);
