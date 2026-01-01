-- Equipment Refurbishment/Recertification Tracking
CREATE TABLE public.equipment_refurbishment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_item_id UUID REFERENCES public.equipment_items(id) ON DELETE CASCADE NOT NULL,
  refurb_type TEXT NOT NULL CHECK (refurb_type IN ('refurbishment', 'recertification', 'repair', 'cleaning')),
  refurb_date DATE NOT NULL DEFAULT CURRENT_DATE,
  cost NUMERIC(10,2) DEFAULT 0,
  provider TEXT,
  notes TEXT,
  next_due_date DATE,
  performed_by_user_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.equipment_refurbishment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users with equipment access can manage refurbishment"
  ON public.equipment_refurbishment FOR ALL
  USING (has_equipment_access(auth.uid()));

CREATE POLICY "Authenticated users can view refurbishment records"
  ON public.equipment_refurbishment FOR SELECT
  USING (true);

CREATE INDEX idx_equipment_refurbishment_item ON public.equipment_refurbishment(equipment_item_id);
CREATE INDEX idx_equipment_refurbishment_date ON public.equipment_refurbishment(refurb_date);

-- Team Volunteer Settings
CREATE TABLE public.team_volunteer_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL UNIQUE,
  deposit_amount NUMERIC(10,2) DEFAULT 0,
  required_volunteer_hours INTEGER DEFAULT 0,
  hours_per_event NUMERIC(4,2) DEFAULT 2,
  refund_policy TEXT DEFAULT 'full',
  cross_team_rule TEXT DEFAULT 'any',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.team_volunteer_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage volunteer settings"
  ON public.team_volunteer_settings FOR ALL
  USING (
    has_role(auth.uid(), 'system_admin') OR
    has_role(auth.uid(), 'org_admin') OR
    has_role(auth.uid(), 'coach') OR
    has_role(auth.uid(), 'head_coach') OR
    has_role(auth.uid(), 'athletic_director')
  );

CREATE POLICY "Users can view volunteer settings"
  ON public.team_volunteer_settings FOR SELECT
  USING (true);

-- Volunteer Fee Deposits
CREATE TABLE public.volunteer_fee_deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'held' CHECK (status IN ('held', 'refunded', 'forfeited', 'partial_refund')),
  payment_id UUID REFERENCES public.payments(id),
  required_hours INTEGER DEFAULT 0,
  completed_hours NUMERIC(6,2) DEFAULT 0,
  refunded_at TIMESTAMPTZ,
  refund_amount NUMERIC(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.volunteer_fee_deposits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deposits"
  ON public.volunteer_fee_deposits FOR SELECT
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'system_admin') OR has_role(auth.uid(), 'org_admin') OR has_role(auth.uid(), 'coach'));

CREATE POLICY "Admins can manage deposits"
  ON public.volunteer_fee_deposits FOR ALL
  USING (has_role(auth.uid(), 'system_admin') OR has_role(auth.uid(), 'org_admin') OR has_role(auth.uid(), 'coach'));

CREATE INDEX idx_volunteer_deposits_user ON public.volunteer_fee_deposits(user_id);
CREATE INDEX idx_volunteer_deposits_team ON public.volunteer_fee_deposits(team_id);

-- Volunteer Positions (per event)
CREATE TABLE public.volunteer_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  position_name TEXT NOT NULL,
  position_type TEXT NOT NULL CHECK (position_type IN ('chains', 'down_sign', 'video', 'announcer', 'concessions', 'ticketing', 'gates', 'parking', 'merchandise', 'other')),
  description TEXT,
  required_count INTEGER NOT NULL DEFAULT 1,
  filled_count INTEGER DEFAULT 0,
  location TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  hours_credit NUMERIC(4,2) DEFAULT 2,
  eligible_team_levels TEXT[] DEFAULT ARRAY['freshman', 'jv', 'varsity'],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.volunteer_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view positions"
  ON public.volunteer_positions FOR SELECT
  USING (true);

CREATE POLICY "Coaches can manage positions"
  ON public.volunteer_positions FOR ALL
  USING (
    has_role(auth.uid(), 'system_admin') OR
    has_role(auth.uid(), 'org_admin') OR
    has_role(auth.uid(), 'coach') OR
    has_role(auth.uid(), 'head_coach') OR
    has_role(auth.uid(), 'team_manager')
  );

CREATE INDEX idx_volunteer_positions_event ON public.volunteer_positions(event_id);
CREATE INDEX idx_volunteer_positions_team ON public.volunteer_positions(team_id);

-- Volunteer Signups
CREATE TABLE public.volunteer_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id UUID REFERENCES public.volunteer_positions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'signed_up' CHECK (status IN ('signed_up', 'confirmed', 'checked_in', 'checked_out', 'completed', 'cancelled', 'no_show')),
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  check_in_code TEXT,
  check_out_code TEXT,
  geo_check_in_lat NUMERIC(10,7),
  geo_check_in_lng NUMERIC(10,7),
  geo_check_out_lat NUMERIC(10,7),
  geo_check_out_lng NUMERIC(10,7),
  manually_confirmed BOOLEAN DEFAULT false,
  confirmed_by_user_id UUID,
  hours_credited NUMERIC(4,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.volunteer_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own signups"
  ON public.volunteer_signups FOR SELECT
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'system_admin') OR has_role(auth.uid(), 'org_admin') OR has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'team_manager'));

CREATE POLICY "Users can create own signups"
  ON public.volunteer_signups FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own signups"
  ON public.volunteer_signups FOR UPDATE
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'system_admin') OR has_role(auth.uid(), 'org_admin') OR has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'team_manager'));

CREATE POLICY "Admins can manage all signups"
  ON public.volunteer_signups FOR ALL
  USING (has_role(auth.uid(), 'system_admin') OR has_role(auth.uid(), 'org_admin'));

CREATE INDEX idx_volunteer_signups_position ON public.volunteer_signups(position_id);
CREATE INDEX idx_volunteer_signups_user ON public.volunteer_signups(user_id);
CREATE INDEX idx_volunteer_signups_status ON public.volunteer_signups(status);

-- Volunteer Position Templates (reusable per sport)
CREATE TABLE public.volunteer_position_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_code TEXT,
  position_type TEXT NOT NULL,
  position_name TEXT NOT NULL,
  description TEXT,
  default_count INTEGER DEFAULT 1,
  default_hours NUMERIC(4,2) DEFAULT 2,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.volunteer_position_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view templates"
  ON public.volunteer_position_templates FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage templates"
  ON public.volunteer_position_templates FOR ALL
  USING (has_role(auth.uid(), 'system_admin'));

-- Seed default volunteer position templates for football
INSERT INTO public.volunteer_position_templates (sport_code, position_type, position_name, description, default_count, default_hours) VALUES
  ('FB', 'chains', 'Chain Crew', 'Operate the first down chains on the sideline', 2, 3),
  ('FB', 'down_sign', 'Down Marker', 'Display the current down on the sideline', 1, 3),
  ('FB', 'video', 'Game Film', 'Record game footage from elevated position', 2, 3.5),
  ('FB', 'announcer', 'PA Announcer', 'Announce plays, scores, and game information', 1, 3),
  ('FB', 'concessions', 'Concessions - Freshman Game', 'Work the concession stand during freshman games', 4, 2.5),
  ('FB', 'concessions', 'Concessions - JV Game', 'Work the concession stand during JV games', 6, 3),
  ('FB', 'concessions', 'Concessions - Varsity Game', 'Work the concession stand during varsity games', 8, 4),
  ('FB', 'ticketing', 'Ticket Sales', 'Sell tickets at the entrance gates', 4, 3),
  ('FB', 'gates', 'Gate Attendant', 'Check tickets and manage entry at gates', 4, 3),
  ('FB', 'parking', 'Parking Lot', 'Direct traffic and assist with parking', 2, 3);

-- Create trigger for updating filled_count on signups
CREATE OR REPLACE FUNCTION public.update_position_filled_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.volunteer_positions
    SET filled_count = (
      SELECT COUNT(*) FROM public.volunteer_signups
      WHERE position_id = NEW.position_id
      AND status NOT IN ('cancelled', 'no_show')
    )
    WHERE id = NEW.position_id;
  END IF;
  
  IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
    UPDATE public.volunteer_positions
    SET filled_count = (
      SELECT COUNT(*) FROM public.volunteer_signups
      WHERE position_id = COALESCE(OLD.position_id, NEW.position_id)
      AND status NOT IN ('cancelled', 'no_show')
    )
    WHERE id = COALESCE(OLD.position_id, NEW.position_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trigger_update_position_filled_count
AFTER INSERT OR UPDATE OR DELETE ON public.volunteer_signups
FOR EACH ROW EXECUTE FUNCTION public.update_position_filled_count();