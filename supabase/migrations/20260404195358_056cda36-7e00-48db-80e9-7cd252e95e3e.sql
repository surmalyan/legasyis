
-- Function to check if two users have a confirmed connection
CREATE OR REPLACE FUNCTION public.has_confirmed_connection(_user_id uuid, _other_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.family_connections
    WHERE status = 'confirmed'
    AND (
      (requester_id = _user_id AND target_user_id = _other_user_id)
      OR (requester_id = _other_user_id AND target_user_id = _user_id)
    )
  )
$$;

-- Allow viewing family members of connected users
CREATE POLICY "Users can view connected users family members"
ON public.family_members
FOR SELECT
TO authenticated
USING (
  public.has_confirmed_connection(auth.uid(), user_id)
);
