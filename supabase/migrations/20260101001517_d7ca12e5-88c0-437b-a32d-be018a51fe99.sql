-- =============================================
-- National High School Sports Governance Tables
-- =============================================

-- 1. Sport Types Reference Table (67 standardized sports)
CREATE TABLE public.sport_types (
  sport_id UUID PRIMARY KEY,
  sport_code TEXT UNIQUE NOT NULL,
  sport_name TEXT NOT NULL,
  season TEXT NOT NULL,
  format TEXT NOT NULL,
  gender TEXT NOT NULL,
  maturity TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for lookups
CREATE INDEX idx_sport_types_code ON public.sport_types(sport_code);
CREATE INDEX idx_sport_types_season ON public.sport_types(season);
CREATE INDEX idx_sport_types_gender ON public.sport_types(gender);

-- 2. State Athletic Associations (51 = 50 states + DC)
CREATE TABLE public.state_athletic_associations (
  state_association_id UUID PRIMARY KEY,
  state_code TEXT UNIQUE NOT NULL,
  state_name TEXT NOT NULL,
  association_name TEXT NOT NULL,
  association_abbrev TEXT NOT NULL,
  website TEXT,
  nfhs_status TEXT DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_state_associations_code ON public.state_athletic_associations(state_code);

-- 3. State Sport Sanction Matrix (state x sport combinations)
CREATE TABLE public.state_sport_sanction (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_code TEXT NOT NULL,
  sport_code TEXT NOT NULL,
  sanctioned BOOLEAN,
  rules_url TEXT,
  season_override TEXT,
  last_verified_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(state_code, sport_code)
);

CREATE INDEX idx_state_sport_sanction_state ON public.state_sport_sanction(state_code);
CREATE INDEX idx_state_sport_sanction_sport ON public.state_sport_sanction(sport_code);
CREATE INDEX idx_state_sport_sanction_sanctioned ON public.state_sport_sanction(sanctioned);

-- 4. District Sport Override (allows districts to override state sanctions)
CREATE TABLE public.district_sport_override (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id UUID NOT NULL REFERENCES public.districts(id) ON DELETE CASCADE,
  sport_code TEXT NOT NULL,
  sanctioned_override BOOLEAN,
  rules_url_override TEXT,
  last_verified_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(district_id, sport_code)
);

CREATE INDEX idx_district_sport_override_district ON public.district_sport_override(district_id);
CREATE INDEX idx_district_sport_override_sport ON public.district_sport_override(sport_code);

-- 5. Subscription Features Table (for tier gating)
CREATE TABLE public.subscription_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier subscription_tier NOT NULL,
  feature_key TEXT NOT NULL,
  feature_name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tier, feature_key)
);

-- Enable RLS on all tables
ALTER TABLE public.sport_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.state_athletic_associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.state_sport_sanction ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.district_sport_override ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_features ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sport_types (read-only for authenticated users)
CREATE POLICY "Authenticated users can view sport types"
ON public.sport_types FOR SELECT
USING (true);

CREATE POLICY "System admins can manage sport types"
ON public.sport_types FOR ALL
USING (has_role(auth.uid(), 'system_admin'));

-- RLS Policies for state_athletic_associations (read-only for authenticated)
CREATE POLICY "Authenticated users can view state associations"
ON public.state_athletic_associations FOR SELECT
USING (true);

CREATE POLICY "System admins can manage state associations"
ON public.state_athletic_associations FOR ALL
USING (has_role(auth.uid(), 'system_admin'));

-- RLS Policies for state_sport_sanction
CREATE POLICY "Authenticated users can view state sport sanctions"
ON public.state_sport_sanction FOR SELECT
USING (true);

CREATE POLICY "System admins can manage state sport sanctions"
ON public.state_sport_sanction FOR ALL
USING (has_role(auth.uid(), 'system_admin'));

-- RLS Policies for district_sport_override
CREATE POLICY "Users can view district overrides for their districts"
ON public.district_sport_override FOR SELECT
USING (
  has_role(auth.uid(), 'system_admin') OR
  has_district_role(auth.uid(), district_id, ARRAY['district_owner', 'district_admin', 'district_viewer']::app_role[])
);

CREATE POLICY "District admins can manage their district overrides"
ON public.district_sport_override FOR ALL
USING (
  has_role(auth.uid(), 'system_admin') OR
  has_district_role(auth.uid(), district_id, ARRAY['district_owner', 'district_admin']::app_role[])
);

-- RLS Policies for subscription_features
CREATE POLICY "Authenticated users can view subscription features"
ON public.subscription_features FOR SELECT
USING (true);

CREATE POLICY "System admins can manage subscription features"
ON public.subscription_features FOR ALL
USING (has_role(auth.uid(), 'system_admin'));

-- Insert default subscription features for tier gating
INSERT INTO public.subscription_features (tier, feature_key, feature_name, description, enabled) VALUES
-- Free tier features
('free', 'manual_schedules', 'Manual Schedules', 'Create and manage schedules manually', true),
('free', 'basic_teams', 'Basic Teams', 'Create and manage up to 3 teams', true),
('free', 'public_viewing', 'Public Viewing', 'View public team and event information', true),
-- Starter tier features
('starter', 'manual_schedules', 'Manual Schedules', 'Create and manage schedules manually', true),
('starter', 'basic_teams', 'Basic Teams', 'Create and manage up to 10 teams', true),
('starter', 'qr_invites', 'QR Invitations', 'Generate QR codes for team invitations', true),
('starter', 'notifications', 'Notifications', 'Real-time notifications for schedule changes', true),
-- School tier features
('school', 'state_sanctioning', 'State Sanctioning', 'Access state sport sanctioning data', true),
('school', 'qr_invites', 'QR Invitations', 'Generate QR codes for team invitations', true),
('school', 'notifications', 'Notifications', 'Real-time notifications', true),
('school', 'budgets', 'Budget Tracking', 'Track team and event budgets', true),
('school', 'gate_revenue', 'Gate Revenue', 'Track ticket sales and gate revenue', true),
('school', 'unlimited_teams', 'Unlimited Teams', 'Create unlimited teams', true),
-- District tier features
('district', 'district_overrides', 'District Overrides', 'Override state sport sanctions at district level', true),
('district', 'auto_sync', 'Schedule Auto-Sync', 'Automatically sync schedules from external sources', true),
('district', 'ai_scheduling', 'AI Scheduling', 'AI-powered conflict detection and resolution', true),
('district', 'logistics', 'Transportation Logistics', 'Manage transportation and facilities', true),
('district', 'officials', 'Officials Management', 'Manage referee and official assignments', true),
('district', 'injury_tracking', 'Injury Tracking', 'Track athletic trainer workflows and injuries', true),
('district', 'branding_packs', 'State Branding Packs', 'Access state-specific branding assets', true),
('district', 'audit_exports', 'Compliance Audit Exports', 'Export compliance reports', true),
-- Enterprise tier features (all features)
('enterprise', 'all_features', 'All Features', 'Access to all platform features', true),
('enterprise', 'api_access', 'API Access', 'Full API access for integrations', true),
('enterprise', 'custom_branding', 'Custom Branding', 'Fully customizable branding', true),
('enterprise', 'priority_support', 'Priority Support', '24/7 priority support', true);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER set_sport_types_updated_at
BEFORE UPDATE ON public.sport_types
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_state_associations_updated_at
BEFORE UPDATE ON public.state_athletic_associations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_state_sport_sanction_updated_at
BEFORE UPDATE ON public.state_sport_sanction
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_district_sport_override_updated_at
BEFORE UPDATE ON public.district_sport_override
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Add function to check if a feature is available for a subscription tier
CREATE OR REPLACE FUNCTION public.has_feature(_tier subscription_tier, _feature_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscription_features
    WHERE tier = _tier
      AND feature_key = _feature_key
      AND enabled = true
  ) OR _tier = 'enterprise'
$$;

-- Add function to get organization's available features
CREATE OR REPLACE FUNCTION public.get_org_features(_org_id uuid)
RETURNS SETOF text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT sf.feature_key
  FROM public.organizations o
  JOIN public.subscription_features sf ON sf.tier = o.subscription_tier
  WHERE o.id = _org_id AND sf.enabled = true
$$;