-- Phase 1: Foundation & Infrastructure

-- 1. Create app_role enum with all 13 roles
CREATE TYPE public.app_role AS ENUM (
  'system_admin',
  'org_admin', 
  'athletic_director',
  'coach',
  'assistant_coach',
  'team_manager',
  'parent',
  'athlete',
  'guardian',
  'registrar',
  'finance_admin',
  'gate_staff',
  'viewer'
);

-- 2. Create organization_type enum
CREATE TYPE public.organization_type AS ENUM (
  'school',
  'district',
  'league',
  'club',
  'youth_organization'
);

-- 3. Create subscription_tier enum
CREATE TYPE public.subscription_tier AS ENUM (
  'free',
  'starter',
  'school',
  'district',
  'enterprise'
);

-- 4. Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Create organizations table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type public.organization_type NOT NULL DEFAULT 'school',
  subscription_tier public.subscription_tier NOT NULL DEFAULT 'free',
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  phone TEXT,
  website TEXT,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  school_id UUID, -- Will reference schools table later
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 6. Create user_roles table (CRITICAL: separate from profiles)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  team_id UUID, -- Will reference teams table later
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role, organization_id, team_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 7. Create family_accounts table for parent-child relationships
CREATE TABLE public.family_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  relationship TEXT DEFAULT 'parent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(parent_id, child_id)
);

ALTER TABLE public.family_accounts ENABLE ROW LEVEL SECURITY;

-- 8. Create audit_logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 9. Create schools table (National K-12 Database)
CREATE TABLE public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nces_id TEXT UNIQUE,
  name TEXT NOT NULL,
  level TEXT, -- elementary, middle, high, k12
  school_type TEXT DEFAULT 'public', -- public, private, charter
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  county TEXT,
  phone TEXT,
  website TEXT,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  operational_status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- Create indexes for school search
CREATE INDEX idx_schools_name ON public.schools USING gin(to_tsvector('english', name));
CREATE INDEX idx_schools_state ON public.schools(state);
CREATE INDEX idx_schools_city ON public.schools(city);
CREATE INDEX idx_schools_zip ON public.schools(zip);

-- Add foreign key from organizations to schools
ALTER TABLE public.organizations 
ADD CONSTRAINT fk_organizations_school 
FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE SET NULL;

-- 10. SECURITY DEFINER function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 11. Function to check if user has any role in an organization
CREATE OR REPLACE FUNCTION public.has_org_role(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND organization_id = _org_id
  )
$$;

-- 12. Function to get user's roles
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS SETOF public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT role
  FROM public.user_roles
  WHERE user_id = _user_id
$$;

-- 13. Trigger function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 14. Trigger function for updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_schools_updated_at
  BEFORE UPDATE ON public.schools
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 15. RLS POLICIES

-- Profiles: Users can read their own profile, admins can read all
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "System admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'system_admin'));

-- User Roles: Users can view their own roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'system_admin'));

CREATE POLICY "Org admins can manage org roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (
    organization_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'org_admin'
        AND ur.organization_id = user_roles.organization_id
    )
  );

-- Organizations: Members can view their orgs
CREATE POLICY "Members can view their organizations"
  ON public.organizations FOR SELECT
  TO authenticated
  USING (public.has_org_role(auth.uid(), id));

CREATE POLICY "System admins can manage all organizations"
  ON public.organizations FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'system_admin'));

CREATE POLICY "Org admins can update their organization"
  ON public.organizations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'org_admin'
        AND ur.organization_id = organizations.id
    )
  );

-- Schools: Public read for authenticated users (for search)
CREATE POLICY "Authenticated users can view schools"
  ON public.schools FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System admins can manage schools"
  ON public.schools FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'system_admin'));

-- Family Accounts: Parents can view their relationships
CREATE POLICY "Users can view their family relationships"
  ON public.family_accounts FOR SELECT
  TO authenticated
  USING (parent_id = auth.uid() OR child_id = auth.uid());

CREATE POLICY "Parents can manage family accounts"
  ON public.family_accounts FOR ALL
  TO authenticated
  USING (parent_id = auth.uid());

-- Audit Logs: Only system admins can view
CREATE POLICY "System admins can view audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'system_admin'));

CREATE POLICY "Authenticated users can insert audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);