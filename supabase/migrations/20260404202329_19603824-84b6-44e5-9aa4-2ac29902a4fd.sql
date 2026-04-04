-- Tighten family_connections UPDATE policy to restrict which fields can change
DROP POLICY IF EXISTS "Target can update connection status" ON public.family_connections;
CREATE POLICY "Target can update connection status"
  ON public.family_connections
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = target_user_id)
  WITH CHECK (
    auth.uid() = target_user_id
    AND status IN ('confirmed', 'rejected')
  );