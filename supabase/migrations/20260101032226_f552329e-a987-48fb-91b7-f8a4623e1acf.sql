-- Create enum types for providers and eligibility status
CREATE TYPE public.ticketing_provider_type AS ENUM ('none', 'gofan', 'internal', 'other');
CREATE TYPE public.forms_provider_type AS ENUM ('none', 'finalforms', 'other');
CREATE TYPE public.eligibility_status_type AS ENUM ('unknown', 'pending', 'cleared', 'not_cleared');

-- Add integration columns to schools table
ALTER TABLE public.schools 
  ADD COLUMN finalforms_portal_url text,
  ADD COLUMN gofan_school_url text,
  ADD COLUMN finalforms_enabled boolean DEFAULT false,
  ADD COLUMN gofan_enabled boolean DEFAULT false;

-- Add integration columns to districts table
ALTER TABLE public.districts 
  ADD COLUMN finalforms_portal_url text,
  ADD COLUMN gofan_school_url text,
  ADD COLUMN finalforms_enabled boolean DEFAULT false,
  ADD COLUMN gofan_enabled boolean DEFAULT false;

-- Add ticketing/forms columns to events table
ALTER TABLE public.events 
  ADD COLUMN gofan_event_url text,
  ADD COLUMN ticketing_provider public.ticketing_provider_type DEFAULT 'none',
  ADD COLUMN forms_provider public.forms_provider_type DEFAULT 'none';

-- Add eligibility tracking columns to team_members table
ALTER TABLE public.team_members 
  ADD COLUMN eligibility_status public.eligibility_status_type DEFAULT 'unknown',
  ADD COLUMN eligibility_last_verified_at timestamptz,
  ADD COLUMN eligibility_verified_by_user_id uuid,
  ADD COLUMN eligibility_notes text;

-- Create eligibility updates audit table
CREATE TABLE public.eligibility_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id uuid NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  old_status public.eligibility_status_type,
  new_status public.eligibility_status_type NOT NULL,
  reason text,
  updated_by_user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on eligibility_updates
ALTER TABLE public.eligibility_updates ENABLE ROW LEVEL SECURITY;

-- RLS: Coaches and admins can view eligibility updates (no parents)
CREATE POLICY "Coaches and admins can view eligibility updates"
  ON public.eligibility_updates FOR SELECT
  USING (
    has_role(auth.uid(), 'system_admin'::app_role) OR
    has_role(auth.uid(), 'org_admin'::app_role) OR
    has_role(auth.uid(), 'coach'::app_role) OR
    has_role(auth.uid(), 'assistant_coach'::app_role) OR
    has_role(auth.uid(), 'athletic_director'::app_role)
  );

-- RLS: Authorized users can insert eligibility updates
CREATE POLICY "Coaches and admins can insert eligibility updates"
  ON public.eligibility_updates FOR INSERT
  WITH CHECK (
    updated_by_user_id = auth.uid() AND (
      has_role(auth.uid(), 'system_admin'::app_role) OR
      has_role(auth.uid(), 'org_admin'::app_role) OR
      has_role(auth.uid(), 'coach'::app_role) OR
      has_role(auth.uid(), 'assistant_coach'::app_role) OR
      has_role(auth.uid(), 'athletic_director'::app_role)
    )
  );

-- Add feature flags for integrations
INSERT INTO public.subscription_features (tier, feature_key, feature_name, description, enabled) VALUES
  ('starter', 'integration_finalforms', 'FinalForms Integration', 'Link to FinalForms portal for eligibility and forms', true),
  ('starter', 'integration_gofan', 'GoFan Integration', 'Link to GoFan for ticket sales', true),
  ('school', 'integration_finalforms', 'FinalForms Integration', 'Link to FinalForms portal for eligibility and forms', true),
  ('school', 'integration_gofan', 'GoFan Integration', 'Link to GoFan for ticket sales', true),
  ('district', 'integration_finalforms', 'FinalForms Integration', 'Link to FinalForms portal for eligibility and forms', true),
  ('district', 'integration_gofan', 'GoFan Integration', 'Link to GoFan for ticket sales', true),
  ('enterprise', 'integration_finalforms', 'FinalForms Integration', 'Link to FinalForms portal for eligibility and forms', true),
  ('enterprise', 'integration_gofan', 'GoFan Integration', 'Link to GoFan for ticket sales', true);