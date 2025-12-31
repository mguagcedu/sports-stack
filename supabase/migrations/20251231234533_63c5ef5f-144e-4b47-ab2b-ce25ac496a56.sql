-- Create team_invitations table for join codes, links, and pending approvals
CREATE TABLE public.team_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  invite_code VARCHAR(20) NOT NULL UNIQUE,
  invite_type VARCHAR(20) NOT NULL DEFAULT 'link' CHECK (invite_type IN ('link', 'qr', 'code')),
  target_role VARCHAR(30) NOT NULL DEFAULT 'athlete' CHECK (target_role IN ('coach', 'assistant_coach', 'team_manager', 'athlete', 'parent')),
  max_uses INTEGER DEFAULT NULL,
  uses_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pending_approvals table for cascading approval workflow
CREATE TABLE public.pending_approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  requested_role VARCHAR(30) NOT NULL,
  invitation_id UUID REFERENCES public.team_invitations(id) ON DELETE SET NULL,
  parent_user_id UUID DEFAULT NULL,
  child_user_id UUID DEFAULT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  reviewed_by UUID DEFAULT NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  rejection_reason TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_approvals ENABLE ROW LEVEL SECURITY;

-- RLS for team_invitations
CREATE POLICY "Team coaches and admins can manage invitations"
ON public.team_invitations
FOR ALL
USING (
  has_role(auth.uid(), 'system_admin') OR
  has_role(auth.uid(), 'org_admin') OR
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.team_id = team_invitations.team_id
      AND ur.role IN ('coach', 'assistant_coach', 'team_manager')
  )
);

CREATE POLICY "Anyone can view active invitations by code"
ON public.team_invitations
FOR SELECT
USING (is_active = true);

-- RLS for pending_approvals
CREATE POLICY "Users can view their own pending approvals"
ON public.pending_approvals
FOR SELECT
USING (
  user_id = auth.uid() OR
  parent_user_id = auth.uid() OR
  has_role(auth.uid(), 'system_admin') OR
  has_role(auth.uid(), 'org_admin') OR
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.team_id = pending_approvals.team_id
      AND ur.role IN ('coach', 'assistant_coach', 'team_manager')
  )
);

CREATE POLICY "Users can create their own approval requests"
ON public.pending_approvals
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Coaches and admins can manage approvals"
ON public.pending_approvals
FOR UPDATE
USING (
  has_role(auth.uid(), 'system_admin') OR
  has_role(auth.uid(), 'org_admin') OR
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.team_id = pending_approvals.team_id
      AND ur.role IN ('coach', 'assistant_coach', 'team_manager')
  )
);

-- Create indexes for performance
CREATE INDEX idx_team_invitations_code ON public.team_invitations(invite_code);
CREATE INDEX idx_team_invitations_team ON public.team_invitations(team_id);
CREATE INDEX idx_pending_approvals_user ON public.pending_approvals(user_id);
CREATE INDEX idx_pending_approvals_team ON public.pending_approvals(team_id);
CREATE INDEX idx_pending_approvals_status ON public.pending_approvals(status);

-- Triggers for updated_at
CREATE TRIGGER update_team_invitations_updated_at
  BEFORE UPDATE ON public.team_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pending_approvals_updated_at
  BEFORE UPDATE ON public.pending_approvals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();