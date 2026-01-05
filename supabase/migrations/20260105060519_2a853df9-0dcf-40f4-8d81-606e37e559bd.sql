-- =====================================================
-- PHASE 1: FIX CRITICAL RLS POLICIES (CORRECTED)
-- =====================================================

-- Drop and recreate athletes policies with proper restrictions
DROP POLICY IF EXISTS "Users can view athletes in their org" ON public.athletes;
DROP POLICY IF EXISTS "Coaches can manage athletes" ON public.athletes;

-- Athletes: Only accessible to team coaches, athletic directors, or the athlete themselves
CREATE POLICY "Athletes can view own profile" ON public.athletes
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Authorized staff can view athletes" ON public.athletes
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'superadmin') OR
  public.has_role(auth.uid(), 'system_admin') OR
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('coach', 'head_coach', 'assistant_coach', 'athletic_director', 'org_admin', 'school_admin')
    AND (ur.organization_id = athletes.organization_id OR ur.school_id = athletes.school_id)
  )
);

CREATE POLICY "Staff can manage athletes" ON public.athletes
FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'superadmin') OR
  public.has_role(auth.uid(), 'system_admin') OR
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('coach', 'head_coach', 'athletic_director', 'org_admin')
    AND (ur.organization_id = athletes.organization_id OR ur.school_id = athletes.school_id)
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'superadmin') OR
  public.has_role(auth.uid(), 'system_admin') OR
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('coach', 'head_coach', 'athletic_director', 'org_admin')
    AND (ur.organization_id = athletes.organization_id OR ur.school_id = athletes.school_id)
  )
);

-- Fix team_members policy - restrict to actual team members and coaches
DROP POLICY IF EXISTS "Authenticated users can view team members" ON public.team_members;

CREATE POLICY "Team members can view teammates" ON public.team_members
FOR SELECT TO authenticated
USING (
  user_id = auth.uid() OR
  public.has_role(auth.uid(), 'superadmin') OR
  public.has_role(auth.uid(), 'system_admin') OR
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = team_members.team_id
    AND tm.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.teams t ON t.id = team_members.team_id
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('coach', 'head_coach', 'athletic_director', 'org_admin', 'school_admin')
    AND (ur.organization_id = t.organization_id OR ur.school_id = t.school_id)
  )
);

-- Fix registrations policy - restrict medical data access (uses athlete_user_id and parent_user_id)
DROP POLICY IF EXISTS "Users can view registrations they're involved in" ON public.registrations;

CREATE POLICY "Users can view own registrations" ON public.registrations
FOR SELECT TO authenticated
USING (
  athlete_user_id = auth.uid() OR
  parent_user_id = auth.uid() OR
  public.has_role(auth.uid(), 'superadmin') OR
  public.has_role(auth.uid(), 'system_admin') OR
  public.has_role(auth.uid(), 'athletic_director') OR
  public.has_role(auth.uid(), 'registrar')
);

-- =====================================================
-- PHASE 2: RATE LIMITING AND SECURITY TABLES
-- =====================================================

-- Create rate limiting table for authentication
CREATE TABLE IF NOT EXISTS public.login_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  identifier_type TEXT NOT NULL DEFAULT 'ip',
  attempts INTEGER DEFAULT 1,
  first_attempt_at TIMESTAMPTZ DEFAULT now(),
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON public.login_rate_limits(identifier, identifier_type);
CREATE INDEX IF NOT EXISTS idx_rate_limits_locked ON public.login_rate_limits(locked_until) WHERE locked_until IS NOT NULL;

-- RLS for rate limits (only service role can access)
ALTER TABLE public.login_rate_limits ENABLE ROW LEVEL SECURITY;

-- Create security alerts table
CREATE TABLE IF NOT EXISTS public.security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  source_ip TEXT,
  user_id UUID,
  metadata JSONB,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_security_alerts_severity ON public.security_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_security_alerts_created ON public.security_alerts(created_at DESC);

ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view security alerts" ON public.security_alerts
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'superadmin')
);

CREATE POLICY "System can insert security alerts" ON public.security_alerts
FOR INSERT TO authenticated
WITH CHECK (true);

-- =====================================================
-- PHASE 3: ENHANCED AUDIT LOGGING
-- =====================================================

-- Add data classification to audit logs if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'audit_logs' AND column_name = 'data_classification') THEN
    ALTER TABLE public.audit_logs ADD COLUMN data_classification TEXT DEFAULT 'internal';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'audit_logs' AND column_name = 'retention_days') THEN
    ALTER TABLE public.audit_logs ADD COLUMN retention_days INTEGER DEFAULT 365;
  END IF;
END $$;

-- Index for compliance queries
CREATE INDEX IF NOT EXISTS idx_audit_compliance_tags ON public.audit_logs USING GIN (compliance_tags);

-- =====================================================
-- PHASE 4: SESSION SECURITY FUNCTIONS
-- =====================================================

-- Function to validate and extend sessions
CREATE OR REPLACE FUNCTION public.validate_user_session(session_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_record RECORD;
  max_inactive_minutes INTEGER := 30;
BEGIN
  SELECT * INTO session_record
  FROM public.user_sessions
  WHERE id = session_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check for session timeout
  IF session_record.last_activity_at < now() - (max_inactive_minutes || ' minutes')::interval THEN
    UPDATE public.user_sessions SET is_active = false WHERE id = session_id;
    RETURN false;
  END IF;
  
  -- Update last activity
  UPDATE public.user_sessions 
  SET last_activity_at = now(), updated_at = now()
  WHERE id = session_id;
  
  RETURN true;
END;
$$;

-- Function to enforce concurrent session limits
CREATE OR REPLACE FUNCTION public.enforce_session_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  max_sessions INTEGER := 5;
  current_count INTEGER;
  oldest_session_id UUID;
BEGIN
  SELECT COUNT(*) INTO current_count
  FROM public.user_sessions
  WHERE user_id = NEW.user_id AND is_active = true;
  
  IF current_count >= max_sessions THEN
    SELECT id INTO oldest_session_id
    FROM public.user_sessions
    WHERE user_id = NEW.user_id AND is_active = true
    ORDER BY created_at ASC
    LIMIT 1;
    
    IF oldest_session_id IS NOT NULL THEN
      UPDATE public.user_sessions
      SET is_active = false, updated_at = now()
      WHERE id = oldest_session_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger if not exists
DROP TRIGGER IF EXISTS enforce_session_limit_trigger ON public.user_sessions;
CREATE TRIGGER enforce_session_limit_trigger
BEFORE INSERT ON public.user_sessions
FOR EACH ROW EXECUTE FUNCTION public.enforce_session_limit();

-- =====================================================
-- PHASE 5: RATE LIMIT HELPER FUNCTIONS
-- =====================================================

-- Function to check rate limits
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier TEXT,
  p_identifier_type TEXT DEFAULT 'ip',
  p_max_attempts INTEGER DEFAULT 5,
  p_window_minutes INTEGER DEFAULT 15,
  p_lockout_minutes INTEGER DEFAULT 30
)
RETURNS TABLE (
  allowed BOOLEAN,
  attempts_remaining INTEGER,
  locked_until TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rate_record RECORD;
BEGIN
  -- Get current rate limit record
  SELECT * INTO rate_record
  FROM public.login_rate_limits
  WHERE identifier = p_identifier AND identifier_type = p_identifier_type;
  
  IF FOUND THEN
    -- Check if currently locked
    IF rate_record.locked_until IS NOT NULL AND rate_record.locked_until > now() THEN
      RETURN QUERY SELECT false, 0, rate_record.locked_until;
      RETURN;
    END IF;
    
    -- Check if window expired, reset if so
    IF rate_record.first_attempt_at < now() - (p_window_minutes || ' minutes')::interval THEN
      UPDATE public.login_rate_limits
      SET attempts = 1, first_attempt_at = now(), locked_until = NULL, updated_at = now()
      WHERE id = rate_record.id;
      RETURN QUERY SELECT true, p_max_attempts - 1, NULL::TIMESTAMPTZ;
      RETURN;
    END IF;
    
    -- Check if max attempts reached
    IF rate_record.attempts >= p_max_attempts THEN
      UPDATE public.login_rate_limits
      SET locked_until = now() + (p_lockout_minutes || ' minutes')::interval, updated_at = now()
      WHERE id = rate_record.id;
      RETURN QUERY SELECT false, 0, now() + (p_lockout_minutes || ' minutes')::interval;
      RETURN;
    END IF;
    
    -- Increment attempts
    UPDATE public.login_rate_limits
    SET attempts = attempts + 1, updated_at = now()
    WHERE id = rate_record.id;
    RETURN QUERY SELECT true, p_max_attempts - rate_record.attempts - 1, NULL::TIMESTAMPTZ;
    RETURN;
  ELSE
    -- Create new record
    INSERT INTO public.login_rate_limits (identifier, identifier_type, attempts, first_attempt_at)
    VALUES (p_identifier, p_identifier_type, 1, now());
    RETURN QUERY SELECT true, p_max_attempts - 1, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;
END;
$$;

-- Function to clear rate limit on successful login
CREATE OR REPLACE FUNCTION public.clear_rate_limit(
  p_identifier TEXT,
  p_identifier_type TEXT DEFAULT 'ip'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.login_rate_limits
  WHERE identifier = p_identifier AND identifier_type = p_identifier_type;
END;
$$;

-- =====================================================
-- PHASE 6: SENSITIVE DATA ACCESS LOGGING
-- =====================================================

-- Function to log sensitive data access
CREATE OR REPLACE FUNCTION public.log_sensitive_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    entity_type,
    entity_id,
    action,
    new_data,
    compliance_tags,
    data_classification
  ) VALUES (
    auth.uid(),
    TG_TABLE_NAME,
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.id::TEXT
      ELSE NEW.id::TEXT
    END,
    TG_OP,
    CASE 
      WHEN TG_OP = 'DELETE' THEN NULL 
      ELSE jsonb_build_object('accessed_at', now())
    END,
    ARRAY['pii_access', 'ferpa'],
    'sensitive'
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for sensitive tables
DROP TRIGGER IF EXISTS audit_athlete_changes ON public.athletes;
CREATE TRIGGER audit_athlete_changes
AFTER INSERT OR UPDATE OR DELETE ON public.athletes
FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_access();

DROP TRIGGER IF EXISTS audit_registration_changes ON public.registrations;
CREATE TRIGGER audit_registration_changes
AFTER INSERT OR UPDATE OR DELETE ON public.registrations
FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_access();