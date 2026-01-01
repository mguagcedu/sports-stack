-- Create equipment_access_requests table for delegation workflow
CREATE TABLE IF NOT EXISTS public.equipment_access_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  requested_role text NOT NULL DEFAULT 'equipment_handler',
  status text NOT NULL DEFAULT 'pending',
  justification text,
  approved_by_user_id uuid,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT valid_equipment_role CHECK (requested_role IN ('equipment_manager', 'equipment_handler', 'student_manager'))
);

-- Create equipment_delegations table for tracking who can manage equipment
CREATE TABLE IF NOT EXISTS public.equipment_delegations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  delegated_by_user_id uuid NOT NULL,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  delegation_type text NOT NULL DEFAULT 'equipment_handler',
  is_active boolean DEFAULT true,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  revoked_at timestamp with time zone,
  revoked_by_user_id uuid,
  CONSTRAINT valid_delegation_type CHECK (delegation_type IN ('equipment_manager', 'equipment_handler', 'student_manager'))
);

-- Enable RLS
ALTER TABLE public.equipment_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_delegations ENABLE ROW LEVEL SECURITY;

-- RLS for equipment_access_requests
CREATE POLICY "Users can view their own requests" 
ON public.equipment_access_requests 
FOR SELECT 
USING (user_id = auth.uid() OR 
  has_role(auth.uid(), 'system_admin'::app_role) OR 
  has_role(auth.uid(), 'org_admin'::app_role) OR 
  has_role(auth.uid(), 'coach'::app_role) OR 
  has_role(auth.uid(), 'athletic_director'::app_role));

CREATE POLICY "Users can create their own access requests" 
ON public.equipment_access_requests 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Coaches and admins can update access requests" 
ON public.equipment_access_requests 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'system_admin'::app_role) OR 
  has_role(auth.uid(), 'org_admin'::app_role) OR 
  has_role(auth.uid(), 'coach'::app_role) OR 
  has_role(auth.uid(), 'athletic_director'::app_role)
);

-- RLS for equipment_delegations
CREATE POLICY "Users can view delegations for their teams" 
ON public.equipment_delegations 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  delegated_by_user_id = auth.uid() OR
  has_role(auth.uid(), 'system_admin'::app_role) OR 
  has_role(auth.uid(), 'org_admin'::app_role) OR 
  has_role(auth.uid(), 'coach'::app_role) OR 
  has_role(auth.uid(), 'athletic_director'::app_role)
);

CREATE POLICY "Coaches and admins can create delegations" 
ON public.equipment_delegations 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'system_admin'::app_role) OR 
  has_role(auth.uid(), 'org_admin'::app_role) OR 
  has_role(auth.uid(), 'coach'::app_role) OR 
  has_role(auth.uid(), 'athletic_director'::app_role)
);

CREATE POLICY "Coaches and admins can update delegations" 
ON public.equipment_delegations 
FOR UPDATE 
USING (
  delegated_by_user_id = auth.uid() OR
  has_role(auth.uid(), 'system_admin'::app_role) OR 
  has_role(auth.uid(), 'org_admin'::app_role) OR 
  has_role(auth.uid(), 'coach'::app_role)
);

-- Create user_preferences table for settings
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  theme text DEFAULT 'system',
  language text DEFAULT 'en',
  timezone text DEFAULT 'America/New_York',
  date_format text DEFAULT 'MM/dd/yyyy',
  notifications_email boolean DEFAULT true,
  notifications_push boolean DEFAULT false,
  notifications_sms boolean DEFAULT false,
  email_registrations boolean DEFAULT true,
  email_payments boolean DEFAULT true,
  email_events boolean DEFAULT true,
  email_equipment boolean DEFAULT true,
  email_team_updates boolean DEFAULT true,
  compact_mode boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for user_preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences" 
ON public.user_preferences 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own preferences" 
ON public.user_preferences 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own preferences" 
ON public.user_preferences 
FOR UPDATE 
USING (user_id = auth.uid());

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_equipment_access_requests_user ON public.equipment_access_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_equipment_access_requests_status ON public.equipment_access_requests(status);
CREATE INDEX IF NOT EXISTS idx_equipment_delegations_user ON public.equipment_delegations(user_id);
CREATE INDEX IF NOT EXISTS idx_equipment_delegations_delegator ON public.equipment_delegations(delegated_by_user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON public.user_preferences(user_id);