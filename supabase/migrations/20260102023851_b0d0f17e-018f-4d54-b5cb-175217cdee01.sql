-- Extend organizations table for integration settings
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS gofan_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS gofan_school_id text,
ADD COLUMN IF NOT EXISTS gofan_school_url_override text,
ADD COLUMN IF NOT EXISTS finalforms_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS finalforms_subdomain_override text;

-- Create ticketing_provider enum
DO $$ BEGIN
  CREATE TYPE public.ticketing_provider_type AS ENUM ('none', 'gofan');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create forms_provider enum
DO $$ BEGIN
  CREATE TYPE public.forms_provider_type AS ENUM ('none', 'finalforms');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add integration fields to events table
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS ticketing_provider public.ticketing_provider_type DEFAULT 'none',
ADD COLUMN IF NOT EXISTS gofan_event_url text,
ADD COLUMN IF NOT EXISTS forms_provider public.forms_provider_type DEFAULT 'none';

-- Create integration_audit_log table
CREATE TABLE IF NOT EXISTS public.integration_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  action text NOT NULL,
  integration_type text NOT NULL,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on integration_audit_log
ALTER TABLE public.integration_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for integration_audit_log
CREATE POLICY "Admins can view integration audit logs"
ON public.integration_audit_log FOR SELECT
USING (
  has_role(auth.uid(), 'system_admin') OR 
  has_role(auth.uid(), 'org_admin')
);

CREATE POLICY "System can insert integration audit logs"
ON public.integration_audit_log FOR INSERT
WITH CHECK (true);

-- Create AI roster suggestions table
CREATE TABLE IF NOT EXISTS public.ai_roster_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  team_member_id uuid REFERENCES public.team_members(id) ON DELETE CASCADE NOT NULL,
  suggestion_type text NOT NULL,
  suggested_position_id uuid REFERENCES public.sport_positions(id),
  suggested_line_group text,
  confidence_score numeric(3,2),
  reasoning text,
  status text DEFAULT 'pending',
  reviewed_by_user_id uuid,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on ai_roster_suggestions
ALTER TABLE public.ai_roster_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS policies for ai_roster_suggestions
CREATE POLICY "Coaches can view AI suggestions for their teams"
ON public.ai_roster_suggestions FOR SELECT
USING (
  has_role(auth.uid(), 'system_admin') OR 
  has_role(auth.uid(), 'org_admin') OR
  has_role(auth.uid(), 'coach') OR
  has_role(auth.uid(), 'head_coach')
);

CREATE POLICY "Coaches can manage AI suggestions"
ON public.ai_roster_suggestions FOR ALL
USING (
  has_role(auth.uid(), 'system_admin') OR 
  has_role(auth.uid(), 'org_admin') OR
  has_role(auth.uid(), 'coach') OR
  has_role(auth.uid(), 'head_coach')
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_ai_roster_suggestions_team ON public.ai_roster_suggestions(team_id);
CREATE INDEX IF NOT EXISTS idx_integration_audit_log_org ON public.integration_audit_log(organization_id);