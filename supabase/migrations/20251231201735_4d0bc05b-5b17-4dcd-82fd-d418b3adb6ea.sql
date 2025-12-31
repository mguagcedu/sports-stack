-- ============================================
-- PHASE 1: Management Mode & Table Alterations
-- ============================================

-- Add management mode to districts
ALTER TABLE districts ADD COLUMN IF NOT EXISTS management_mode TEXT DEFAULT 'district_managed';

-- Add management mode to organizations  
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS management_mode TEXT;

-- ============================================
-- PHASE 2: Sports, Seasons, Teams
-- ============================================

-- Sports table
CREATE TABLE IF NOT EXISTS public.sports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT,
  icon TEXT,
  gender TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seasons table
CREATE TABLE IF NOT EXISTS public.seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT false,
  academic_year TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Teams table
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  sport_id UUID REFERENCES sports(id) ON DELETE CASCADE,
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level TEXT,
  gender TEXT,
  max_roster_size INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- PHASE 3: Enhanced User Roles
-- ============================================

-- Add additional context columns to user_roles
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS district_id UUID REFERENCES districts(id) ON DELETE CASCADE;
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS sport_id UUID REFERENCES sports(id) ON DELETE CASCADE;
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS season_id UUID REFERENCES seasons(id) ON DELETE CASCADE;

-- User role context for role switcher
CREATE TABLE IF NOT EXISTS public.user_role_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  active_role app_role,
  active_district_id UUID REFERENCES districts(id) ON DELETE SET NULL,
  active_school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
  active_organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  active_sport_id UUID REFERENCES sports(id) ON DELETE SET NULL,
  active_season_id UUID REFERENCES seasons(id) ON DELETE SET NULL,
  active_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- ============================================
-- PHASE 4: File Upload System
-- ============================================

-- Uploaded files metadata
CREATE TABLE IF NOT EXISTS public.uploaded_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_filename TEXT NOT NULL,
  stored_filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  raw_path TEXT,
  standard_path TEXT,
  preview_path TEXT,
  thumb_path TEXT,
  processing_status TEXT DEFAULT 'pending',
  width INTEGER,
  height INTEGER,
  metadata_stripped BOOLEAN DEFAULT false,
  upload_ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Quarantined files for security failures
CREATE TABLE IF NOT EXISTS public.quarantined_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_filename TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tenant_id UUID,
  reason TEXT NOT NULL,
  file_hash TEXT,
  file_size_bytes BIGINT,
  mime_type TEXT,
  magic_bytes TEXT,
  metadata JSONB,
  upload_ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- File access audit log
CREATE TABLE IF NOT EXISTS public.file_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES uploaded_files(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- PHASE 5: Superadmin / God Mode
-- ============================================

-- Impersonation sessions tracking
CREATE TABLE IF NOT EXISTS public.impersonation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  superadmin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  actions_count INTEGER DEFAULT 0
);

-- ============================================
-- PHASE 6: Compliance & Security
-- ============================================

-- Tenant data policies for compliance
CREATE TABLE IF NOT EXISTS public.tenant_data_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE,
  data_retention_days INTEGER DEFAULT 2555,
  audit_log_retention_days INTEGER DEFAULT 2555,
  pii_handling_policy TEXT,
  data_residency_region TEXT,
  gdpr_compliant BOOLEAN DEFAULT false,
  ferpa_compliant BOOLEAN DEFAULT false,
  hipaa_compliant BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Compliance events tracking
CREATE TABLE IF NOT EXISTS public.compliance_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  tenant_id UUID,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  affected_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  description TEXT,
  metadata JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enhance audit_logs with additional fields
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS session_id UUID;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS impersonator_id UUID;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS compliance_tags TEXT[];

-- ============================================
-- PHASE 7: RLS Policies
-- ============================================

-- Sports RLS
ALTER TABLE sports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view sports"
ON sports FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "System admins can manage sports"
ON sports FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'system_admin'));

-- Seasons RLS
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view seasons"
ON seasons FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "System admins can manage seasons"
ON seasons FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'system_admin'));

-- Teams RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view teams"
ON teams FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "System admins can manage teams"
ON teams FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'system_admin'));

CREATE POLICY "Org admins can manage their teams"
ON teams FOR ALL
TO authenticated
USING (has_org_role(auth.uid(), organization_id));

-- User role contexts RLS
ALTER TABLE user_role_contexts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own context"
ON user_role_contexts FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can manage own context"
ON user_role_contexts FOR ALL
TO authenticated
USING (user_id = auth.uid());

-- Uploaded files RLS
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own files"
ON uploaded_files FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR has_role(auth.uid(), 'system_admin'));

CREATE POLICY "Users can upload files"
ON uploaded_files FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own files"
ON uploaded_files FOR DELETE
TO authenticated
USING (user_id = auth.uid() OR has_role(auth.uid(), 'system_admin'));

-- Quarantined files RLS (admin only)
ALTER TABLE quarantined_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view quarantined files"
ON quarantined_files FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'system_admin'));

CREATE POLICY "System can insert quarantined files"
ON quarantined_files FOR INSERT
TO authenticated
WITH CHECK (true);

-- File access logs RLS
ALTER TABLE file_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own file logs"
ON file_access_logs FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR has_role(auth.uid(), 'system_admin'));

CREATE POLICY "System can insert file logs"
ON file_access_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Impersonation sessions RLS
ALTER TABLE impersonation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can manage impersonation sessions"
ON impersonation_sessions FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'system_admin'));

-- Tenant data policies RLS
ALTER TABLE tenant_data_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view tenant policies"
ON tenant_data_policies FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'system_admin'));

CREATE POLICY "Admins can manage tenant policies"
ON tenant_data_policies FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'system_admin'));

-- Compliance events RLS
ALTER TABLE compliance_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view compliance events"
ON compliance_events FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'system_admin'));

CREATE POLICY "System can insert compliance events"
ON compliance_events FOR INSERT
TO authenticated
WITH CHECK (true);

-- ============================================
-- PHASE 8: Helper Functions
-- ============================================

-- Function to check if user has superadmin role
CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'superadmin'
  )
$$;

-- Function to get user's active context
CREATE OR REPLACE FUNCTION public.get_user_context(_user_id uuid)
RETURNS TABLE (
  active_role app_role,
  active_district_id uuid,
  active_school_id uuid,
  active_organization_id uuid,
  active_sport_id uuid,
  active_season_id uuid,
  active_team_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    active_role,
    active_district_id,
    active_school_id,
    active_organization_id,
    active_sport_id,
    active_season_id,
    active_team_id
  FROM public.user_role_contexts
  WHERE user_id = _user_id
$$;

-- Function to check district-level role
CREATE OR REPLACE FUNCTION public.has_district_role(_user_id uuid, _district_id uuid, _roles app_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND district_id = _district_id
      AND role = ANY(_roles)
  ) OR public.has_role(_user_id, 'superadmin') OR public.has_role(_user_id, 'system_admin')
$$;

-- Function to check school-level role
CREATE OR REPLACE FUNCTION public.has_school_role(_user_id uuid, _school_id uuid, _roles app_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND school_id = _school_id
      AND role = ANY(_roles)
  ) OR public.has_role(_user_id, 'superadmin') OR public.has_role(_user_id, 'system_admin')
$$;

-- Triggers for updated_at
CREATE OR REPLACE TRIGGER update_sports_updated_at BEFORE UPDATE ON sports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_seasons_updated_at BEFORE UPDATE ON seasons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_uploaded_files_updated_at BEFORE UPDATE ON uploaded_files FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_user_role_contexts_updated_at BEFORE UPDATE ON user_role_contexts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_tenant_data_policies_updated_at BEFORE UPDATE ON tenant_data_policies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();