-- Drop the unique constraint on nces_id to allow duplicate NCES IDs
ALTER TABLE public.schools DROP CONSTRAINT IF EXISTS schools_nces_id_key;

-- Create a non-unique index on nces_id for query performance
CREATE INDEX IF NOT EXISTS idx_schools_nces_id ON public.schools(nces_id);

-- Add additional columns to capture all NCES CCD data fields
ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS school_year text,
ADD COLUMN IF NOT EXISTS sy_status text,
ADD COLUMN IF NOT EXISTS charter_status text,
ADD COLUMN IF NOT EXISTS magnet_status text,
ADD COLUMN IF NOT EXISTS virtual_status text,
ADD COLUMN IF NOT EXISTS title1_status text,
ADD COLUMN IF NOT EXISTS lea_id text;

-- Create index on sy_status for filtering and grouping
CREATE INDEX IF NOT EXISTS idx_schools_sy_status ON public.schools(sy_status);

-- Create index on lea_id for district lookups
CREATE INDEX IF NOT EXISTS idx_schools_lea_id ON public.schools(lea_id);