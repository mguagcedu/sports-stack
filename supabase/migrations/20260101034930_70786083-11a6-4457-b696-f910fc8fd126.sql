-- Create equipment inventory system

-- Equipment items master table (what equipment exists)
CREATE TABLE public.equipment_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- e.g., 'uniform', 'protective', 'training', 'game_equipment'
  sport_code TEXT, -- optional: for sport-specific equipment
  sku TEXT, -- internal SKU or product code
  barcode TEXT, -- barcode/QR code value
  unit_cost NUMERIC(10,2),
  total_quantity INTEGER NOT NULL DEFAULT 0,
  available_quantity INTEGER NOT NULL DEFAULT 0,
  reorder_threshold INTEGER, -- alert when available drops below this
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  CONSTRAINT equipment_items_org_or_school CHECK (
    (organization_id IS NOT NULL AND school_id IS NULL) OR
    (organization_id IS NULL AND school_id IS NOT NULL) OR
    (organization_id IS NOT NULL AND school_id IS NOT NULL)
  )
);

-- Equipment checkout/handout records
CREATE TABLE public.equipment_checkouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_item_id UUID NOT NULL REFERENCES public.equipment_items(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  team_member_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
  user_id UUID NOT NULL, -- the athlete/user who received the item
  checked_out_by_user_id UUID NOT NULL, -- coach/manager who handed it out
  quantity INTEGER NOT NULL DEFAULT 1,
  checkout_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expected_return_date DATE,
  actual_return_date TIMESTAMP WITH TIME ZONE,
  return_received_by_user_id UUID, -- who accepted the return
  condition_on_checkout TEXT DEFAULT 'good', -- good, fair, worn, damaged
  condition_on_return TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'checked_out', -- checked_out, returned, lost, damaged
  tracking_method TEXT DEFAULT 'manual', -- manual, qr, barcode, sticker
  tracking_code TEXT, -- unique code for this specific item instance (if serialized)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Equipment sizes (for uniforms and apparel)
CREATE TABLE public.equipment_sizes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_item_id UUID NOT NULL REFERENCES public.equipment_items(id) ON DELETE CASCADE,
  size_label TEXT NOT NULL, -- XS, S, M, L, XL, XXL, or numeric
  quantity INTEGER NOT NULL DEFAULT 0,
  available_quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(equipment_item_id, size_label)
);

-- Enable RLS
ALTER TABLE public.equipment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_checkouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_sizes ENABLE ROW LEVEL SECURITY;

-- Equipment Items Policies
CREATE POLICY "Authenticated users can view equipment items"
ON public.equipment_items FOR SELECT
USING (true);

CREATE POLICY "Coaches and admins can manage equipment items"
ON public.equipment_items FOR ALL
USING (
  has_role(auth.uid(), 'system_admin') OR
  has_role(auth.uid(), 'org_admin') OR
  has_role(auth.uid(), 'athletic_director') OR
  has_role(auth.uid(), 'coach') OR
  has_role(auth.uid(), 'team_manager')
);

-- Equipment Checkouts Policies
CREATE POLICY "Users can view checkouts for their teams or themselves"
ON public.equipment_checkouts FOR SELECT
USING (
  user_id = auth.uid() OR
  has_role(auth.uid(), 'system_admin') OR
  has_role(auth.uid(), 'org_admin') OR
  has_role(auth.uid(), 'athletic_director') OR
  has_role(auth.uid(), 'coach') OR
  has_role(auth.uid(), 'team_manager')
);

CREATE POLICY "Staff can manage equipment checkouts"
ON public.equipment_checkouts FOR ALL
USING (
  has_role(auth.uid(), 'system_admin') OR
  has_role(auth.uid(), 'org_admin') OR
  has_role(auth.uid(), 'athletic_director') OR
  has_role(auth.uid(), 'coach') OR
  has_role(auth.uid(), 'team_manager')
);

-- Equipment Sizes Policies
CREATE POLICY "Authenticated users can view equipment sizes"
ON public.equipment_sizes FOR SELECT
USING (true);

CREATE POLICY "Staff can manage equipment sizes"
ON public.equipment_sizes FOR ALL
USING (
  has_role(auth.uid(), 'system_admin') OR
  has_role(auth.uid(), 'org_admin') OR
  has_role(auth.uid(), 'coach') OR
  has_role(auth.uid(), 'team_manager')
);

-- Triggers for updated_at
CREATE TRIGGER update_equipment_items_updated_at
  BEFORE UPDATE ON public.equipment_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_equipment_checkouts_updated_at
  BEFORE UPDATE ON public.equipment_checkouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add equipment tracking feature to subscription_features
INSERT INTO public.subscription_features (tier, feature_key, feature_name, description, enabled) VALUES
  ('school', 'equipment_tracking', 'Equipment Tracking', 'Track equipment handouts and returns with QR/barcode support', true),
  ('district', 'equipment_tracking', 'Equipment Tracking', 'Track equipment handouts and returns with QR/barcode support', true),
  ('enterprise', 'equipment_tracking', 'Equipment Tracking', 'Track equipment handouts and returns with QR/barcode support', true);
