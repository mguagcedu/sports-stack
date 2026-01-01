-- ============================================================
-- SPORTS CARDS SYSTEM - PHASE 1: CORE DATA MODEL
-- ============================================================

-- A) Athletes table (profile extension for non-user athletes)
CREATE TABLE IF NOT EXISTS public.athletes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  grad_year integer,
  height text,
  weight text,
  dominant_hand text CHECK (dominant_hand IN ('right', 'left', 'both', 'unknown')),
  photo_url text,
  card_theme_preference text,
  organization_id uuid REFERENCES organizations(id),
  school_id uuid REFERENCES schools(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view athletes in their org"
  ON athletes FOR SELECT
  USING (true);

CREATE POLICY "Coaches can manage athletes"
  ON athletes FOR ALL
  USING (has_role(auth.uid(), 'system_admin') OR has_role(auth.uid(), 'org_admin') 
    OR has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'head_coach') 
    OR has_role(auth.uid(), 'athletic_director'));

-- B) Team Memberships table (links users/athletes to teams with roles)
CREATE TABLE IF NOT EXISTS public.team_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  person_id uuid NOT NULL,
  person_type text NOT NULL CHECK (person_type IN ('user', 'athlete')),
  season_id uuid REFERENCES seasons(id),
  role_on_team text NOT NULL CHECK (role_on_team IN ('athlete', 'coach', 'assistant_coach', 'support_staff')),
  is_active boolean DEFAULT true,
  visibility_scope text DEFAULT 'team_only' CHECK (visibility_scope IN ('team_only', 'org_only', 'public_profile_off')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(team_id, person_id, person_type, season_id)
);

ALTER TABLE public.team_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view team memberships"
  ON team_memberships FOR SELECT
  USING (true);

CREATE POLICY "Coaches can manage memberships"
  ON team_memberships FOR ALL
  USING (has_role(auth.uid(), 'system_admin') OR has_role(auth.uid(), 'org_admin') 
    OR has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'head_coach'));

-- C) Sport Positions table (sport-aware position definitions)
CREATE TABLE IF NOT EXISTS public.sport_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_key text NOT NULL,
  position_key text NOT NULL,
  display_name text NOT NULL,
  unit text CHECK (unit IN ('offense', 'defense', 'special_teams', 'staff', 'other')),
  group_key text,
  layout_slot_key text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(sport_key, position_key)
);

ALTER TABLE public.sport_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view positions"
  ON sport_positions FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage positions"
  ON sport_positions FOR ALL
  USING (has_role(auth.uid(), 'system_admin'));

-- D) Athlete Positions table (multi-position assignments)
CREATE TABLE IF NOT EXISTS public.athlete_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_membership_id uuid REFERENCES team_memberships(id) ON DELETE CASCADE NOT NULL,
  position_id uuid REFERENCES sport_positions(id) ON DELETE CASCADE NOT NULL,
  depth_order integer,
  is_primary boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(team_membership_id, position_id)
);

ALTER TABLE public.athlete_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view athlete positions"
  ON athlete_positions FOR SELECT
  USING (true);

CREATE POLICY "Coaches can manage athlete positions"
  ON athlete_positions FOR ALL
  USING (has_role(auth.uid(), 'system_admin') OR has_role(auth.uid(), 'org_admin') 
    OR has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'head_coach'));

-- E) Jersey Numbers table
CREATE TABLE IF NOT EXISTS public.jersey_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_membership_id uuid REFERENCES team_memberships(id) ON DELETE CASCADE NOT NULL,
  jersey_number integer,
  is_primary boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(team_membership_id, jersey_number)
);

ALTER TABLE public.jersey_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view jersey numbers"
  ON jersey_numbers FOR SELECT
  USING (true);

CREATE POLICY "Coaches can manage jersey numbers"
  ON jersey_numbers FOR ALL
  USING (has_role(auth.uid(), 'system_admin') OR has_role(auth.uid(), 'org_admin') 
    OR has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'head_coach'));

-- F) Line Groups table (custom lines/strings for all sports)
CREATE TABLE IF NOT EXISTS public.line_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  season_id uuid REFERENCES seasons(id),
  sport_key text NOT NULL,
  line_key text NOT NULL,
  display_name text NOT NULL,
  sort_order integer DEFAULT 0,
  is_default boolean DEFAULT false,
  created_by_user_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(team_id, season_id, line_key)
);

ALTER TABLE public.line_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view line groups"
  ON line_groups FOR SELECT
  USING (true);

CREATE POLICY "Coaches can manage line groups"
  ON line_groups FOR ALL
  USING (has_role(auth.uid(), 'system_admin') OR has_role(auth.uid(), 'org_admin') 
    OR has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'head_coach'));

-- G) Member Line Groups table (multi-line membership)
CREATE TABLE IF NOT EXISTS public.member_line_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_membership_id uuid REFERENCES team_memberships(id) ON DELETE CASCADE NOT NULL,
  line_group_id uuid REFERENCES line_groups(id) ON DELETE CASCADE NOT NULL,
  is_primary boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(team_membership_id, line_group_id)
);

ALTER TABLE public.member_line_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view member line groups"
  ON member_line_groups FOR SELECT
  USING (true);

CREATE POLICY "Coaches can manage member line groups"
  ON member_line_groups FOR ALL
  USING (has_role(auth.uid(), 'system_admin') OR has_role(auth.uid(), 'org_admin') 
    OR has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'head_coach'));

-- H) Sports Cards table
CREATE TABLE IF NOT EXISTS public.sports_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_membership_id uuid REFERENCES team_memberships(id) ON DELETE CASCADE NOT NULL,
  season_id uuid REFERENCES seasons(id),
  card_version integer DEFAULT 1,
  rating_overall integer CHECK (rating_overall >= 0 AND rating_overall <= 99),
  badges jsonb DEFAULT '[]',
  accent_color text,
  background_style text DEFAULT 'classic' CHECK (background_style IN ('classic', 'neon', 'chrome', 'matte', 'heritage')),
  render_variant text DEFAULT 'player' CHECK (render_variant IN ('player', 'coach', 'staff')),
  show_rating boolean DEFAULT false,
  show_height_weight boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(team_membership_id, season_id)
);

ALTER TABLE public.sports_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sports cards for their teams"
  ON sports_cards FOR SELECT
  USING (true);

CREATE POLICY "Coaches can manage sports cards"
  ON sports_cards FOR ALL
  USING (has_role(auth.uid(), 'system_admin') OR has_role(auth.uid(), 'org_admin') 
    OR has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'head_coach'));

-- I) Roster Reveal State table
CREATE TABLE IF NOT EXISTS public.roster_reveal_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  season_id uuid REFERENCES seasons(id),
  reveal_completed_at timestamp with time zone,
  reveal_enabled_on_dashboard boolean DEFAULT true,
  last_replayed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(team_id, season_id)
);

ALTER TABLE public.roster_reveal_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reveal state"
  ON roster_reveal_state FOR SELECT
  USING (true);

CREATE POLICY "Coaches can manage reveal state"
  ON roster_reveal_state FOR ALL
  USING (has_role(auth.uid(), 'system_admin') OR has_role(auth.uid(), 'org_admin') 
    OR has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'head_coach'));

-- J) Sport Layout Templates table (global template library)
CREATE TABLE IF NOT EXISTS public.sport_layout_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_key text NOT NULL,
  template_type text NOT NULL CHECK (template_type IN (
    'formation', 'court_map', 'field_map', 'lineup_grid', 'pool_map',
    'lanes', 'heats', 'weight_classes', 'relays', 'bracket', 'rotation', 'grouped_list'
  )),
  template_key text NOT NULL,
  display_name text NOT NULL,
  side text DEFAULT 'none' CHECK (side IN ('offense', 'defense', 'special_teams', 'none')),
  slot_map jsonb NOT NULL DEFAULT '{}',
  default_for_sport boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(sport_key, template_key)
);

ALTER TABLE public.sport_layout_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view layout templates"
  ON sport_layout_templates FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage layout templates"
  ON sport_layout_templates FOR ALL
  USING (has_role(auth.uid(), 'system_admin'));

-- K) Team Layout Preferences table
CREATE TABLE IF NOT EXISTS public.team_layout_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  season_id uuid REFERENCES seasons(id),
  sport_key text NOT NULL,
  selected_template_keys jsonb DEFAULT '[]',
  selected_line_group_id uuid REFERENCES line_groups(id) ON DELETE SET NULL,
  updated_by_user_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(team_id, season_id, sport_key)
);

ALTER TABLE public.team_layout_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view layout preferences"
  ON team_layout_preferences FOR SELECT
  USING (true);

CREATE POLICY "Coaches can manage layout preferences"
  ON team_layout_preferences FOR ALL
  USING (has_role(auth.uid(), 'system_admin') OR has_role(auth.uid(), 'org_admin') 
    OR has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'head_coach'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_athletes_user_id ON athletes(user_id);
CREATE INDEX IF NOT EXISTS idx_athletes_org ON athletes(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_memberships_team ON team_memberships(team_id);
CREATE INDEX IF NOT EXISTS idx_team_memberships_person ON team_memberships(person_id);
CREATE INDEX IF NOT EXISTS idx_team_memberships_season ON team_memberships(season_id);
CREATE INDEX IF NOT EXISTS idx_sport_positions_sport ON sport_positions(sport_key);
CREATE INDEX IF NOT EXISTS idx_athlete_positions_membership ON athlete_positions(team_membership_id);
CREATE INDEX IF NOT EXISTS idx_line_groups_team ON line_groups(team_id);
CREATE INDEX IF NOT EXISTS idx_sports_cards_membership ON sports_cards(team_membership_id);
CREATE INDEX IF NOT EXISTS idx_sport_layout_templates_sport ON sport_layout_templates(sport_key);