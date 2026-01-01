-- Add new roles to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'head_coach';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'equipment_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'student_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'student_equipment_manager';