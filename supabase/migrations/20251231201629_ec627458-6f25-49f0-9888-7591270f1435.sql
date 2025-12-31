-- Migration 1: Add new enum values only
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'superadmin';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'district_owner';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'district_admin';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'district_viewer';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'school_owner';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'school_admin';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'school_viewer';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'trainer';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'scorekeeper';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'finance_clerk';