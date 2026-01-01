-- Create player_praises table for coach recognition/praise
CREATE TABLE public.player_praises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  praise_type TEXT NOT NULL,
  notes TEXT,
  is_public BOOLEAN DEFAULT true,
  given_by_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.player_praises ENABLE ROW LEVEL SECURITY;

-- Coaches and admins can manage praises
CREATE POLICY "Coaches can manage praises" 
ON public.player_praises 
FOR ALL 
USING (
  has_role(auth.uid(), 'system_admin'::app_role) OR 
  has_role(auth.uid(), 'org_admin'::app_role) OR 
  has_role(auth.uid(), 'coach'::app_role) OR 
  has_role(auth.uid(), 'head_coach'::app_role) OR
  has_role(auth.uid(), 'athletic_director'::app_role)
);

-- Athletes can view praises for their team membership
CREATE POLICY "Athletes can view their praises" 
ON public.player_praises 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM team_members tm 
    WHERE tm.id = player_praises.team_member_id 
    AND tm.user_id = auth.uid()
  ) OR is_public = true
);

-- Create index for faster lookups
CREATE INDEX idx_player_praises_team ON public.player_praises(team_id);
CREATE INDEX idx_player_praises_member ON public.player_praises(team_member_id);