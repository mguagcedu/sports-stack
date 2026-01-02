-- Fundraising Campaigns Table
CREATE TABLE public.fundraising_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  goal_amount NUMERIC NOT NULL DEFAULT 0,
  current_amount NUMERIC NOT NULL DEFAULT 0,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  campaign_type TEXT DEFAULT 'general' CHECK (campaign_type IN ('general', 'team', 'equipment', 'travel', 'facility')),
  image_url TEXT,
  is_public BOOLEAN DEFAULT false,
  created_by_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sponsors Table
CREATE TABLE public.sponsors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  tier TEXT NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'title')),
  annual_commitment NUMERIC DEFAULT 0,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Campaign Sponsors (junction)
CREATE TABLE public.campaign_sponsors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.fundraising_campaigns(id) ON DELETE CASCADE NOT NULL,
  sponsor_id UUID REFERENCES public.sponsors(id) ON DELETE CASCADE NOT NULL,
  contribution_amount NUMERIC DEFAULT 0,
  sponsorship_level TEXT,
  logo_placement TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, sponsor_id)
);

-- Campaign Donations
CREATE TABLE public.campaign_donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.fundraising_campaigns(id) ON DELETE CASCADE NOT NULL,
  donor_name TEXT,
  donor_email TEXT,
  donor_user_id UUID,
  amount NUMERIC NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  message TEXT,
  payment_reference TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.fundraising_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_donations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fundraising_campaigns
CREATE POLICY "Authenticated users can view active public campaigns"
ON public.fundraising_campaigns FOR SELECT
USING (is_public = true AND status = 'active');

CREATE POLICY "Org members can view their campaigns"
ON public.fundraising_campaigns FOR SELECT
USING (
  has_role(auth.uid(), 'system_admin'::app_role) OR
  has_role(auth.uid(), 'org_admin'::app_role) OR
  has_role(auth.uid(), 'finance_admin'::app_role) OR
  has_role(auth.uid(), 'athletic_director'::app_role) OR
  has_role(auth.uid(), 'coach'::app_role)
);

CREATE POLICY "Admins can manage campaigns"
ON public.fundraising_campaigns FOR ALL
USING (
  has_role(auth.uid(), 'system_admin'::app_role) OR
  has_role(auth.uid(), 'org_admin'::app_role) OR
  has_role(auth.uid(), 'finance_admin'::app_role) OR
  has_role(auth.uid(), 'athletic_director'::app_role)
);

-- RLS Policies for sponsors
CREATE POLICY "Authenticated users can view sponsors"
ON public.sponsors FOR SELECT
USING (true);

CREATE POLICY "Admins can manage sponsors"
ON public.sponsors FOR ALL
USING (
  has_role(auth.uid(), 'system_admin'::app_role) OR
  has_role(auth.uid(), 'org_admin'::app_role) OR
  has_role(auth.uid(), 'finance_admin'::app_role)
);

-- RLS Policies for campaign_sponsors
CREATE POLICY "Authenticated users can view campaign sponsors"
ON public.campaign_sponsors FOR SELECT
USING (true);

CREATE POLICY "Admins can manage campaign sponsors"
ON public.campaign_sponsors FOR ALL
USING (
  has_role(auth.uid(), 'system_admin'::app_role) OR
  has_role(auth.uid(), 'org_admin'::app_role) OR
  has_role(auth.uid(), 'finance_admin'::app_role)
);

-- RLS Policies for campaign_donations
CREATE POLICY "Users can view donations on public campaigns"
ON public.campaign_donations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.fundraising_campaigns fc
    WHERE fc.id = campaign_id AND fc.is_public = true
  ) OR
  has_role(auth.uid(), 'system_admin'::app_role) OR
  has_role(auth.uid(), 'org_admin'::app_role) OR
  has_role(auth.uid(), 'finance_admin'::app_role)
);

CREATE POLICY "Anyone can donate to active public campaigns"
ON public.campaign_donations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.fundraising_campaigns fc
    WHERE fc.id = campaign_id AND fc.is_public = true AND fc.status = 'active'
  )
);

CREATE POLICY "Admins can manage donations"
ON public.campaign_donations FOR ALL
USING (
  has_role(auth.uid(), 'system_admin'::app_role) OR
  has_role(auth.uid(), 'org_admin'::app_role) OR
  has_role(auth.uid(), 'finance_admin'::app_role)
);

-- Triggers for updated_at
CREATE TRIGGER update_fundraising_campaigns_updated_at
BEFORE UPDATE ON public.fundraising_campaigns
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sponsors_updated_at
BEFORE UPDATE ON public.sponsors
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();