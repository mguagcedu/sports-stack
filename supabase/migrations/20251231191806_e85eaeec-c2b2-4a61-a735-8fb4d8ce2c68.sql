-- Fix infinite recursion in user_roles RLS policy
DROP POLICY IF EXISTS "Org admins can manage org roles" ON public.user_roles;

-- Recreate using security definer function to avoid recursion
CREATE POLICY "Org admins can manage org roles"
ON public.user_roles FOR ALL
TO authenticated
USING (
  organization_id IS NOT NULL 
  AND public.has_role(auth.uid(), 'org_admin')
);

-- Add district_id to organizations table for linking
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS district_id uuid REFERENCES public.districts(id);