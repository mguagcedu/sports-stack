-- Seed badge definitions
INSERT INTO public.badge_definitions (badge_key, display_name, description, category, icon, sport_code, is_assignable, is_auto_awarded)
VALUES
  ('captain', 'Team Captain', 'Designated team captain', 'leadership', 'crown', NULL, true, false),
  ('mvp', 'MVP', 'Most Valuable Player', 'achievement', 'trophy', NULL, true, false),
  ('all_star', 'All-Star', 'Selected for All-Star team', 'achievement', 'star', NULL, true, false),
  ('rookie', 'Rookie', 'First year player', 'status', 'sparkles', NULL, false, true),
  ('starter', 'Starter', 'Starting lineup player', 'status', 'play', NULL, false, true),
  ('honor_roll', 'Honor Roll', 'Academic achievement', 'academic', 'book', NULL, true, false),
  ('iron_man', 'Iron Man', 'Perfect attendance', 'attendance', 'shield', NULL, false, true),
  ('defensive_player', 'Defensive Player', 'Outstanding defensive performance', 'achievement', 'shield-check', NULL, true, false),
  ('offensive_player', 'Offensive Player', 'Outstanding offensive performance', 'achievement', 'zap', NULL, true, false),
  ('most_improved', 'Most Improved', 'Showed greatest improvement', 'achievement', 'trending-up', NULL, true, false),
  ('team_player', 'Team Player', 'Exceptional teamwork', 'leadership', 'users', NULL, true, false),
  ('scholar_athlete', 'Scholar Athlete', 'Academic and athletic excellence', 'academic', 'graduation-cap', NULL, true, false)
ON CONFLICT (badge_key) DO NOTHING;

-- Seed default line groups for football
INSERT INTO public.line_groups (team_id, sport_key, line_key, display_name, description, sort_order, is_default)
SELECT t.id, 'football', 'offense', 'Offense', 'Offensive unit', 1, true
FROM public.teams t
JOIN public.sports s ON t.sport_id = s.id
WHERE LOWER(s.name) = 'football' OR LOWER(s.code) = 'football'
ON CONFLICT DO NOTHING;

INSERT INTO public.line_groups (team_id, sport_key, line_key, display_name, description, sort_order, is_default)
SELECT t.id, 'football', 'defense', 'Defense', 'Defensive unit', 2, true
FROM public.teams t
JOIN public.sports s ON t.sport_id = s.id
WHERE LOWER(s.name) = 'football' OR LOWER(s.code) = 'football'
ON CONFLICT DO NOTHING;

INSERT INTO public.line_groups (team_id, sport_key, line_key, display_name, description, sort_order, is_default)
SELECT t.id, 'football', 'special_teams', 'Special Teams', 'Special teams unit', 3, true
FROM public.teams t
JOIN public.sports s ON t.sport_id = s.id
WHERE LOWER(s.name) = 'football' OR LOWER(s.code) = 'football'
ON CONFLICT DO NOTHING;

-- Seed default line groups for basketball
INSERT INTO public.line_groups (team_id, sport_key, line_key, display_name, description, sort_order, is_default)
SELECT t.id, 'basketball', 'starters', 'Starters', 'Starting five', 1, true
FROM public.teams t
JOIN public.sports s ON t.sport_id = s.id
WHERE LOWER(s.name) = 'basketball' OR LOWER(s.code) = 'basketball'
ON CONFLICT DO NOTHING;

INSERT INTO public.line_groups (team_id, sport_key, line_key, display_name, description, sort_order, is_default)
SELECT t.id, 'basketball', 'bench', 'Bench', 'Bench players', 2, true
FROM public.teams t
JOIN public.sports s ON t.sport_id = s.id
WHERE LOWER(s.name) = 'basketball' OR LOWER(s.code) = 'basketball'
ON CONFLICT DO NOTHING;