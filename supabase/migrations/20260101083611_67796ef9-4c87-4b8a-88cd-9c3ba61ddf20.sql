-- Add depth_order and is_starter columns to team_members
ALTER TABLE public.team_members 
ADD COLUMN IF NOT EXISTS depth_order integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_starter boolean DEFAULT false;