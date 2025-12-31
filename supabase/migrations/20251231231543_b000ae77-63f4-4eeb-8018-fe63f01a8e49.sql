-- Priority 2: Team Members table for roster management
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('athlete', 'coach', 'assistant_coach', 'team_manager', 'trainer')),
  jersey_number TEXT,
  position TEXT,
  is_captain BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, user_id, role)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for team_members
CREATE POLICY "Authenticated users can view team members"
ON public.team_members FOR SELECT
USING (true);

CREATE POLICY "Team coaches can manage team members"
ON public.team_members FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.team_id = team_members.team_id
    AND ur.role IN ('coach', 'assistant_coach', 'team_manager')
  )
  OR public.has_role(auth.uid(), 'system_admin')
  OR public.has_role(auth.uid(), 'org_admin')
);

-- Priority 3: Registrations table
CREATE TABLE public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  athlete_user_id UUID NOT NULL,
  parent_user_id UUID,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'waitlisted', 'withdrawn')),
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  medical_notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view registrations they're involved in"
ON public.registrations FOR SELECT
USING (
  athlete_user_id = auth.uid()
  OR parent_user_id = auth.uid()
  OR public.has_role(auth.uid(), 'system_admin')
  OR public.has_role(auth.uid(), 'org_admin')
  OR public.has_role(auth.uid(), 'coach')
  OR public.has_role(auth.uid(), 'athletic_director')
);

CREATE POLICY "Users can create registrations"
ON public.registrations FOR INSERT
WITH CHECK (athlete_user_id = auth.uid() OR parent_user_id = auth.uid());

CREATE POLICY "Admins can manage registrations"
ON public.registrations FOR ALL
USING (
  public.has_role(auth.uid(), 'system_admin')
  OR public.has_role(auth.uid(), 'org_admin')
  OR public.has_role(auth.uid(), 'athletic_director')
);

-- Priority 3: Events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('game', 'tournament', 'practice', 'meeting', 'other')),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  venue_name TEXT,
  venue_address TEXT,
  home_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  away_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  ticket_price DECIMAL(10,2) DEFAULT 0,
  max_capacity INTEGER,
  tickets_sold INTEGER DEFAULT 0,
  is_cancelled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view events"
ON public.events FOR SELECT
USING (true);

CREATE POLICY "Org admins can manage events"
ON public.events FOR ALL
USING (
  public.has_org_role(auth.uid(), organization_id)
  OR public.has_role(auth.uid(), 'system_admin')
);

-- Priority 3: Event Tickets table
CREATE TABLE public.event_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  purchaser_user_id UUID,
  purchaser_email TEXT NOT NULL,
  purchaser_name TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'refunded', 'failed')),
  payment_id TEXT,
  purchased_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.event_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tickets"
ON public.event_tickets FOR SELECT
USING (
  purchaser_user_id = auth.uid()
  OR public.has_role(auth.uid(), 'system_admin')
  OR public.has_role(auth.uid(), 'org_admin')
);

CREATE POLICY "Users can purchase tickets"
ON public.event_tickets FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can manage tickets"
ON public.event_tickets FOR ALL
USING (
  public.has_role(auth.uid(), 'system_admin')
  OR public.has_role(auth.uid(), 'org_admin')
);

-- Priority 3: Payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_type TEXT NOT NULL CHECK (payment_type IN ('registration', 'ticket', 'membership', 'donation', 'other')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
  description TEXT,
  reference_id UUID,
  reference_type TEXT,
  stripe_payment_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payments"
ON public.payments FOR SELECT
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'system_admin')
  OR public.has_role(auth.uid(), 'org_admin')
  OR public.has_role(auth.uid(), 'finance_admin')
);

CREATE POLICY "Admins can manage payments"
ON public.payments FOR ALL
USING (
  public.has_role(auth.uid(), 'system_admin')
  OR public.has_role(auth.uid(), 'org_admin')
  OR public.has_role(auth.uid(), 'finance_admin')
);

-- Add update triggers
CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_registrations_updated_at
  BEFORE UPDATE ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();