-- ============================================
-- SECURITY, PRIVACY, AND DATA PROTECTION TABLES
-- ============================================

-- A) Session tracking for security
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_token text NOT NULL,
  device_info jsonb DEFAULT '{}',
  ip_address text,
  user_agent text,
  last_activity_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  forced_logout_at timestamptz,
  forced_logout_reason text
);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
  ON public.user_sessions FOR SELECT
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'system_admin'));

CREATE POLICY "Users can manage their own sessions"
  ON public.user_sessions FOR ALL
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'system_admin'));

-- Index for efficient session lookups
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON public.user_sessions(is_active, expires_at);

-- B) Privacy settings per entity
CREATE TABLE IF NOT EXISTS public.privacy_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL, -- 'team', 'athlete', 'organization', 'school'
  entity_id uuid NOT NULL,
  setting_key text NOT NULL,
  setting_value boolean DEFAULT false,
  updated_by_user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(entity_type, entity_id, setting_key)
);

ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage privacy settings"
  ON public.privacy_settings FOR ALL
  USING (has_role(auth.uid(), 'system_admin') OR has_role(auth.uid(), 'org_admin'));

CREATE POLICY "Users can view relevant privacy settings"
  ON public.privacy_settings FOR SELECT
  USING (true);

-- C) Security events log (separate from audit_logs for security-specific events)
CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL, -- 'login_attempt', 'password_change', 'mfa_enabled', 'suspicious_activity', 'session_terminated'
  user_id uuid REFERENCES auth.users(id),
  ip_address text,
  user_agent text,
  severity text DEFAULT 'info', -- 'info', 'warning', 'critical'
  details jsonb DEFAULT '{}',
  resolved_at timestamptz,
  resolved_by_user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view security events"
  ON public.security_events FOR SELECT
  USING (has_role(auth.uid(), 'system_admin') OR has_role(auth.uid(), 'superadmin'));

CREATE POLICY "System can insert security events"
  ON public.security_events FOR INSERT
  WITH CHECK (true);

-- D) Data retention policies
CREATE TABLE IF NOT EXISTS public.data_retention_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL UNIQUE,
  retention_days integer DEFAULT 365,
  soft_delete_enabled boolean DEFAULT true,
  anonymize_on_delete boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.data_retention_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage retention policies"
  ON public.data_retention_policies FOR ALL
  USING (has_role(auth.uid(), 'system_admin'));

CREATE POLICY "Users can view retention policies"
  ON public.data_retention_policies FOR SELECT
  USING (true);

-- Insert default retention policies
INSERT INTO public.data_retention_policies (entity_type, retention_days, soft_delete_enabled, anonymize_on_delete)
VALUES 
  ('user_data', 2555, true, true),      -- 7 years for user data
  ('financial_records', 2555, true, false), -- 7 years for financials (no anonymization)
  ('audit_logs', 2555, true, false),    -- 7 years for audit logs
  ('form_submissions', 1095, true, true), -- 3 years for forms
  ('equipment_records', 1825, true, true), -- 5 years for equipment
  ('attendance_records', 365, true, true) -- 1 year for attendance
ON CONFLICT (entity_type) DO NOTHING;

-- E) Financial ledger adjustments (for immutability)
CREATE TABLE IF NOT EXISTS public.financial_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_entry_id uuid NOT NULL,
  adjustment_type text NOT NULL, -- 'reversal', 'correction', 'refund'
  amount_cents integer NOT NULL,
  reason text NOT NULL,
  approved_by_user_id uuid REFERENCES auth.users(id),
  created_by_user_id uuid REFERENCES auth.users(id) NOT NULL,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'
);

ALTER TABLE public.financial_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance admins can manage adjustments"
  ON public.financial_adjustments FOR ALL
  USING (has_role(auth.uid(), 'system_admin') OR has_role(auth.uid(), 'finance_admin') OR has_role(auth.uid(), 'org_admin'));

CREATE POLICY "Users can view relevant adjustments"
  ON public.financial_adjustments FOR SELECT
  USING (has_role(auth.uid(), 'system_admin') OR has_role(auth.uid(), 'finance_admin') OR has_role(auth.uid(), 'org_admin') OR has_role(auth.uid(), 'coach'));

-- F) Add soft delete columns to key tables
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS deleted_by_user_id uuid REFERENCES auth.users(id);
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS is_anonymized boolean DEFAULT false;

ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS deleted_by_user_id uuid REFERENCES auth.users(id);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_anonymized boolean DEFAULT false;

-- G) Organization security settings
CREATE TABLE IF NOT EXISTS public.organization_security_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE,
  password_min_length integer DEFAULT 8,
  password_require_uppercase boolean DEFAULT true,
  password_require_lowercase boolean DEFAULT true,
  password_require_number boolean DEFAULT true,
  password_require_special boolean DEFAULT false,
  session_timeout_minutes integer DEFAULT 30,
  max_sessions_per_user integer DEFAULT 5,
  mfa_required boolean DEFAULT false,
  allow_public_rosters boolean DEFAULT false,
  allow_public_cards boolean DEFAULT false,
  show_athlete_height_weight boolean DEFAULT true,
  show_athlete_photos boolean DEFAULT true,
  show_jersey_numbers boolean DEFAULT true,
  show_athlete_ratings boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.organization_security_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage org security settings"
  ON public.organization_security_settings FOR ALL
  USING (has_role(auth.uid(), 'system_admin') OR has_role(auth.uid(), 'org_admin'));

CREATE POLICY "Users can view org security settings"
  ON public.organization_security_settings FOR SELECT
  USING (true);

-- H) Form access log (for compliance)
CREATE TABLE IF NOT EXISTS public.form_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_submission_id uuid NOT NULL,
  accessed_by_user_id uuid REFERENCES auth.users(id) NOT NULL,
  access_type text NOT NULL, -- 'view', 'edit', 'export', 'print'
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.form_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view form access logs"
  ON public.form_access_log FOR SELECT
  USING (has_role(auth.uid(), 'system_admin') OR has_role(auth.uid(), 'org_admin'));

CREATE POLICY "System can insert form access logs"
  ON public.form_access_log FOR INSERT
  WITH CHECK (true);

-- Create function to log form access
CREATE OR REPLACE FUNCTION public.log_form_access(
  _form_submission_id uuid,
  _access_type text,
  _ip_address text DEFAULT NULL,
  _user_agent text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.form_access_log (form_submission_id, accessed_by_user_id, access_type, ip_address, user_agent)
  VALUES (_form_submission_id, auth.uid(), _access_type, _ip_address, _user_agent);
END;
$$;

-- I) Password history (prevent reuse)
CREATE TABLE IF NOT EXISTS public.password_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.password_history ENABLE ROW LEVEL SECURITY;

-- No direct access to password history
CREATE POLICY "No direct access to password history"
  ON public.password_history FOR ALL
  USING (false);

-- J) Failed login attempts tracking
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip_address text,
  user_agent text,
  success boolean DEFAULT false,
  failure_reason text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view login attempts"
  ON public.login_attempts FOR SELECT
  USING (has_role(auth.uid(), 'system_admin'));

CREATE POLICY "System can insert login attempts"
  ON public.login_attempts FOR INSERT
  WITH CHECK (true);