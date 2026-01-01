-- PART 1: Governing Bodies (Sanctioning Bodies) System

-- Create enum for governing body types
CREATE TYPE governing_body_type AS ENUM (
  'state_primary',
  'state_private',
  'city_public',
  'independent_schools',
  'prep_conference',
  'charter',
  'national',
  'multi_state',
  'other'
);

-- Create governing_bodies table
CREATE TABLE public.governing_bodies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  short_name text,
  type governing_body_type NOT NULL DEFAULT 'state_primary',
  state_code text,
  region_label text,
  website_url text,
  is_seeded boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create school_governing_bodies junction table
CREATE TABLE public.school_governing_bodies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  governing_body_id uuid NOT NULL REFERENCES public.governing_bodies(id) ON DELETE CASCADE,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(school_id, governing_body_id)
);

-- Add primary_governing_body_id to schools
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS primary_governing_body_id uuid REFERENCES public.governing_bodies(id);

-- PART 2: Sport Season Defaults (State-based)

-- Create season enum
CREATE TYPE sport_season_type AS ENUM (
  'fall',
  'winter',
  'spring',
  'summer',
  'year_round',
  'varies',
  'custom'
);

-- Create sport_season_defaults table for state-specific overrides
CREATE TABLE public.sport_season_defaults (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state_code text NOT NULL,
  governing_body_id uuid REFERENCES public.governing_bodies(id),
  sport_key text NOT NULL,
  default_season sport_season_type NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(state_code, governing_body_id, sport_key)
);

-- Add new columns to sport_types for national defaults
ALTER TABLE public.sport_types 
  ADD COLUMN IF NOT EXISTS default_season_national sport_season_type DEFAULT 'varies',
  ADD COLUMN IF NOT EXISTS allow_override boolean DEFAULT true;

-- PART 3: Update teams table for new season/year logic
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS sport_key text,
  ADD COLUMN IF NOT EXISTS season sport_season_type,
  ADD COLUMN IF NOT EXISTS custom_season_label text,
  ADD COLUMN IF NOT EXISTS school_year integer,
  ADD COLUMN IF NOT EXISTS season_year_label text;

-- PART 4: Update events table for season/year logic
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS sport_key text,
  ADD COLUMN IF NOT EXISTS season sport_season_type,
  ADD COLUMN IF NOT EXISTS custom_season_label text,
  ADD COLUMN IF NOT EXISTS school_year integer,
  ADD COLUMN IF NOT EXISTS season_year_label text;

-- Enable RLS on new tables
ALTER TABLE public.governing_bodies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_governing_bodies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sport_season_defaults ENABLE ROW LEVEL SECURITY;

-- RLS Policies for governing_bodies
CREATE POLICY "Authenticated users can view governing bodies"
  ON public.governing_bodies FOR SELECT
  USING (true);

CREATE POLICY "System admins can manage governing bodies"
  ON public.governing_bodies FOR ALL
  USING (has_role(auth.uid(), 'system_admin'));

-- RLS Policies for school_governing_bodies
CREATE POLICY "Authenticated users can view school governing bodies"
  ON public.school_governing_bodies FOR SELECT
  USING (true);

CREATE POLICY "School admins can manage their school governing bodies"
  ON public.school_governing_bodies FOR ALL
  USING (
    has_role(auth.uid(), 'system_admin') OR 
    has_school_role(auth.uid(), school_id, ARRAY['school_owner'::app_role, 'school_admin'::app_role])
  );

-- RLS Policies for sport_season_defaults
CREATE POLICY "Authenticated users can view sport season defaults"
  ON public.sport_season_defaults FOR SELECT
  USING (true);

CREATE POLICY "System admins can manage sport season defaults"
  ON public.sport_season_defaults FOR ALL
  USING (has_role(auth.uid(), 'system_admin'));

-- Create updated_at trigger for new tables
CREATE TRIGGER set_governing_bodies_updated_at
  BEFORE UPDATE ON public.governing_bodies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_sport_season_defaults_updated_at
  BEFORE UPDATE ON public.sport_season_defaults
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_governing_bodies_state ON public.governing_bodies(state_code);
CREATE INDEX idx_governing_bodies_type ON public.governing_bodies(type);
CREATE INDEX idx_school_governing_bodies_school ON public.school_governing_bodies(school_id);
CREATE INDEX idx_school_governing_bodies_governing ON public.school_governing_bodies(governing_body_id);
CREATE INDEX idx_sport_season_defaults_state ON public.sport_season_defaults(state_code);
CREATE INDEX idx_sport_season_defaults_sport ON public.sport_season_defaults(sport_key);
CREATE INDEX idx_teams_school_year ON public.teams(school_year);
CREATE INDEX idx_teams_season ON public.teams(season);
CREATE INDEX idx_events_school_year ON public.events(school_year);