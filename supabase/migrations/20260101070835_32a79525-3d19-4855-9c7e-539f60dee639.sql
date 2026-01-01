-- ============================================
-- ATTENDANCE TRACKING WITH GEO-FENCING
-- ============================================

-- Attendance records for each event/practice
CREATE TABLE public.attendance_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  event_type TEXT NOT NULL DEFAULT 'practice', -- 'practice', 'game', 'meeting', 'other'
  is_away_event BOOLEAN NOT NULL DEFAULT false,
  
  -- Attendance status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'present', 'absent', 'excused', 'late'
  check_in_time TIMESTAMP WITH TIME ZONE,
  check_out_time TIMESTAMP WITH TIME ZONE,
  
  -- Geo-fence verification
  check_in_latitude NUMERIC,
  check_in_longitude NUMERIC,
  check_in_verified BOOLEAN DEFAULT false,
  check_in_method TEXT, -- 'geo_fence', 'coach_manual', 'auto_complete'
  
  check_out_latitude NUMERIC,
  check_out_longitude NUMERIC,
  check_out_verified BOOLEAN DEFAULT false,
  check_out_method TEXT,
  
  -- Away game auto-complete tracking
  auto_complete_scheduled_at TIMESTAMP WITH TIME ZONE,
  auto_completed BOOLEAN DEFAULT false,
  auto_complete_reason TEXT,
  
  -- Coach overrides
  marked_by_user_id UUID,
  coach_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(team_member_id, event_date, event_id)
);

-- Geo-fence settings per school/team
CREATE TABLE public.geo_fence_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  
  -- Location (uses school location by default, can override)
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  radius_meters INTEGER NOT NULL DEFAULT 200, -- 200m default radius
  
  -- Settings
  minimum_time_minutes INTEGER NOT NULL DEFAULT 60, -- Min time to count as attended
  away_game_auto_complete_hours INTEGER NOT NULL DEFAULT 5, -- Auto-complete after X hours
  require_check_out BOOLEAN NOT NULL DEFAULT true,
  
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT geo_fence_has_reference CHECK (school_id IS NOT NULL OR team_id IS NOT NULL)
);

-- ============================================
-- PLAYER ASSESSMENT & RATING SYSTEM
-- ============================================

-- Overall player ratings (aggregated view)
CREATE TABLE public.player_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  rated_by_user_id UUID NOT NULL,
  
  -- Overall rating (1-100 scale)
  overall_rating INTEGER CHECK (overall_rating >= 0 AND overall_rating <= 100),
  
  -- Category ratings (1-100 scale)
  skill_rating INTEGER CHECK (skill_rating >= 0 AND skill_rating <= 100),
  effort_rating INTEGER CHECK (effort_rating >= 0 AND effort_rating <= 100),
  attitude_rating INTEGER CHECK (attitude_rating >= 0 AND attitude_rating <= 100),
  coachability_rating INTEGER CHECK (coachability_rating >= 0 AND coachability_rating <= 100),
  teamwork_rating INTEGER CHECK (teamwork_rating >= 0 AND teamwork_rating <= 100),
  game_iq_rating INTEGER CHECK (game_iq_rating >= 0 AND game_iq_rating <= 100),
  
  -- Line/depth assignment
  current_line TEXT, -- 'first', 'second', 'third', 'special_teams', etc.
  depth_position INTEGER, -- 1 = starter, 2 = backup, etc.
  
  -- Text assessments
  strengths TEXT,
  areas_for_improvement TEXT,
  coach_notes TEXT,
  
  rating_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Practice/session notes for players
CREATE TABLE public.player_practice_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  noted_by_user_id UUID NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  
  practice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  note_type TEXT NOT NULL DEFAULT 'general', -- 'general', 'performance', 'technique', 'behavior', 'injury'
  
  -- Quick ratings for this session (1-5 scale for quick input)
  session_effort INTEGER CHECK (session_effort >= 1 AND session_effort <= 5),
  session_performance INTEGER CHECK (session_performance >= 1 AND session_performance <= 5),
  
  notes TEXT NOT NULL,
  is_private BOOLEAN NOT NULL DEFAULT false, -- Only visible to coaches
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Player achievements/milestones
CREATE TABLE public.player_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  awarded_by_user_id UUID,
  
  achievement_type TEXT NOT NULL, -- 'milestone', 'award', 'recognition', 'stat', 'custom'
  title TEXT NOT NULL,
  description TEXT,
  
  -- For stat-based achievements
  stat_category TEXT,
  stat_value NUMERIC,
  
  achievement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_public BOOLEAN NOT NULL DEFAULT true, -- Show on sports cards, etc.
  icon TEXT, -- Icon key for display
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geo_fence_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_practice_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for attendance_records
CREATE POLICY "Coaches can manage attendance" ON public.attendance_records
  FOR ALL USING (
    has_role(auth.uid(), 'system_admin') OR 
    has_role(auth.uid(), 'org_admin') OR 
    has_role(auth.uid(), 'coach') OR 
    has_role(auth.uid(), 'head_coach') OR
    has_role(auth.uid(), 'athletic_director')
  );

CREATE POLICY "Athletes can view and update own attendance" ON public.attendance_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.id = attendance_records.team_member_id 
      AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Athletes can check in/out" ON public.attendance_records
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.id = attendance_records.team_member_id 
      AND tm.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.id = attendance_records.team_member_id 
      AND tm.user_id = auth.uid()
    )
  );

-- RLS Policies for geo_fence_settings
CREATE POLICY "Coaches can manage geo fence settings" ON public.geo_fence_settings
  FOR ALL USING (
    has_role(auth.uid(), 'system_admin') OR 
    has_role(auth.uid(), 'org_admin') OR 
    has_role(auth.uid(), 'coach') OR 
    has_role(auth.uid(), 'head_coach') OR
    has_role(auth.uid(), 'athletic_director')
  );

CREATE POLICY "Authenticated users can view geo fence settings" ON public.geo_fence_settings
  FOR SELECT USING (true);

-- RLS Policies for player_ratings
CREATE POLICY "Coaches can manage player ratings" ON public.player_ratings
  FOR ALL USING (
    has_role(auth.uid(), 'system_admin') OR 
    has_role(auth.uid(), 'org_admin') OR 
    has_role(auth.uid(), 'coach') OR 
    has_role(auth.uid(), 'head_coach') OR
    has_role(auth.uid(), 'athletic_director')
  );

CREATE POLICY "Athletes can view own ratings" ON public.player_ratings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.id = player_ratings.team_member_id 
      AND tm.user_id = auth.uid()
    )
  );

-- RLS Policies for player_practice_notes
CREATE POLICY "Coaches can manage practice notes" ON public.player_practice_notes
  FOR ALL USING (
    has_role(auth.uid(), 'system_admin') OR 
    has_role(auth.uid(), 'org_admin') OR 
    has_role(auth.uid(), 'coach') OR 
    has_role(auth.uid(), 'head_coach') OR
    has_role(auth.uid(), 'athletic_director')
  );

CREATE POLICY "Athletes can view own non-private notes" ON public.player_practice_notes
  FOR SELECT USING (
    (is_private = false AND EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.id = player_practice_notes.team_member_id 
      AND tm.user_id = auth.uid()
    ))
  );

-- RLS Policies for player_achievements
CREATE POLICY "Coaches can manage achievements" ON public.player_achievements
  FOR ALL USING (
    has_role(auth.uid(), 'system_admin') OR 
    has_role(auth.uid(), 'org_admin') OR 
    has_role(auth.uid(), 'coach') OR 
    has_role(auth.uid(), 'head_coach') OR
    has_role(auth.uid(), 'athletic_director')
  );

CREATE POLICY "Public achievements are viewable" ON public.player_achievements
  FOR SELECT USING (is_public = true);

CREATE POLICY "Athletes can view own achievements" ON public.player_achievements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.id = player_achievements.team_member_id 
      AND tm.user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_attendance_records_updated_at
  BEFORE UPDATE ON public.attendance_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_geo_fence_settings_updated_at
  BEFORE UPDATE ON public.geo_fence_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_player_ratings_updated_at
  BEFORE UPDATE ON public.player_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();