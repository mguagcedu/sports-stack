-- =====================================================
-- INJURY/IR LIST SYSTEM
-- =====================================================

-- Player injury records
CREATE TABLE public.player_injuries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  injury_type TEXT NOT NULL, -- 'minor', 'moderate', 'severe', 'season_ending'
  injury_description TEXT,
  body_part TEXT,
  injury_date DATE NOT NULL DEFAULT CURRENT_DATE,
  estimated_return_date DATE,
  actual_return_date DATE,
  status TEXT NOT NULL DEFAULT 'injured', -- 'injured', 'day_to_day', 'ir', 'recovered', 'cleared'
  is_on_ir BOOLEAN DEFAULT false,
  reported_by_user_id UUID,
  cleared_by_user_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- DISCIPLINE/PUNISHMENT SYSTEM
-- =====================================================

-- Discipline records for players
CREATE TABLE public.player_disciplines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  discipline_type TEXT NOT NULL, -- 'missed_practice', 'late_arrival', 'academic', 'behavior', 'bullying', 'other'
  severity TEXT NOT NULL DEFAULT 'minor', -- 'minor', 'moderate', 'severe', 'critical'
  description TEXT NOT NULL,
  incident_date DATE NOT NULL DEFAULT CURRENT_DATE,
  consequence_type TEXT, -- 'warning', 'partial_bench', 'full_bench', 'suspension', 'dismissal'
  bench_duration TEXT, -- '1st_quarter', '2nd_quarter', '3rd_quarter', '4th_quarter', '1st_half', '2nd_half', '1st_period', '2nd_period', '3rd_period', 'full_game', 'multiple_games'
  games_suspended INTEGER DEFAULT 0,
  notify_team BOOLEAN DEFAULT false, -- Based on severity
  notify_player BOOLEAN DEFAULT true,
  notify_parents BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'served', 'appealed', 'lifted'
  served_date DATE,
  issued_by_user_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sport-specific bench duration rules
CREATE TABLE public.sport_bench_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_code TEXT NOT NULL,
  bench_duration_key TEXT NOT NULL, -- '1st_quarter', '1st_half', etc.
  display_name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(sport_code, bench_duration_key)
);

-- Insert default bench rules for major sports
INSERT INTO public.sport_bench_rules (sport_code, bench_duration_key, display_name, sort_order) VALUES
-- Football (quarters)
('football', '1st_quarter', '1st Quarter', 1),
('football', '2nd_quarter', '2nd Quarter', 2),
('football', '1st_half', '1st Half', 3),
('football', '3rd_quarter', '3rd Quarter', 4),
('football', '4th_quarter', '4th Quarter', 5),
('football', '2nd_half', '2nd Half', 6),
('football', 'full_game', 'Full Game', 7),
-- Basketball (quarters)
('basketball', '1st_quarter', '1st Quarter', 1),
('basketball', '2nd_quarter', '2nd Quarter', 2),
('basketball', '1st_half', '1st Half', 3),
('basketball', '3rd_quarter', '3rd Quarter', 4),
('basketball', '4th_quarter', '4th Quarter', 5),
('basketball', '2nd_half', '2nd Half', 6),
('basketball', 'full_game', 'Full Game', 7),
-- Soccer (halves)
('soccer', '1st_half', '1st Half', 1),
('soccer', '2nd_half', '2nd Half', 2),
('soccer', 'full_game', 'Full Game', 3),
-- Hockey (periods)
('hockey', '1st_period', '1st Period', 1),
('hockey', '2nd_period', '2nd Period', 2),
('hockey', '3rd_period', '3rd Period', 3),
('hockey', 'full_game', 'Full Game', 4),
-- Baseball (innings)
('baseball', '1st_inning', '1st Inning', 1),
('baseball', '2nd_inning', '2nd Inning', 2),
('baseball', '3rd_inning', '3rd Inning', 3),
('baseball', '4th_inning', '4th Inning', 4),
('baseball', '5th_inning', '5th Inning', 5),
('baseball', '6th_inning', '6th Inning', 6),
('baseball', '7th_inning', '7th Inning', 7),
('baseball', 'full_game', 'Full Game', 8),
-- Volleyball (sets)
('volleyball', '1st_set', '1st Set', 1),
('volleyball', '2nd_set', '2nd Set', 2),
('volleyball', '3rd_set', '3rd Set', 3),
('volleyball', 'full_match', 'Full Match', 4),
-- Lacrosse (quarters)
('lacrosse', '1st_quarter', '1st Quarter', 1),
('lacrosse', '2nd_quarter', '2nd Quarter', 2),
('lacrosse', '1st_half', '1st Half', 3),
('lacrosse', '3rd_quarter', '3rd Quarter', 4),
('lacrosse', '4th_quarter', '4th Quarter', 5),
('lacrosse', '2nd_half', '2nd Half', 6),
('lacrosse', 'full_game', 'Full Game', 7);

-- =====================================================
-- NOTIFICATIONS SYSTEM
-- =====================================================

CREATE TABLE public.team_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  recipient_user_id UUID, -- NULL means team-wide
  recipient_role TEXT, -- 'athlete', 'coach', 'parent', etc.
  notification_type TEXT NOT NULL, -- 'injury', 'discipline', 'roster_change', 'birthday', 'game_day', 'starter_change'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  reference_type TEXT, -- 'injury', 'discipline', 'team_member', 'event'
  reference_id UUID,
  is_read BOOLEAN DEFAULT false,
  is_sent BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  created_at TIMESTAMPTZ DEFAULT now(),
  read_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

-- =====================================================
-- BADGES SYSTEM
-- =====================================================

-- Available badge definitions
CREATE TABLE public.badge_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_key TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  category TEXT, -- 'achievement', 'role', 'milestone', 'special'
  is_assignable BOOLEAN DEFAULT true, -- Can coaches manually assign?
  is_auto_awarded BOOLEAN DEFAULT false, -- Awarded automatically?
  sport_code TEXT, -- NULL means all sports
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Player badge assignments
CREATE TABLE public.player_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  badge_definition_id UUID NOT NULL REFERENCES public.badge_definitions(id) ON DELETE CASCADE,
  awarded_by_user_id UUID,
  awarded_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  notes TEXT,
  UNIQUE(team_member_id, badge_definition_id)
);

-- Insert default badges
INSERT INTO public.badge_definitions (badge_key, display_name, description, icon, category, is_assignable) VALUES
('captain', 'Team Captain', 'Team captain and leader', 'crown', 'role', true),
('all_star', 'All-Star', 'Selected as an all-star player', 'star', 'achievement', true),
('mvp', 'MVP', 'Most Valuable Player', 'trophy', 'achievement', true),
('rookie', 'Rookie', 'First year player', 'sparkles', 'milestone', false),
('senior', 'Senior', 'Senior class athlete', 'graduation-cap', 'milestone', false),
('honor_roll', 'Honor Roll', 'Academic excellence', 'book', 'achievement', true),
('iron_man', 'Iron Man', 'Perfect attendance', 'shield', 'achievement', true),
('most_improved', 'Most Improved', 'Showed significant improvement', 'trending-up', 'achievement', true),
('defensive_player', 'Defensive Player', 'Outstanding defensive player', 'shield-check', 'achievement', true),
('offensive_player', 'Offensive Player', 'Outstanding offensive player', 'zap', 'achievement', true),
('clutch', 'Clutch Player', 'Performs in critical moments', 'target', 'achievement', true),
('team_player', 'Team Player', 'Exemplary teamwork', 'users', 'achievement', true),
('hustle', 'Hustle Award', 'Maximum effort every play', 'flame', 'achievement', true);

-- =====================================================
-- GAME DAY / DEPTH CHART UPDATES
-- =====================================================

-- Game day depth charts
CREATE TABLE public.game_day_rosters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  published_at TIMESTAMPTZ,
  published_by_user_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, team_id)
);

-- Game day roster entries
CREATE TABLE public.game_day_roster_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_day_roster_id UUID NOT NULL REFERENCES public.game_day_rosters(id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  is_starter BOOLEAN DEFAULT false,
  position_override TEXT,
  line_group_override TEXT,
  depth_order INTEGER,
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'injured', 'suspended', 'excused'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- LINE GROUPS ENHANCEMENTS
-- =====================================================

-- Add custom line group creation flag and sport-specific defaults
ALTER TABLE public.line_groups ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false;
ALTER TABLE public.line_groups ADD COLUMN IF NOT EXISTS description TEXT;

-- =====================================================
-- BIRTHDAY TRACKING
-- =====================================================

-- Add birthday to profiles if not exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birthday_notification_enabled BOOLEAN DEFAULT true;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Player injuries
ALTER TABLE public.player_injuries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches and admins can manage injuries"
ON public.player_injuries FOR ALL
USING (
  has_role(auth.uid(), 'system_admin') OR
  has_role(auth.uid(), 'org_admin') OR
  has_role(auth.uid(), 'coach') OR
  has_role(auth.uid(), 'head_coach') OR
  has_role(auth.uid(), 'athletic_director')
);

CREATE POLICY "Athletes can view their own injuries"
ON public.player_injuries FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.id = player_injuries.team_member_id
    AND tm.user_id = auth.uid()
  )
);

-- Player disciplines
ALTER TABLE public.player_disciplines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches and admins can manage disciplines"
ON public.player_disciplines FOR ALL
USING (
  has_role(auth.uid(), 'system_admin') OR
  has_role(auth.uid(), 'org_admin') OR
  has_role(auth.uid(), 'coach') OR
  has_role(auth.uid(), 'head_coach') OR
  has_role(auth.uid(), 'athletic_director')
);

CREATE POLICY "Athletes can view their own disciplines"
ON public.player_disciplines FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.id = player_disciplines.team_member_id
    AND tm.user_id = auth.uid()
  )
);

-- Sport bench rules
ALTER TABLE public.sport_bench_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view bench rules"
ON public.sport_bench_rules FOR SELECT
USING (true);

-- Team notifications
ALTER TABLE public.team_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their notifications"
ON public.team_notifications FOR SELECT
USING (
  recipient_user_id = auth.uid() OR
  has_role(auth.uid(), 'system_admin') OR
  has_role(auth.uid(), 'org_admin') OR
  has_role(auth.uid(), 'coach') OR
  has_role(auth.uid(), 'head_coach')
);

CREATE POLICY "Coaches can create notifications"
ON public.team_notifications FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'system_admin') OR
  has_role(auth.uid(), 'org_admin') OR
  has_role(auth.uid(), 'coach') OR
  has_role(auth.uid(), 'head_coach')
);

CREATE POLICY "Users can update their own notifications"
ON public.team_notifications FOR UPDATE
USING (recipient_user_id = auth.uid());

-- Badge definitions
ALTER TABLE public.badge_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view badge definitions"
ON public.badge_definitions FOR SELECT
USING (true);

CREATE POLICY "Admins can manage badge definitions"
ON public.badge_definitions FOR ALL
USING (has_role(auth.uid(), 'system_admin'));

-- Player badges
ALTER TABLE public.player_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view player badges"
ON public.player_badges FOR SELECT
USING (true);

CREATE POLICY "Coaches can manage player badges"
ON public.player_badges FOR ALL
USING (
  has_role(auth.uid(), 'system_admin') OR
  has_role(auth.uid(), 'org_admin') OR
  has_role(auth.uid(), 'coach') OR
  has_role(auth.uid(), 'head_coach')
);

-- Game day rosters
ALTER TABLE public.game_day_rosters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view game day rosters"
ON public.game_day_rosters FOR SELECT
USING (true);

CREATE POLICY "Coaches can manage game day rosters"
ON public.game_day_rosters FOR ALL
USING (
  has_role(auth.uid(), 'system_admin') OR
  has_role(auth.uid(), 'org_admin') OR
  has_role(auth.uid(), 'coach') OR
  has_role(auth.uid(), 'head_coach')
);

-- Game day roster entries
ALTER TABLE public.game_day_roster_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view roster entries"
ON public.game_day_roster_entries FOR SELECT
USING (true);

CREATE POLICY "Coaches can manage roster entries"
ON public.game_day_roster_entries FOR ALL
USING (
  has_role(auth.uid(), 'system_admin') OR
  has_role(auth.uid(), 'org_admin') OR
  has_role(auth.uid(), 'coach') OR
  has_role(auth.uid(), 'head_coach')
);

-- Add triggers for updated_at
CREATE TRIGGER update_player_injuries_updated_at
BEFORE UPDATE ON public.player_injuries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_player_disciplines_updated_at
BEFORE UPDATE ON public.player_disciplines
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_game_day_rosters_updated_at
BEFORE UPDATE ON public.game_day_rosters
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();