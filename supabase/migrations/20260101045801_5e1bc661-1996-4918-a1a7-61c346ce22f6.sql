-- Create a helper function to check equipment access
CREATE OR REPLACE FUNCTION public.has_equipment_access(_user_id uuid, _team_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Direct access roles
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('superadmin', 'system_admin', 'org_admin', 'athletic_director', 'coach', 'head_coach', 'equipment_manager')
  )
  OR EXISTS (
    -- Check for active delegations
    SELECT 1 FROM public.equipment_delegations
    WHERE user_id = _user_id
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
      AND (_team_id IS NULL OR team_id = _team_id)
  )
  OR EXISTS (
    -- Check for approved access requests
    SELECT 1 FROM public.equipment_access_requests
    WHERE user_id = _user_id
      AND status = 'approved'
      AND (_team_id IS NULL OR team_id = _team_id)
  )
$$;

-- Create function to check if user can approve equipment requests
CREATE OR REPLACE FUNCTION public.can_approve_equipment_requests(_user_id uuid, _team_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('superadmin', 'system_admin', 'org_admin', 'athletic_director', 'coach', 'head_coach', 'equipment_manager')
      AND (_team_id IS NULL OR team_id = _team_id OR team_id IS NULL)
  )
$$;

-- Create function to check if user can delegate equipment access
CREATE OR REPLACE FUNCTION public.can_delegate_equipment_access(_user_id uuid, _team_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('superadmin', 'system_admin', 'org_admin', 'athletic_director', 'coach', 'head_coach')
      AND (_team_id IS NULL OR team_id = _team_id OR team_id IS NULL)
  )
$$;

-- Update equipment_items RLS policy
DROP POLICY IF EXISTS "Coaches and admins can manage equipment items" ON public.equipment_items;
CREATE POLICY "Users with equipment access can manage items"
ON public.equipment_items
FOR ALL
USING (has_equipment_access(auth.uid()));

-- Update equipment_checkouts RLS policy  
DROP POLICY IF EXISTS "Staff can manage equipment checkouts" ON public.equipment_checkouts;
CREATE POLICY "Users with equipment access can manage checkouts"
ON public.equipment_checkouts
FOR ALL
USING (has_equipment_access(auth.uid(), team_id));

-- Update equipment_sizes RLS policy
DROP POLICY IF EXISTS "Staff can manage equipment sizes" ON public.equipment_sizes;
CREATE POLICY "Users with equipment access can manage sizes"
ON public.equipment_sizes
FOR ALL
USING (has_equipment_access(auth.uid()));

-- Update equipment_access_requests policies
DROP POLICY IF EXISTS "Coaches and admins can update access requests" ON public.equipment_access_requests;
CREATE POLICY "Approvers can update access requests"
ON public.equipment_access_requests
FOR UPDATE
USING (can_approve_equipment_requests(auth.uid(), team_id));

-- Update equipment_delegations policies
DROP POLICY IF EXISTS "Coaches and admins can create delegations" ON public.equipment_delegations;
CREATE POLICY "Delegators can create delegations"
ON public.equipment_delegations
FOR INSERT
WITH CHECK (can_delegate_equipment_access(auth.uid(), team_id));

DROP POLICY IF EXISTS "Coaches and admins can update delegations" ON public.equipment_delegations;
CREATE POLICY "Delegators can update delegations"
ON public.equipment_delegations
FOR UPDATE
USING (
  delegated_by_user_id = auth.uid() 
  OR can_delegate_equipment_access(auth.uid(), team_id)
);