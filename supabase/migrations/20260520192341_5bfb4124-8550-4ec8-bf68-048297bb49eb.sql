-- Plan invites: MAX users can invite up to 2 people who inherit MAX features
CREATE TABLE public.plan_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL,
  invitee_email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_user_id, invitee_email)
);

CREATE INDEX idx_plan_invites_owner ON public.plan_invites(owner_user_id);
CREATE INDEX idx_plan_invites_email ON public.plan_invites(lower(invitee_email));

ALTER TABLE public.plan_invites ENABLE ROW LEVEL SECURITY;

-- Owner can see, create, and delete their own invites
CREATE POLICY "Owners can view their invites"
  ON public.plan_invites FOR SELECT
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Owners can create their invites"
  ON public.plan_invites FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Owners can delete their invites"
  ON public.plan_invites FOR DELETE
  USING (auth.uid() = owner_user_id);

-- Invitee can see invites pointing to their email
CREATE POLICY "Invitees can view invites for their email"
  ON public.plan_invites FOR SELECT
  USING (lower(invitee_email) = lower((auth.jwt() ->> 'email')));