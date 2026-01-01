-- Add new columns to team_volunteer_settings for enhanced configuration
ALTER TABLE public.team_volunteer_settings
ADD COLUMN IF NOT EXISTS tracking_type TEXT DEFAULT 'events' CHECK (tracking_type IN ('hours', 'events')),
ADD COLUMN IF NOT EXISTS required_events INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS deposit_refund_method TEXT DEFAULT 'original_payment' CHECK (deposit_refund_method IN ('original_payment', 'cash', 'credit')),
ADD COLUMN IF NOT EXISTS reward_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reward_threshold_events INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reward_threshold_hours NUMERIC DEFAULT 0;

-- Add new columns to volunteer_signups for enhanced tracking
ALTER TABLE public.volunteer_signups
ADD COLUMN IF NOT EXISTS events_credited INTEGER DEFAULT 0;

-- Add new columns to volunteer_fee_deposits
ALTER TABLE public.volunteer_fee_deposits
ADD COLUMN IF NOT EXISTS required_events INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS completed_events INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS refund_method TEXT DEFAULT 'original_payment' CHECK (refund_method IN ('original_payment', 'cash', 'credit'));

-- Create volunteer exclusions table for excluding certain users (coaches, etc.)
CREATE TABLE IF NOT EXISTS public.volunteer_exclusions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  excluded_by_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on volunteer_exclusions
ALTER TABLE public.volunteer_exclusions ENABLE ROW LEVEL SECURITY;

-- Policies for volunteer_exclusions
CREATE POLICY "Managers can manage exclusions"
ON public.volunteer_exclusions
FOR ALL
USING (
  has_role(auth.uid(), 'system_admin') OR
  has_role(auth.uid(), 'org_admin') OR
  has_role(auth.uid(), 'coach') OR
  has_role(auth.uid(), 'athletic_director')
);

CREATE POLICY "Users can view exclusions"
ON public.volunteer_exclusions
FOR SELECT
USING (
  user_id = auth.uid() OR
  has_role(auth.uid(), 'system_admin') OR
  has_role(auth.uid(), 'org_admin') OR
  has_role(auth.uid(), 'coach')
);

-- Create volunteer rewards table
CREATE TABLE IF NOT EXISTS public.volunteer_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('free_admission', 'event_pass', 'swag', 'credit')),
  reward_name TEXT NOT NULL,
  monetary_value NUMERIC DEFAULT 0,
  description TEXT,
  is_redeemed BOOLEAN DEFAULT false,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on volunteer_rewards
ALTER TABLE public.volunteer_rewards ENABLE ROW LEVEL SECURITY;

-- Policies for volunteer_rewards
CREATE POLICY "Users can view their rewards"
ON public.volunteer_rewards
FOR SELECT
USING (
  user_id = auth.uid() OR
  has_role(auth.uid(), 'system_admin') OR
  has_role(auth.uid(), 'org_admin') OR
  has_role(auth.uid(), 'coach')
);

CREATE POLICY "Managers can manage rewards"
ON public.volunteer_rewards
FOR ALL
USING (
  has_role(auth.uid(), 'system_admin') OR
  has_role(auth.uid(), 'org_admin') OR
  has_role(auth.uid(), 'coach')
);

-- Create volunteer reward templates for easy reward creation
CREATE TABLE IF NOT EXISTS public.volunteer_reward_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('free_admission', 'event_pass', 'swag', 'credit')),
  reward_name TEXT NOT NULL,
  monetary_value NUMERIC DEFAULT 0,
  description TEXT,
  events_required INTEGER DEFAULT 0,
  hours_required NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on reward templates
ALTER TABLE public.volunteer_reward_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view reward templates"
ON public.volunteer_reward_templates
FOR SELECT
USING (true);

CREATE POLICY "Managers can manage reward templates"
ON public.volunteer_reward_templates
FOR ALL
USING (
  has_role(auth.uid(), 'system_admin') OR
  has_role(auth.uid(), 'org_admin') OR
  has_role(auth.uid(), 'coach')
);

-- Create financial ledger table for comprehensive tracking
CREATE TABLE IF NOT EXISTS public.financial_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL CHECK (category IN (
    'equipment_purchase', 'equipment_refurbishment', 'equipment_sale',
    'concession_purchase', 'concession_sale',
    'registration_fee', 'volunteer_deposit', 'volunteer_deposit_refund',
    'fundraising', 'donation', 'sponsorship',
    'budget_allocation', 'budget_carryover',
    'ticket_sale', 'merchandise', 'other_income', 'other_expense'
  )),
  subcategory TEXT,
  description TEXT,
  amount NUMERIC NOT NULL,
  is_income BOOLEAN NOT NULL DEFAULT true,
  reference_type TEXT,
  reference_id UUID,
  fiscal_year TEXT,
  created_by_user_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on financial_ledger
ALTER TABLE public.financial_ledger ENABLE ROW LEVEL SECURITY;

-- Policies for financial_ledger
CREATE POLICY "Finance admins can manage ledger"
ON public.financial_ledger
FOR ALL
USING (
  has_role(auth.uid(), 'system_admin') OR
  has_role(auth.uid(), 'org_admin') OR
  has_role(auth.uid(), 'finance_admin') OR
  has_role(auth.uid(), 'athletic_director')
);

CREATE POLICY "Coaches can view their team ledger"
ON public.financial_ledger
FOR SELECT
USING (
  has_role(auth.uid(), 'coach') OR
  has_role(auth.uid(), 'head_coach')
);

-- Create concession tracking tables
CREATE TABLE IF NOT EXISTS public.concession_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  purchase_cost NUMERIC DEFAULT 0,
  sale_price NUMERIC DEFAULT 0,
  current_inventory INTEGER DEFAULT 0,
  reorder_threshold INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on concession_items
ALTER TABLE public.concession_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view concession items"
ON public.concession_items
FOR SELECT
USING (true);

CREATE POLICY "Managers can manage concession items"
ON public.concession_items
FOR ALL
USING (
  has_role(auth.uid(), 'system_admin') OR
  has_role(auth.uid(), 'org_admin') OR
  has_role(auth.uid(), 'finance_admin')
);

-- Create concession transactions
CREATE TABLE IF NOT EXISTS public.concession_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  concession_item_id UUID REFERENCES public.concession_items(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'sale', 'adjustment', 'waste')),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  total_amount NUMERIC NOT NULL,
  notes TEXT,
  recorded_by_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on concession_transactions
ALTER TABLE public.concession_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance users can view concession transactions"
ON public.concession_transactions
FOR SELECT
USING (
  has_role(auth.uid(), 'system_admin') OR
  has_role(auth.uid(), 'org_admin') OR
  has_role(auth.uid(), 'finance_admin') OR
  has_role(auth.uid(), 'coach')
);

CREATE POLICY "Finance users can manage concession transactions"
ON public.concession_transactions
FOR ALL
USING (
  has_role(auth.uid(), 'system_admin') OR
  has_role(auth.uid(), 'org_admin') OR
  has_role(auth.uid(), 'finance_admin')
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_volunteer_exclusions_user ON public.volunteer_exclusions(user_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_exclusions_team ON public.volunteer_exclusions(team_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_rewards_user ON public.volunteer_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_rewards_team ON public.volunteer_rewards(team_id);
CREATE INDEX IF NOT EXISTS idx_financial_ledger_org ON public.financial_ledger(organization_id);
CREATE INDEX IF NOT EXISTS idx_financial_ledger_team ON public.financial_ledger(team_id);
CREATE INDEX IF NOT EXISTS idx_financial_ledger_category ON public.financial_ledger(category);
CREATE INDEX IF NOT EXISTS idx_financial_ledger_date ON public.financial_ledger(transaction_date);
CREATE INDEX IF NOT EXISTS idx_concession_transactions_item ON public.concession_transactions(concession_item_id);
CREATE INDEX IF NOT EXISTS idx_concession_transactions_event ON public.concession_transactions(event_id);