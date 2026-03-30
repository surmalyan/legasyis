
-- Table for linking users as family connections
CREATE TABLE public.family_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL,
  target_email TEXT NOT NULL,
  target_user_id UUID,
  relationship TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.family_connections ENABLE ROW LEVEL SECURITY;

-- Requester can see their own requests
CREATE POLICY "Users can view own sent connections"
ON public.family_connections FOR SELECT TO authenticated
USING (auth.uid() = requester_id);

-- Target user can see connections addressed to them
CREATE POLICY "Users can view incoming connections"
ON public.family_connections FOR SELECT TO authenticated
USING (auth.uid() = target_user_id);

-- Users can create connection requests
CREATE POLICY "Users can create connections"
ON public.family_connections FOR INSERT TO authenticated
WITH CHECK (auth.uid() = requester_id);

-- Target user can update status (accept/reject)
CREATE POLICY "Target can update connection status"
ON public.family_connections FOR UPDATE TO authenticated
USING (auth.uid() = target_user_id);

-- Requester can delete their own pending requests
CREATE POLICY "Requester can delete own connections"
ON public.family_connections FOR DELETE TO authenticated
USING (auth.uid() = requester_id);
